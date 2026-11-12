// Reglas de pago con tarjeta. Funciones puras para poder probarlas sin React
// ni Firebase (mobile/scripts/payments.test.mjs).

import { PAYMENT_METHOD, PAYMENT_STATUS, RIDE_STATUS } from '../config/constants.js';

export const PAYMENT_METHOD_OPTIONS = [
  {
    value: PAYMENT_METHOD.CASH,
    label: 'Efectivo',
    icon: 'cash-outline',
    hint: 'Le pagas al conductor cuando termine el viaje.',
  },
  {
    value: PAYMENT_METHOD.MERCADO_PAGO,
    label: 'Mercado Pago',
    icon: 'card-outline',
    hint: 'Pagas con tarjeta al finalizar; se abre la pasarela en el navegador.',
  },
];

export const isCardPayment = (ride) => ride?.paymentMethod === PAYMENT_METHOD.MERCADO_PAGO;

export const isPaymentApproved = (ride) =>
  ride?.paymentStatus === PAYMENT_STATUS.APPROVED || ride?.status === RIDE_STATUS.PAID;

// Solo se puede pagar con tarjeta cuando el conductor ya finalizó el viaje y
// el pago todavía no está aprobado.
export const canPayWithCard = (ride) =>
  isCardPayment(ride) && ride?.status === RIDE_STATUS.COMPLETED && !isPaymentApproved(ride);
