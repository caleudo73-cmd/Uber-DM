// Cálculo de ganancias del conductor. Funciones puras para poder probarlas sin
// React ni Firebase (mobile/scripts/earnings.test.mjs).

import { RIDE_STATUS } from '../config/constants.js';

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

// Totales del período: bruto, comisión de la plataforma, propinas y neto.
export const summarizeEarnings = (rides, period = EARNINGS_PERIODS.TODAY, now = new Date()) => {
  const from = periodStart(period, now);
  const totals = { trips: 0, gross: 0, commission: 0, tips: 0, net: 0 };

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

  return totals;
};

export const sortByDateDesc = (rides) =>
  [...rides].sort((a, b) => {
    const left = rideDate(a)?.getTime() ?? 0;
    const right = rideDate(b)?.getTime() ?? 0;
    return right - left;
  });

export const rideDateValue = rideDate;
