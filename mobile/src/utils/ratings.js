// Reglas de calificación del pasajero al conductor. Funciones puras para
// probarlas sin React ni Firebase (mobile/scripts/ratings.test.mjs).

import { RIDE_STATUS } from '../config/constants.js';

export const RATING_VALUES = [1, 2, 3, 4, 5];

export const RATING_LABELS = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente',
};

export const isValidRating = (value) =>
  Number.isInteger(value) && value >= 1 && value <= 5;

export const ratingLabel = (value) => RATING_LABELS[value] ?? null;

// Solo el pasajero califica, una sola vez, cuando el viaje ya terminó.
export const canRateRide = (ride, userId) =>
  Boolean(ride && userId) &&
  ride.passengerId === userId &&
  [RIDE_STATUS.COMPLETED, RIDE_STATUS.PAID].includes(ride.status) &&
  !ride.rating;

// La sección de calificación se muestra en viajes terminados (aunque ya estén
// calificados, para que el conductor vea la estrella que recibió).
export const canShowRating = (ride) =>
  Boolean(ride) &&
  [RIDE_STATUS.COMPLETED, RIDE_STATUS.PAID].includes(ride.status);
