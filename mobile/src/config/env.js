import Constants from 'expo-constants';

// Expo Go ya conoce la IP de tu PC (la del servidor de Expo): no hay que escribirla a mano.
const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';

export const API_URL = `http://${host}:4000`;
