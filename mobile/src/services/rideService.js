import { authRequest } from './http';

export const quoteRide = (origin, destination) =>
  authRequest('/rides/quote', { method: 'POST', body: { origin, destination } });

export const requestRide = (origin, destination) =>
  authRequest('/rides', { method: 'POST', body: { origin, destination } });

export const getCurrentRide = () => authRequest('/rides/current');
export const getAvailableRides = () => authRequest('/rides/available');

export const acceptRide = (id) => authRequest(`/rides/${id}/accept`, { method: 'POST' });
export const startRide = (id) => authRequest(`/rides/${id}/start`, { method: 'POST' });
export const completeRide = (id) => authRequest(`/rides/${id}/complete`, { method: 'POST' });
export const cancelRide = (id) => authRequest(`/rides/${id}/cancel`, { method: 'POST' });
