// AI-assisted: see docs/AI_LOG.md #9
// Filtros del historial de viajes. Funciones puras (mobile/scripts/earnings.test.mjs).

import { PAYMENT_METHOD, PAYMENT_METHOD_LABEL, RIDE_STATUS } from '../config/constants.js';
import { periodStart } from './earnings.js';

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

export const HISTORY_PERIOD_FILTERS = [
  { value: 'all', label: 'Todo' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'range', label: 'Rango' },
];

export const HISTORY_PAYMENT_FILTERS = [
  { value: 'all', label: 'Todo pago' },
  { value: PAYMENT_METHOD.CASH, label: PAYMENT_METHOD_LABEL[PAYMENT_METHOD.CASH] },
  {
    value: PAYMENT_METHOD.MERCADO_PAGO_TEST,
    label: PAYMENT_METHOD_LABEL[PAYMENT_METHOD.MERCADO_PAGO_TEST],
  },
  {
    value: PAYMENT_METHOD.MERCADO_PAGO,
    label: PAYMENT_METHOD_LABEL[PAYMENT_METHOD.MERCADO_PAGO],
  },
  { value: PAYMENT_METHOD.STRIPE, label: PAYMENT_METHOD_LABEL[PAYMENT_METHOD.STRIPE] },
];

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// El "hasta" incluye todo ese día.
const endOfDayExclusive = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

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

export const matchesPaymentFilter = (ride, filter) => {
  if (!filter || filter === 'all') return true;
  return ride.paymentMethod === filter;
};

// Períodos fijos (Hoy / Semana / Mes) o un rango inclusivo de fechas.
export const matchesPeriodFilter = (ride, filter, options = {}) => {
  if (!filter || filter === 'all') return true;

  const { now = new Date(), from = null, to = null } = options;
  const date = toDate(ride.completedAt ?? ride.createdAt);
  if (!date) return false;

  if (filter === 'range') {
    if (from && date.getTime() < startOfDay(from).getTime()) return false;
    if (to && date.getTime() >= endOfDayExclusive(to).getTime()) return false;
    return true;
  }

  if (['today', 'week', 'month'].includes(filter)) {
    return date.getTime() >= periodStart(filter, now).getTime();
  }

  return true;
};

export const filterRides = (rides, options = {}, userId) => {
  const {
    status = 'all',
    role = 'all',
    period = 'all',
    paymentMethod = 'all',
    from = null,
    to = null,
    now = new Date(),
  } = options;

  return rides.filter(
    (ride) =>
      matchesStatusFilter(ride, status) &&
      matchesRoleFilter(ride, role, userId) &&
      matchesPaymentFilter(ride, paymentMethod) &&
      matchesPeriodFilter(ride, period, { now, from, to })
  );
};

// Rol del usuario dentro del viaje, para la etiqueta de cada fila.
export const roleInRide = (ride, userId) => {
  if (ride.driverId === userId) return 'driver';
  if (ride.passengerId === userId) return 'passenger';
  return null;
};
