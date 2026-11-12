import { authRequest } from './http';

export const getStats = () => authRequest('/users/me/stats');