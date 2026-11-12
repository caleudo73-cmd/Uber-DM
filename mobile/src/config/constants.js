export const ROLES = { PASSENGER: 'passenger', DRIVER: 'driver' };

export const RIDE_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const RIDE_STATUS_LABEL = {
  requested: 'Buscando conductor...',
  accepted: 'Conductor en camino',
  in_progress: 'Viaje en curso',
  completed: 'Viaje finalizado',
  cancelled: 'Viaje cancelado',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};

export const POLLING_INTERVAL_MS = 3000;

export const DEFAULT_REGION = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export const ROLE_LABEL = { passenger: 'Pasajero', driver: 'Conductor' };
