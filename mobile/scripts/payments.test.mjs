// Pruebas de las reglas de pago con tarjeta.
// Se ejecutan con: npm run test:payments

import assert from 'node:assert/strict';
import { PAYMENT_METHOD, PAYMENT_STATUS, RIDE_STATUS } from '../src/config/constants.js';
import {
  PAYMENT_METHOD_OPTIONS,
  canPayWithCard,
  isCardPayment,
  isPaymentApproved,
} from '../src/utils/payments.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const ride = (overrides) => ({
  id: 'r',
  paymentMethod: PAYMENT_METHOD.MERCADO_PAGO,
  paymentStatus: PAYMENT_STATUS.PENDING,
  status: RIDE_STATUS.COMPLETED,
  ...overrides,
});

test('Ofrece efectivo y Mercado Pago', () => {
  assert.deepEqual(
    PAYMENT_METHOD_OPTIONS.map((option) => option.value),
    [PAYMENT_METHOD.CASH, PAYMENT_METHOD.MERCADO_PAGO]
  );
});

test('Reconoce el pago con tarjeta', () => {
  assert.equal(isCardPayment(ride()), true);
  assert.equal(isCardPayment(ride({ paymentMethod: PAYMENT_METHOD.CASH })), false);
  assert.equal(isCardPayment(null), false);
});

test('Solo se paga con tarjeta al finalizar', () => {
  assert.equal(canPayWithCard(ride()), true);
  assert.equal(canPayWithCard(ride({ status: RIDE_STATUS.IN_PROGRESS })), false);
  assert.equal(canPayWithCard(ride({ status: RIDE_STATUS.REQUESTED })), false);
});

test('No se paga dos veces ni un viaje en efectivo', () => {
  assert.equal(canPayWithCard(ride({ paymentStatus: PAYMENT_STATUS.APPROVED })), false);
  assert.equal(canPayWithCard(ride({ status: RIDE_STATUS.PAID })), false);
  assert.equal(canPayWithCard(ride({ paymentMethod: PAYMENT_METHOD.CASH })), false);
  assert.equal(canPayWithCard(null), false);
});

test('El pago aprobado se reconoce por estado o por viaje pagado', () => {
  assert.equal(isPaymentApproved(ride({ paymentStatus: PAYMENT_STATUS.APPROVED })), true);
  assert.equal(isPaymentApproved(ride({ status: RIDE_STATUS.PAID })), true);
  assert.equal(isPaymentApproved(ride()), false);
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
