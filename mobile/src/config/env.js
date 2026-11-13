// Configuración leída de mobile/.env (Expo solo inyecta variables EXPO_PUBLIC_*).
// Copia mobile/.env.example a mobile/.env y completa los valores del proyecto Firebase.

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Opcional: habilita Google Distance Matrix para distancia y duración reales.
// Sin esta llave la app usa la estimación local (línea recta + duración estimada).
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export const missingFirebaseKeys = Object.entries(FIREBASE_CONFIG)
  .filter(([, value]) => !value)
  .map(([key]) => key);
