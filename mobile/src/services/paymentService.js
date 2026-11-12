import { getFunctions, httpsCallable } from 'firebase/functions';
import * as WebBrowser from 'expo-web-browser';
import theme from '../config/theme';
import { app, requireFirebase } from './firebase';

// Región donde están desplegadas las Cloud Functions de pago.
const REGION = 'us-central1';

// Traduce los códigos de Firebase a mensajes entendibles en la pantalla.
const friendlyMessage = (error) => {
  const code = error?.code ?? '';
  if (code.includes('unauthenticated')) return 'Inicia sesión para pagar.';
  if (code.includes('permission-denied')) return 'Este viaje no es tuyo.';
  if (code.includes('failed-precondition')) return error.message;
  if (code.includes('internal')) return 'Mercado Pago rechazó el pago. Intenta de nuevo.';
  return 'No se pudo iniciar el pago. Verifica que las Cloud Functions estén desplegadas.';
};

// Llama a la Cloud Function que crea la preferencia de Checkout Pro.
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

// Crea la preferencia y abre el checkout de Mercado Pago en el navegador.
// El estado real del pago llega por el webhook y se ve en tiempo real.
export const payTrip = async (tripId) => {
  const data = await createPaymentPreference(tripId);
  if (data.alreadyPaid) return { ...data, opened: false };

  await WebBrowser.openBrowserAsync(data.initPoint, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: theme.colors.primary,
    controlsColor: theme.colors.accent,
  });

  return { ...data, opened: true };
};
