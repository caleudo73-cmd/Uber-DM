import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG, missingFirebaseKeys } from '../config/env';

export const firebaseConfigError = missingFirebaseKeys.length
  ? `Falta configurar Firebase: ${missingFirebaseKeys.join(', ')}. Copia mobile/.env.example a mobile/.env.`
  : null;

let app = null;
let auth = null;
let db = null;

if (!firebaseConfigError) {
  app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

  try {
    // Persistencia en AsyncStorage: la sesión sobrevive al cerrar la app.
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Fast Refresh: Firebase ya estaba inicializado.
    auth = getAuth(app);
  }

  db = getFirestore(app);
}

export const requireFirebase = () => {
  if (firebaseConfigError) throw new Error(firebaseConfigError);
  return { auth, db };
};

export { app, auth, db };
