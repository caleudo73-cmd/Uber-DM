import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../config/constants';

export const saveTokens = async ({ accessToken, refreshToken }) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
};

export const getAccessToken = () => SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
};
