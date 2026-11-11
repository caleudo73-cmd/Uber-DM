import { authRequest, publicRequest } from './http';

export const login = (email, password) =>
  publicRequest('/auth/login', { method: 'POST', body: { email, password } });

export const register = (payload) =>
  publicRequest('/auth/register', { method: 'POST', body: payload });

export const logout = (refreshToken) =>
  publicRequest('/auth/logout', { method: 'POST', body: { refreshToken } });

export const fetchMe = () => authRequest('/auth/me');
