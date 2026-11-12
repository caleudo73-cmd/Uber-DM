// Pruebas del motor de tarifas. Se ejecutan con: npm run test:pricing
// Verifica el ejemplo de la especificación (8,5 km / 22 min) y que la copia
// de Cloud Functions produzca exactamente los mismos valores.

import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { calculateFare } from '../src/utils/calculateFare.js';

const require = createRequire(import.meta.url);
const { calculateFare: calculateFareServer } = require('../../firebase/functions/src/pricing.js');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const same = (actual, expected, message) => assert.deepEqual(actual, expected, message);

test('Económico 8,5 km / 22 min', () => {
  same(calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy' }), {
    fare: 19200,
    commission: 3840,
    driverEarnings: 15360,
    commissionRate: 0.2,
  });
});

test('XL 8,5 km / 22 min', () => {
  same(calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'xl' }), {
    fare: 26900,
    commission: 5380,
    driverEarnings: 21520,
    commissionRate: 0.2,
  });
});

test('Premium 8,5 km / 22 min', () => {
  const { fare, commission, driverEarnings } = calculateFare({
    distanceKm: 8.5,
    durationMin: 22,
    category: 'premium',
  });
  same([fare, commission, driverEarnings], [34600, 6920, 27680]);
});

test('Aplica la tarifa mínima', () => {
  const { fare, commission, driverEarnings } = calculateFare({ distanceKm: 0.5, durationMin: 1 });
  same([fare, commission, driverEarnings], [6000, 1200, 4800]);
});

test('La propina va completa al conductor', () => {
  const { fare, commission, driverEarnings } = calculateFare({
    distanceKm: 8.5,
    durationMin: 22,
    category: 'economy',
    tip: 2000,
  });
  same([fare, commission, driverEarnings], [19200, 3840, 17360]);
});

test('Redondea al múltiplo de 100 antes de la comisión', () => {
  // 3.500 + 2.400 + 1.250 = 7.150 -> 7.200
  const { fare, commission } = calculateFare({ distanceKm: 2, durationMin: 5, category: 'economy' });
  same([fare, commission], [7200, 1440]);
});

test('Rechaza categorías, distancias y propinas inválidas', () => {
  assert.throws(() => calculateFare({ distanceKm: 1, durationMin: 1, category: 'moto' }), /Categoría inválida/);
  assert.throws(() => calculateFare({ distanceKm: -1, durationMin: 1 }), /distanceKm/);
  assert.throws(() => calculateFare({ distanceKm: 1, durationMin: 1, tip: -5 }), /tip/);
});

test('La copia de Cloud Functions coincide con la del móvil', () => {
  const cases = [
    { distanceKm: 0, durationMin: 0, category: 'economy' },
    { distanceKm: 8.5, durationMin: 22, category: 'economy' },
    { distanceKm: 8.5, durationMin: 22, category: 'xl', tip: 1500 },
    { distanceKm: 12.34, durationMin: 41, category: 'premium' },
    { distanceKm: 1, durationMin: 1, category: 'xl' },
  ];
  for (const input of cases) {
    same(calculateFareServer(input), calculateFare(input), `Diferencia en ${JSON.stringify(input)}`);
  }
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
