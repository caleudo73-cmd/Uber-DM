// Pruebas de las reglas de calificación del pasajero al conductor.
// Se ejecutan con: npm run test:ratings

import assert from 'node:assert/strict';
import { RIDE_STATUS } from '../src/config/constants.js';
import {
  RATING_VALUES,
  canRateRide,
  canShowRating,
  isValidRating,
  ratingLabel,
} from '../src/utils/ratings.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const PASSENGER = 'passenger-1';
const DRIVER = 'driver-1';

const ride = (overrides) => ({
  id: 'r',
  passengerId: PASSENGER,
  driverId: DRIVER,
  status: RIDE_STATUS.COMPLETED,
  rating: null,
  ...overrides,
});

test('Las estrellas válidas son de 1 a 5', () => {
  assert.deepEqual(RATING_VALUES, [1, 2, 3, 4, 5]);
  for (const value of RATING_VALUES) assert.equal(isValidRating(value), true);
  for (const value of [0, 6, -1, 2.5, '4', null, undefined]) {
    assert.equal(isValidRating(value), false, `debería rechazar ${value}`);
  }
});

test('Cada puntaje tiene una etiqueta', () => {
  assert.equal(ratingLabel(1), 'Muy malo');
  assert.equal(ratingLabel(5), 'Excelente');
  assert.equal(ratingLabel(0), null);
  assert.equal(ratingLabel(6), null);
});

test('El pasajero puede calificar un viaje terminado', () => {
  assert.equal(canRateRide(ride(), PASSENGER), true);
  assert.equal(canRateRide(ride({ status: RIDE_STATUS.PAID }), PASSENGER), true);
});

test('No se puede calificar dos veces ni desde otro usuario', () => {
  assert.equal(canRateRide(ride({ rating: 4 }), PASSENGER), false);
  assert.equal(canRateRide(ride(), DRIVER), false);
  assert.equal(canRateRide(ride(), null), false);
  assert.equal(canRateRide(null, PASSENGER), false);
});

test('Solo se califica cuando el viaje terminó', () => {
  for (const status of [
    RIDE_STATUS.REQUESTED,
    RIDE_STATUS.ACCEPTED,
    RIDE_STATUS.DRIVER_ARRIVING,
    RIDE_STATUS.IN_PROGRESS,
    RIDE_STATUS.CANCELLED,
  ]) {
    assert.equal(canRateRide(ride({ status }), PASSENGER), false, `no debería permitir ${status}`);
  }
});

test('La sección se muestra solo en viajes terminados', () => {
  assert.equal(canShowRating(ride()), true);
  assert.equal(canShowRating(ride({ status: RIDE_STATUS.PAID })), true);
  assert.equal(canShowRating(ride({ status: RIDE_STATUS.IN_PROGRESS })), false);
  assert.equal(canShowRating(ride({ status: RIDE_STATUS.CANCELLED })), false);
  assert.equal(canShowRating(null), false);
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
