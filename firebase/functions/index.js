const crypto = require('node:crypto');
const { setGlobalOptions } = require('firebase-functions/v2');
const { HttpsError, onCall, onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { calculateFare } = require('./src/pricing');

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const db = getFirestore();
const MERCADO_PAGO_API = 'https://api.mercadopago.com';

// URL pública de una función. En gen2 es https://<region>-<proyecto>.cloudfunctions.net/<nombre>.
// Se puede sobreescribir con variables de entorno si se usa un dominio propio.
const projectId = process.env.GCLOUD_PROJECT || 'uberclone-7afa6';
const functionUrl = (name) => `https://us-central1-${projectId}.cloudfunctions.net/${name}`;

const mercadoPagoToken = () => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new HttpsError(
      'failed-precondition',
      'Falta MERCADO_PAGO_ACCESS_TOKEN. Configúralo en firebase/functions/.env'
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

// Crea la preferencia de Checkout Pro. Devuelve el init_point que la app abre
// en el navegador del teléfono.
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
  if (trip.paymentMethod !== 'mercadopago') {
    throw new HttpsError('failed-precondition', 'El viaje está marcado como efectivo');
  }
  if (trip.status === 'paid' || trip.paymentStatus === 'approved') {
    return { alreadyPaid: true, amount: Math.round(trip.fare ?? 0) + Math.round(trip.tip ?? 0) };
  }
  if (trip.status !== 'completed') {
    throw new HttpsError('failed-precondition', 'El viaje todavía no está finalizado');
  }

  const fare = fareFor(trip);
  const tip = Math.round(trip.tip ?? 0);
  const amount = fare + tip;

  if (Number(trip.fare) !== fare) {
    console.warn(`Tarifa recalculada para ${tripId}: ${trip.fare} -> ${fare}`);
  }

  const backUrl = process.env.MERCADO_PAGO_BACK_URL || functionUrl('paymentReturn');

  const preference = {
    items: [
      {
        id: tripId,
        title: `Viaje UberClone (${trip.category ?? 'economy'})`,
        description: `${trip.origin?.name ?? 'Origen'} → ${trip.destination?.name ?? 'Destino'}`,
        quantity: 1,
        currency_id: trip.currency ?? 'COP',
        unit_price: amount,
      },
    ],
    external_reference: tripId,
    metadata: { tripId, passengerId: trip.passengerId },
    statement_descriptor: 'UBERCLONE',
    notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL || functionUrl('mercadoPagoWebhook'),
    back_urls: { success: backUrl, failure: backUrl, pending: backUrl },
    auto_return: 'approved',
  };

  const response = await fetch(`${MERCADO_PAGO_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mercadoPagoToken()}`,
      'Content-Type': 'application/json',
      // Evita preferencias duplicadas si el pasajero toca el botón dos veces.
      'X-Idempotency-Key': `${tripId}-${trip.status}`,
    },
    body: JSON.stringify(preference),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Mercado Pago rechazó la preferencia:', data);
    throw new HttpsError('internal', 'No se pudo crear la preferencia de pago');
  }

  // En modo prueba hay que abrir el checkout de sandbox. Para producción se
  // define MERCADO_PAGO_SANDBOX=false en el .env.
  const sandbox = process.env.MERCADO_PAGO_SANDBOX !== 'false';
  const initPoint = sandbox ? data.sandbox_init_point || data.init_point : data.init_point;

  await ref.update({
    paymentPreferenceId: String(data.id),
    paymentMethod: 'mercadopago',
    paymentStatus: 'pending',
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { preferenceId: data.id, initPoint, amount };
});

// Verifica la firma HMAC que envía Mercado Pago en x-signature.
// Si no hay secreto configurado se acepta (útil en pruebas locales).
const validSignature = (req, paymentId) => {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  if (!signature || !requestId) return false;

  const parts = Object.fromEntries(
    String(signature)
      .split(',')
      .map((part) => part.split('=').map((value) => value.trim()))
  );
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${String(paymentId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  if (expected.length !== parts.v1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
};

// Webhook de Mercado Pago. Se vuelve a consultar el pago contra la API para
// no confiar en el cuerpo de la notificación.
exports.mercadoPagoWebhook = onRequest(async (req, res) => {
  const paymentId = req.query['data.id'] ?? req.body?.data?.id;
  const type = req.query.type ?? req.body?.type;

  if (!paymentId || (type && type !== 'payment')) {
    res.status(200).send('ignored');
    return;
  }

  if (!validSignature(req, paymentId)) {
    console.warn('Firma inválida en el webhook de Mercado Pago');
    res.status(401).send('invalid signature');
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

    const ref = db.collection('trips').doc(tripId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      res.status(200).send('ignored');
      return;
    }

    const trip = snapshot.data();

    // El monto del pago debe coincidir con la tarifa calculada en el servidor.
    const expectedAmount = fareFor(trip) + Math.round(trip.tip ?? 0);
    if (Number(payment.transaction_amount) !== expectedAmount) {
      console.error(
        `Monto incorrecto para ${tripId}: pagó ${payment.transaction_amount}, esperado ${expectedAmount}`
      );
      res.status(400).send('amount mismatch');
      return;
    }

    const approved = payment.status === 'approved';
    const rejected = ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status);

    const update = {
      paymentStatus: approved ? 'approved' : rejected ? 'rejected' : 'pending',
      paymentId: String(paymentId),
      paymentAmount: Math.round(payment.transaction_amount),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (approved) {
      update.status = 'paid';
      update.paidAt = FieldValue.serverTimestamp();
      update.paymentMethod = 'mercadopago';
    }

    await ref.update(update);
    res.status(200).send('ok');
  } catch (error) {
    console.error('Error procesando el webhook:', error);
    res.status(500).send('error');
  }
});

// Página a la que Mercado Pago devuelve al usuario después de pagar.
exports.paymentReturn = onRequest((_req, res) => {
  res
    .status(200)
    .set('Content-Type', 'text/html; charset=utf-8')
    .send(`<!doctype html>
<html lang="es">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UberClone · Pago</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; display: flex; min-height: 100vh;
           align-items: center; justify-content: center; margin: 0; background: #f6f6f6; color: #111; }
    main { text-align: center; padding: 24px; }
    h1 { font-size: 20px; } p { color: #6b6b6b; }
  </style></head>
  <body><main>
    <h1>Pago procesado</h1>
    <p>Ya puedes volver a la app de UberClone para ver el estado del viaje.</p>
  </main></body>
</html>`);
});
