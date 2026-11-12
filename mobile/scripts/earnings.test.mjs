// Pruebas de ganancias por período y filtros del historial.
// Se ejecutan con: npm test

import assert from 'node:assert/strict';
import { RIDE_STATUS } from '../src/config/constants.js';
import {
  EARNINGS_PERIODS,
  periodStart,
  sortByDateDesc,
  summarizeEarnings,
} from '../src/utils/earnings.js';
import { filterRides, matchesRoleFilter, matchesStatusFilter, roleInRide } from '../src/utils/history.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// Miércoles 11 de noviembre de 2026, 15:00 hora local.
const NOW = new Date(2026, 10, 11, 15, 0, 0);

const ride = (overrides) => ({
  id: 'r',
  status: RIDE_STATUS.PAID,
  fare: 10000,
  commission: 2000,
  tip: 0,
  driverEarnings: 8000,
  completedAt: NOW.toISOString(),
  ...overrides,
});

const at = (daysAgo, hour = 12) =>
  new Date(2026, 10, 11 - daysAgo, hour, 0, 0).toISOString();

test('Hoy solo cuenta los viajes de hoy', () => {
  const rides = [
    ride({ id: 'a', completedAt: at(0) }),
    ride({ id: 'b', completedAt: at(1) }),
    ride({ id: 'c', completedAt: at(40) }),
  ];
  const totals = summarizeEarnings(rides, EARNINGS_PERIODS.TODAY, NOW);
  assert.equal(totals.trips, 1);
  assert.equal(totals.net, 8000);
});

test('La semana empieza el lunes', () => {
  const monday = periodStart(EARNINGS_PERIODS.WEEK, NOW);
  assert.equal(monday.getDay(), 1);
  assert.equal(monday.getDate(), 9);

  const rides = [ride({ id: 'a', completedAt: at(2) }), ride({ id: 'b', completedAt: at(4) })];
  const totals = summarizeEarnings(rides, EARNINGS_PERIODS.WEEK, NOW);
  assert.equal(totals.trips, 1); // el de hace 4 días es del viernes anterior
});

test('El mes empieza el día 1', () => {
  const start = periodStart(EARNINGS_PERIODS.MONTH, NOW);
  assert.equal(start.getDate(), 1);
  assert.equal(start.getMonth(), 10);
});

test('Suma bruto, comisión, propinas y neto', () => {
  const rides = [
    ride({ id: 'a', fare: 13000, commission: 2600, tip: 1000, driverEarnings: 11400 }),
    ride({ id: 'b', fare: 20000, commission: 4000, tip: 0, driverEarnings: 16000 }),
  ];
  const totals = summarizeEarnings(rides, EARNINGS_PERIODS.TODAY, NOW);
  assert.deepEqual(totals, { trips: 2, gross: 33000, commission: 6600, tips: 1000, net: 27400 });
});

test('Ignora viajes cancelados o sin pagar', () => {
  const rides = [
    ride({ id: 'a', status: RIDE_STATUS.CANCELLED }),
    ride({ id: 'b', status: RIDE_STATUS.IN_PROGRESS }),
    ride({ id: 'c', status: RIDE_STATUS.COMPLETED }),
  ];
  const totals = summarizeEarnings(rides, EARNINGS_PERIODS.TODAY, NOW);
  assert.equal(totals.trips, 1);
});

test('Ordena del más reciente al más antiguo', () => {
  const rides = [
    ride({ id: 'old', completedAt: at(5) }),
    ride({ id: 'new', completedAt: at(0) }),
    ride({ id: 'mid', completedAt: at(2) }),
  ];
  assert.deepEqual(
    sortByDateDesc(rides).map((item) => item.id),
    ['new', 'mid', 'old']
  );
});

test('Filtros de estado del historial', () => {
  const paid = ride({ status: RIDE_STATUS.PAID });
  const cancelled = ride({ status: RIDE_STATUS.CANCELLED });
  const inProgress = ride({ status: RIDE_STATUS.IN_PROGRESS });

  assert.equal(matchesStatusFilter(paid, 'all'), true);
  assert.equal(matchesStatusFilter(paid, 'completed'), true);
  assert.equal(matchesStatusFilter(cancelled, 'completed'), false);
  assert.equal(matchesStatusFilter(cancelled, 'cancelled'), true);
  assert.equal(matchesStatusFilter(inProgress, 'cancelled'), false);
});

test('Filtros por rol y rol dentro del viaje', () => {
  const trip = ride({ passengerId: 'p1', driverId: 'd1' });
  assert.equal(matchesRoleFilter(trip, 'passenger', 'p1'), true);
  assert.equal(matchesRoleFilter(trip, 'passenger', 'd1'), false);
  assert.equal(matchesRoleFilter(trip, 'driver', 'd1'), true);
  assert.equal(matchesRoleFilter(trip, 'all', 'x'), true);
  assert.equal(roleInRide(trip, 'd1'), 'driver');
  assert.equal(roleInRide(trip, 'p1'), 'passenger');
  assert.equal(roleInRide(trip, 'x'), null);
});

test('filterRides combina estado y rol', () => {
  const rides = [
    ride({ id: 'a', status: RIDE_STATUS.PAID, passengerId: 'p1', driverId: 'd1' }),
    ride({ id: 'b', status: RIDE_STATUS.CANCELLED, passengerId: 'p1', driverId: null }),
    ride({ id: 'c', status: RIDE_STATUS.PAID, passengerId: 'p2', driverId: 'd1' }),
  ];
  const result = filterRides(rides, { status: 'completed', role: 'driver' }, 'd1');
  assert.deepEqual(result.map((item) => item.id), ['a', 'c']);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}\n       ${error.message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} pruebas correctas`);
if (failed > 0) process.exit(1);
