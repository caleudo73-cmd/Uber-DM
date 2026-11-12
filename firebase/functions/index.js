const { setGlobalOptions } = require('firebase-functions/v2');
const { HttpsError, onCall, onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { calculateFare } = require('./src/pricing');

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const db = getFirestore();
const MERCADO_PAGO_API = 'https://api.mercadopago.com';

const mercadoPagoToken = () => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new HttpsError(
      'failed-precondition',
      'Falta MERCADO_PAGO_ACCESS_TOKEN en firebase/functions/.env'
    );
  }
  return token;
};

// La tarifa se recalcula en el servidor: nunca se confía en el monto que envía la app.
const fareFor = (trip) => {
  const { fare } = calculateFare({
    distanceKm: trip.distanceKm,
    durationMin: trip.durationMin,
    category: trip.category,
    tip: trip.tip,
  });
  return fare;
};

exports.health = onRequest((_req, res) => res.json({ ok: true }));

exports.createPaymentPreference = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión');

  const { tripId } = request.data ?? {};
  if (!tripId) throw new HttpsError('invalid-argument', 'tripId es obligatorio');

  const ref = db.collection('trips').doc(tripId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Viaje no encontrado');

  const trip = snapshot.data();
  if (trip.passengerId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Este viaje no es tuyo');
  }
  if (trip.status !== 'completed') {
    throw new HttpsError('failed-precondition', 'El viaje todavía no está finalizado');
  }

  const fare = fareFor(trip);
  const amount = fare + Math.round(trip.tip ?? 0);
  const backUrl = process.env.MERCADO_PAGO_BACK_URL;

  const preference = {
    items: [
      {
        id: tripId,
        title: `Viaje ${trip.category ?? 'economy'}`,
        quantity: 1,
        currency_id: trip.currency ?? 'COP',
        unit_price: amount,
      },
    ],
    external_reference: tripId,
    metadata: { tripId, passengerId: trip.passengerId },
  };

  if (process.env.MERCADO_PAGO_WEBHOOK_URL) {
    preference.notification_url = process.env.MERCADO_PAGO_WEBHOOK_URL;
  }
  if (backUrl) {
    preference.back_urls = { success: backUrl, failure: backUrl, pending: backUrl };
    preference.auto_return = 'approved';
  }

  const response = await fetch(`${MERCADO_PAGO_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mercadoPagoToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Mercado Pago rechazó la preferencia:', data);
    throw new HttpsError('internal', 'No se pudo crear la preferencia de pago');
  }

  await ref.update({
    paymentMethod: 'mercadopago',
    paymentId: String(data.id),
    paymentStatus: 'pending',
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { preferenceId: data.id, initPoint: data.init_point, amount };
});

// Webhook de Mercado Pago. Se vuelve a consultar el pago contra la API para
// no confiar en el cuerpo de la notificación.
exports.mercadoPagoWebhook = onRequest(async (req, res) => {
  const paymentId = req.query['data.id'] ?? req.body?.data?.id;
  if (!paymentId) {
    res.status(200).send('ignored');
    return;
  }

  try {
    const response = await fetch(`${MERCADO_PAGO_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mercadoPagoToken()}` },
    });
    const payment = await response.json();

    if (!response.ok) {
      console.error('No se pudo consultar el pago:', payment);
      res.status(502).send('payment lookup failed');
      return;
    }

    const tripId = payment.external_reference;
    if (!tripId) {
      res.status(200).send('ignored');
      return;
    }

    const paymentStatus =
      payment.status === 'approved' ? 'approved' : payment.status === 'rejected' ? 'rejected' : 'pending';

    const update = {
      paymentStatus,
      paymentId: String(paymentId),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (paymentStatus === 'approved') {
      update.status = 'paid';
      update.paidAt = FieldValue.serverTimestamp();
    }

    await db.collection('trips').doc(tripId).update(update);
    res.status(200).send('ok');
  } catch (error) {
    console.error('Error procesando el webhook:', error);
    res.status(500).send('error');
  }
});
