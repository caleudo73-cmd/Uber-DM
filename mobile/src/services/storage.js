import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage solo para preferencias (idioma, último estado de disponibilidad).
// Nunca se guardan tokens, números de cuenta ni datos de tarjetas.

export const getPreference = (key) => AsyncStorage.getItem(key);

export const setPreference = (key, value) => AsyncStorage.setItem(key, String(value));

export const removePreference = (key) => AsyncStorage.removeItem(key);

export const getJSON = async (key, fallback = null) => {
  try {
    const raw = await getPreference(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const setJSON = (key, value) => setPreference(key, JSON.stringify(value));
