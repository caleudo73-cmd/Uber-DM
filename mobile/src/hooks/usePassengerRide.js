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
  const [subscriptionError, setSubscriptionError] = useState(null);

  // Suscripción en tiempo real al viaje activo (se cancela al desmontar).
  useEffect(() => {
    if (!user) return undefined;
    return rideService.subscribeCurrentRide(user.id, setRide, setSubscriptionError);
  }, [user?.id]);

  const quoting = useAsyncAction(rideService.quoteRide);
  const requesting = useAsyncAction(rideService.requestRide);
  const cancelling = useAsyncAction(rideService.cancelRide);
  const paying = useAsyncAction(paymentService.payTrip);

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

  // Abre el checkout de Mercado Pago. El viaje pasa a "paid" cuando el webhook
  // confirma el pago; la suscripción en tiempo real actualiza la pantalla.
  const pay = useCallback(async () => {
    if (!ride) return;
    await paying.run(ride.id);
  }, [paying.run, ride]);

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
    pay,
    loading: requesting.loading || cancelling.loading,
    paying: paying.loading,
    quoting: quoting.loading,
    error: requesting.error || cancelling.error || paying.error || quoting.error || subscriptionError,
  };
}
