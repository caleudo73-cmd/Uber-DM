// AI-assisted: see docs/AI_LOG.md #9
// Cálculo de ganancias del conductor. Funciones puras para poder probarlas sin
// React ni Firebase (mobile/scripts/earnings.test.mjs).

import { PAYMENT_METHOD, RIDE_STATUS } from '../config/constants.js';

export const EARNINGS_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
};

export const EARNINGS_PERIOD_LABEL = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Semana que empieza el lunes.
const startOfWeek = (date) => {
  const start = startOfDay(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const periodStart = (period, now = new Date()) => {
  if (period === EARNINGS_PERIODS.WEEK) return startOfWeek(now);
  if (period === EARNINGS_PERIODS.MONTH) return startOfMonth(now);
  return startOfDay(now);
};

export const isPaidRide = (ride) =>
  [RIDE_STATUS.COMPLETED, RIDE_STATUS.PAID].includes(ride.status);

const rideDate = (ride) => {
  const value = ride.completedAt ?? ride.createdAt;
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Totales del período: bruto, comisión de la plataforma, propinas, neto y
// promedio por viaje.
export const summarizeEarnings = (rides, period = EARNINGS_PERIODS.TODAY, now = new Date()) => {
  const from = periodStart(period, now);
  const totals = { trips: 0, gross: 0, commission: 0, tips: 0, net: 0, average: 0 };

  for (const ride of rides) {
    if (!isPaidRide(ride)) continue;
    const date = rideDate(ride);
    if (!date || date.getTime() < from.getTime()) continue;

    totals.trips += 1;
    totals.gross += Number(ride.fare) || 0;
    totals.commission += Number(ride.commission) || 0;
    totals.tips += Number(ride.tip) || 0;
    totals.net += Number(ride.driverEarnings) || 0;
  }

  totals.average = totals.trips > 0 ? Math.round(totals.net / totals.trips) : 0;
  return totals;
};

// Métodos en los que el dinero entra por la plataforma y luego se le paga al
// conductor. El efectivo lo recibe el conductor directamente, así que solo
// queda como deuda la comisión de esos viajes.
export const isCardPayment = (method) =>
  [PAYMENT_METHOD.MERCADO_PAGO, PAYMENT_METHOD.MERCADO_PAGO_TEST, PAYMENT_METHOD.STRIPE].includes(
    method
  );

// Saldo del conductor con la plataforma. Puede quedar negativo si cobró más
// viajes en efectivo que con tarjeta.
export const summarizeBalance = (rides) => {
  const totals = { balance: 0, cardEarnings: 0, cashCommission: 0, trips: 0 };

  for (const ride of rides) {
    if (ride.status !== RIDE_STATUS.PAID) continue;

    if (isCardPayment(ride.paymentMethod)) {
      const earnings = Number(ride.driverEarnings) || 0;
      totals.cardEarnings += earnings;
      totals.balance += earnings;
      totals.trips += 1;
    } else if (ride.paymentMethod === PAYMENT_METHOD.CASH) {
      const commission = Number(ride.commission) || 0;
      totals.cashCommission += commission;
      totals.balance -= commission;
      totals.trips += 1;
    }
  }

  return totals;
};

export const sortByDateDesc = (rides) =>
  [...rides].sort((a, b) => {
    const left = rideDate(a)?.getTime() ?? 0;
    const right = rideDate(b)?.getTime() ?? 0;
    return right - left;
  });

export const rideDateValue = rideDate;
