import { API_URL } from '../config/env';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './storage';

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

const rawRequest = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Error de conexión');
    error.status = response.status;
    throw error;
  }
  return data;
};

const refreshSession = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('Sin sesión');
  const tokens = await rawRequest('/auth/refresh', { method: 'POST', body: { refreshToken } });
  await saveTokens(tokens);
  return tokens.accessToken;
};

// Petición autenticada: si el token expiró, lo renueva y reintenta una vez.
export const authRequest = async (path, options = {}) => {
  try {
    return await rawRequest(path, { ...options, token: await getAccessToken() });
  } catch (error) {
    if (error.status !== 401) throw error;
    try {
      const newToken = await refreshSession();
      return await rawRequest(path, { ...options, token: newToken });
    } catch {
      await clearTokens();
      onSessionExpired();
      throw new Error('Tu sesión expiró');
    }
  }
};

export const publicRequest = rawRequest;
