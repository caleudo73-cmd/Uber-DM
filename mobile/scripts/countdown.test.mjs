// Pruebas de la cuenta regresiva de 15 segundos.
// Se ejecutan con: npm run test:countdown

import assert from 'node:assert/strict';
import { isExpired, remainingRatio, remainingSeconds } from '../src/utils/countdown.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const START = Date.parse('2026-11-11T20:00:00.000Z');

test('Al crear la solicitud quedan 15 segundos', () => {
  assert.equal(remainingSeconds(START, START), 15);
  assert.equal(remainingRatio(START, START), 1);
});

test('A los 5 segundos quedan 10', () => {
  assert.equal(remainingSeconds(START, START + 5000), 10);
  assert.equal(remainingRatio(START, START + 5000), 10 / 15);
});

test('Nunca baja de cero', () => {
  assert.equal(remainingSeconds(START, START + 60000), 0);
  assert.equal(remainingRatio(START, START + 60000), 0);
  assert.equal(isExpired(START, START + 60000), true);
});

test('Justo a los 15 segundos ya expiró', () => {
  assert.equal(isExpired(START, START + 15000), true);
  assert.equal(isExpired(START, START + 14999), false);
});

test('Sin fecha válida se muestra el tiempo completo', () => {
  assert.equal(remainingSeconds(null, START), 15);
  assert.equal(remainingSeconds('no-es-fecha', START), 15);
  assert.equal(isExpired(null, START), false);
});

test('Acepta Date y número', () => {
  assert.equal(remainingSeconds(new Date(START), START + 3000), 12);
  assert.equal(remainingSeconds(START, START + 3000), 12);
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
