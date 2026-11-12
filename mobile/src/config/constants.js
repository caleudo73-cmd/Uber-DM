export const ROLES = { PASSENGER: 'passenger', DRIVER: 'driver' };

export const RIDE_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

export const ACTIVE_STATUSES = [
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.ACCEPTED,
  RIDE_STATUS.DRIVER_ARRIVING,
  RIDE_STATUS.IN_PROGRESS,
];

export const RIDE_STATUS_LABEL = {
  requested: 'Buscando conductor...',
  accepted: 'Conductor aceptó el viaje',
  driver_arriving: 'Conductor en camino',
  in_progress: 'Viaje en curso',
  completed: 'Viaje finalizado',
  paid: 'Viaje pagado',
  cancelled: 'Viaje cancelado',
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const APPROVAL_STATUS_LABEL = {
  pending: 'Pendiente de aprobación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export const PAYMENT_METHOD = {
  MERCADO_PAGO: 'mercadopago',
  STRIPE: 'stripe',
  CASH: 'cash',
};

export const PAYMENT_METHOD_LABEL = {
  mercadopago: 'Mercado Pago',
  stripe: 'Stripe',
  cash: 'Efectivo',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CASH: 'cash',
};

export const PAYMENT_STATUS_LABEL = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cash: 'Efectivo',
};

// Solo preferencias: la sesión la maneja Firebase Auth.
export const STORAGE_KEYS = {
  LANGUAGE: 'language',
  AVAILABILITY: 'availability',
};

export const DEFAULT_REGION = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export const ROLE_LABEL = { passenger: 'Pasajero', driver: 'Conductor' };
