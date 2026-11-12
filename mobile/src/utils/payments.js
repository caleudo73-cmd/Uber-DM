// Reglas de pago con tarjeta. Funciones puras para poder probarlas sin React
// ni Firebase (mobile/scripts/payments.test.mjs).
//
// Hoy el único camino activo es el pago de PRUEBA: se simula el resultado del
// checkout dentro de la app y no se cobra dinero real. El método `mercadopago`
// queda reservado para cuando se desplieguen las Cloud Functions con el webhook.

import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  RIDE_STATUS,
} from '../config/constants.js';

export const PAYMENT_OUTCOME = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const PAYMENT_METHOD_OPTIONS = [
  {
    value: PAYMENT_METHOD.CASH,
    label: 'Efectivo',
    icon: 'cash-outline',
    hint: 'Le pagas al conductor cuando termine el viaje.',
  },
  {
    value: PAYMENT_METHOD.MERCADO_PAGO_TEST,
    label: 'Tarjeta (prueba)',
    icon: 'card-outline',
    hint: 'Pago simulado en modo prueba: no se cobra dinero real.',
  },
];

const CARD_METHODS = [PAYMENT_METHOD.MERCADO_PAGO, PAYMENT_METHOD.MERCADO_PAGO_TEST];

export const isCardPayment = (ride) => CARD_METHODS.includes(ride?.paymentMethod);

export const isTestPayment = (ride) => ride?.paymentMethod === PAYMENT_METHOD.MERCADO_PAGO_TEST;

export const isPaymentApproved = (ride) =>
  ride?.paymentStatus === PAYMENT_STATUS.APPROVED || ride?.status === RIDE_STATUS.PAID;

// Lo que paga el pasajero: tarifa + propina. La comisión solo sale de la tarifa.
export const paymentAmount = (ride) =>
  Math.round(Number(ride?.fare) || 0) + Math.round(Number(ride?.tip) || 0);

// Solo se puede pagar con tarjeta cuando el conductor ya finalizó el viaje y
// el pago todavía no está aprobado (también permite reintentar tras un rechazo).
export const canPayWithCard = (ride) =>
  isCardPayment(ride) && ride?.status === RIDE_STATUS.COMPLETED && !isPaymentApproved(ride);

// Campos que la app escribe al simular el pago. Se mantienen puros para poder
// probarlos y para que las reglas de Firestore exijan exactamente esto.
export const buildTestPaymentUpdate = (ride, outcome) => {
  if (!isTestPayment(ride)) {
    throw new Error('Este viaje no usa el pago de prueba');
  }
  if (ride.status !== RIDE_STATUS.COMPLETED) {
    throw new Error('El viaje todavía no está finalizado');
  }
  if (![PAYMENT_OUTCOME.APPROVED, PAYMENT_OUTCOME.REJECTED].includes(outcome)) {
    throw new Error('Resultado de pago inválido');
  }

  if (outcome === PAYMENT_OUTCOME.REJECTED) {
    return {
      status: RIDE_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.REJECTED,
      paymentId: null,
      paymentAmount: 0,
    };
  }

  return {
    status: RIDE_STATUS.PAID,
    paymentStatus: PAYMENT_STATUS.APPROVED,
    // Identificador ficticio: deja claro en Firestore que no hubo cobro real.
    paymentId: `test_${ride.id}`,
    paymentAmount: paymentAmount(ride),
  };
};
