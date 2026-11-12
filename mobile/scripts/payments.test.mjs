// Pruebas de las reglas de pago con tarjeta (modo prueba).
// Se ejecutan con: npm run test:payments

import assert from 'node:assert/strict';
import { PAYMENT_METHOD, PAYMENT_STATUS, RIDE_STATUS } from '../src/config/constants.js';
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_OUTCOME,
  buildTestPaymentUpdate,
  canPayWithCard,
  isCardPayment,
  isPaymentApproved,
  isTestPayment,
  paymentAmount,
} from '../src/utils/payments.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const ride = (overrides) => ({
  id: 'r',
  paymentMethod: PAYMENT_METHOD.MERCADO_PAGO_TEST,
  paymentStatus: PAYMENT_STATUS.PENDING,
  status: RIDE_STATUS.COMPLETED,
  fare: 19200,
  tip: 2000,
  ...overrides,
});

test('Ofrece efectivo y tarjeta en modo prueba', () => {
  assert.deepEqual(
    PAYMENT_METHOD_OPTIONS.map((option) => option.value),
    [PAYMENT_METHOD.CASH, PAYMENT_METHOD.MERCADO_PAGO_TEST]
  );
  const card = PAYMENT_METHOD_OPTIONS.find((option) => option.value === PAYMENT_METHOD.MERCADO_PAGO_TEST);
  assert.match(card.hint, /prueba/);
});

test('Reconoce el pago con tarjeta (real y de prueba)', () => {
  assert.equal(isCardPayment(ride()), true);
  assert.equal(isCardPayment(ride({ paymentMethod: PAYMENT_METHOD.MERCADO_PAGO })), true);
  assert.equal(isCardPayment(ride({ paymentMethod: PAYMENT_METHOD.CASH })), false);
  assert.equal(isCardPayment(null), false);
});

test('Distingue el pago simulado del pago real', () => {
  assert.equal(isTestPayment(ride()), true);
  assert.equal(isTestPayment(ride({ paymentMethod: PAYMENT_METHOD.MERCADO_PAGO })), false);
  assert.equal(isTestPayment(ride({ paymentMethod: PAYMENT_METHOD.CASH })), false);
  assert.equal(isTestPayment(null), false);
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

test('Se puede reintentar después de un rechazo', () => {
  assert.equal(canPayWithCard(ride({ paymentStatus: PAYMENT_STATUS.REJECTED })), true);
});

test('El pago aprobado se reconoce por estado o por viaje pagado', () => {
  assert.equal(isPaymentApproved(ride({ paymentStatus: PAYMENT_STATUS.APPROVED })), true);
  assert.equal(isPaymentApproved(ride({ status: RIDE_STATUS.PAID })), true);
  assert.equal(isPaymentApproved(ride()), false);
});

test('El monto a pagar es la tarifa más la propina', () => {
  assert.equal(paymentAmount(ride()), 21200);
  assert.equal(paymentAmount(ride({ tip: 0 })), 19200);
  assert.equal(paymentAmount(ride({ tip: undefined })), 19200);
  assert.equal(paymentAmount(null), 0);
});

test('Aprobar cierra el viaje como pagado', () => {
  assert.deepEqual(buildTestPaymentUpdate(ride(), PAYMENT_OUTCOME.APPROVED), {
    status: RIDE_STATUS.PAID,
    paymentStatus: PAYMENT_STATUS.APPROVED,
    paymentId: 'test_r',
    paymentAmount: 21200,
  });
});

test('Rechazar deja el viaje finalizado y permite reintentar', () => {
  assert.deepEqual(buildTestPaymentUpdate(ride(), PAYMENT_OUTCOME.REJECTED), {
    status: RIDE_STATUS.COMPLETED,
    paymentStatus: PAYMENT_STATUS.REJECTED,
    paymentId: null,
    paymentAmount: 0,
  });
});

test('No se puede simular un pago inválido', () => {
  assert.throws(() => buildTestPaymentUpdate(ride({ paymentMethod: PAYMENT_METHOD.CASH })), /no usa el pago de prueba/);
  assert.throws(() => buildTestPaymentUpdate(ride({ status: RIDE_STATUS.IN_PROGRESS })), /no está finalizado/);
  assert.throws(() => buildTestPaymentUpdate(ride(), 'pending'), /Resultado de pago inválido/);
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
