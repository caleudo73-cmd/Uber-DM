import { useCallback, useEffect, useState } from 'react';
import { PAYMENT_METHOD } from '../config/constants';
import { DEFAULT_CATEGORY } from '../config/pricing';
import * as paymentService from '../services/paymentService';
import * as rideService from '../services/rideService';
import useAsyncAction from './useAsyncAction';
import useAuth from './useAuth';

export default function usePassengerRide() {
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [destination, setDestination] = useState(null);
  const [quote, setQuote] = useState(null);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.CASH);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);

  // Suscripción en tiempo real al viaje activo (se cancela al desmontar).
  useEffect(() => {
    if (!user) return undefined;
    return rideService.subscribeCurrentRide(user.id, setRide, setSubscriptionError);
  }, [user?.id]);

  // Si el viaje desaparece (pagado o cancelado), el checkout de prueba se cierra.
  useEffect(() => {
    if (!ride) setPaymentOpen(false);
  }, [ride]);

  const quoting = useAsyncAction(rideService.quoteRide);
  const requesting = useAsyncAction(rideService.requestRide);
  const cancelling = useAsyncAction(rideService.cancelRide);
  const paying = useAsyncAction(paymentService.payWithTestCard);

  const selectDestination = useCallback(
    async (origin, place, nextCategory = category) => {
      setDestination(place);
      setCategory(nextCategory);
      setQuote(null);
      const result = await quoting.run(origin, place, nextCategory);
      if (result) setQuote(result);
    },
    [quoting.run, category]
  );

  const clearDestination = useCallback(() => {
    setDestination(null);
    setQuote(null);
  }, []);

  const request = useCallback(
    async (origin) => {
      const result = await requesting.run(origin, destination, { category, paymentMethod });
      if (result) clearDestination();
    },
    [requesting.run, destination, category, paymentMethod, clearDestination]
  );

  const cancel = useCallback(async () => {
    if (!ride) return;
    await cancelling.run(ride.id);
  }, [cancelling.run, ride]);

  // Abre el checkout de prueba (pago simulado dentro de la app).
  const openPayment = useCallback(() => setPaymentOpen(true), []);
  const closePayment = useCallback(() => setPaymentOpen(false), []);

  // Simula el resultado elegido. Al aprobar, el viaje pasa a "paid" y la
  // suscripción en tiempo real actualiza la pantalla.
  const pay = useCallback(
    async (outcome) => {
      if (!ride) return;
      const result = await paying.run(ride.id, outcome);
      if (result) setPaymentOpen(false);
    },
    [paying.run, ride]
  );

  return {
    ride,
    destination,
    quote,
    category,
    paymentMethod,
    setPaymentMethod,
    selectDestination,
    clearDestination,
    request,
    cancel,
    paymentOpen,
    openPayment,
    closePayment,
    pay,
    loading: requesting.loading || cancelling.loading,
    paying: paying.loading,
    quoting: quoting.loading,
    error: requesting.error || cancelling.error || paying.error || quoting.error || subscriptionError,
  };
}
