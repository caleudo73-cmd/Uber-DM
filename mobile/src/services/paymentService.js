import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import * as WebBrowser from 'expo-web-browser';
import { PAYMENT_METHOD, RIDE_STATUS } from '../config/constants';
import theme from '../config/theme';
import { buildTestPaymentUpdate, PAYMENT_OUTCOME } from '../utils/payments';
import { app, requireFirebase } from './firebase';

const TRIPS = 'trips';

// ---------------------------------------------------------------------------
// Pago de PRUEBA (camino activo)
//
// Simula el resultado del checkout dentro de la app. No hay pasarela, no se
// cobra dinero real y no se necesitan Cloud Functions. El viaje se cierra con
// `paymentStatus: approved` y `status: paid` para que el resto del flujo
// (ganancias, historial, conductor) funcione igual que con un pago real.
// ---------------------------------------------------------------------------
export const payWithTestCard = async (tripId, outcome = PAYMENT_OUTCOME.APPROVED) => {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión para pagar');

  const ref = doc(db, TRIPS, tripId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ese viaje ya no existe');

    const trip = { id: tripId, ...snapshot.data() };
    if (trip.passengerId !== user.uid) throw new Error('Este viaje no es tuyo');
    if (trip.paymentMethod !== PAYMENT_METHOD.MERCADO_PAGO_TEST) {
      throw new Error('Este viaje no usa el pago de prueba');
    }
    if (trip.status !== RIDE_STATUS.COMPLETED) {
      throw new Error('El viaje todavía no está finalizado');
    }

    const update = buildTestPaymentUpdate(trip, outcome);
    transaction.update(ref, {
      ...update,
      updatedAt: serverTimestamp(),
      ...(outcome === PAYMENT_OUTCOME.APPROVED ? { paidAt: serverTimestamp() } : {}),
    });
  });

  return { id: tripId, outcome };
};

// ---------------------------------------------------------------------------
// Pago REAL con Mercado Pago (camino opcional)
//
// Requiere el plan Blaze y las Cloud Functions desplegadas. La app pide la
// preferencia de Checkout Pro y la abre en el navegador; el webhook confirma el
// pago y actualiza el viaje. Ver docs/PAYMENTS.md.
// ---------------------------------------------------------------------------
const REGION = 'us-central1';

const friendlyMessage = (error) => {
  const code = error?.code ?? '';
  if (code.includes('unauthenticated')) return 'Inicia sesión para pagar.';
  if (code.includes('permission-denied')) return 'Este viaje no es tuyo.';
  if (code.includes('failed-precondition')) return error.message;
  if (code.includes('internal')) return 'Mercado Pago rechazó el pago. Intenta de nuevo.';
  return 'No se pudo iniciar el pago. Verifica que las Cloud Functions estén desplegadas.';
};

export const createPaymentPreference = async (tripId) => {
  requireFirebase();
  const functions = getFunctions(app, REGION);
  const callable = httpsCallable(functions, 'createPaymentPreference');

  try {
    const { data } = await callable({ tripId });
    return data;
  } catch (error) {
    throw new Error(friendlyMessage(error));
  }
};

export const startMercadoPagoCheckout = async (tripId) => {
  const data = await createPaymentPreference(tripId);
  if (data.alreadyPaid) return { ...data, opened: false };

  await WebBrowser.openBrowserAsync(data.initPoint, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: theme.colors.primary,
    controlsColor: theme.colors.accent,
  });

  return { ...data, opened: true };
};
