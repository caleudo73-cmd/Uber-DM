// Filtros del historial de viajes. Funciones puras (mobile/scripts/history.test.mjs).

import { RIDE_STATUS } from '../config/constants.js';

export const HISTORY_STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
];

export const HISTORY_ROLE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'passenger', label: 'Como pasajero' },
  { value: 'driver', label: 'Como conductor' },
];

export const matchesStatusFilter = (ride, filter) => {
  if (filter === 'completed') {
    return [RIDE_STATUS.COMPLETED, RIDE_STATUS.PAID].includes(ride.status);
  }
  if (filter === 'cancelled') return ride.status === RIDE_STATUS.CANCELLED;
  return true;
};

export const matchesRoleFilter = (ride, filter, userId) => {
  if (filter === 'passenger') return ride.passengerId === userId;
  if (filter === 'driver') return ride.driverId === userId;
  return true;
};

export const filterRides = (rides, { status = 'all', role = 'all' } = {}, userId) =>
  rides.filter(
    (ride) => matchesStatusFilter(ride, status) && matchesRoleFilter(ride, role, userId)
  );

// Rol del usuario dentro del viaje, para la etiqueta de cada fila.
export const roleInRide = (ride, userId) => {
  if (ride.driverId === userId) return 'driver';
  if (ride.passengerId === userId) return 'passenger';
  return null;
};
