import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CATEGORY, PAYMENT_METHOD } from '../config/constants';
import * as rideService from '../services/rideService';
import useAsyncAction from './useAsyncAction';
import useAuth from './useAuth';

export default function usePassengerRide() {
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [destination, setDestination] = useState(null);
  const [quote, setQuote] = useState(null);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [subscriptionError, setSubscriptionError] = useState(null);

  // Suscripción en tiempo real al viaje activo (se cancela al desmontar).
  useEffect(() => {
    if (!user) return undefined;
    return rideService.subscribeCurrentRide(user.id, setRide, setSubscriptionError);
  }, [user?.id]);

  const quoting = useAsyncAction(rideService.quoteRide);
  const requesting = useAsyncAction(rideService.requestRide);
  const cancelling = useAsyncAction(rideService.cancelRide);

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
      const result = await requesting.run(origin, destination, {
        category,
        paymentMethod: PAYMENT_METHOD.CASH,
      });
      if (result) clearDestination();
    },
    [requesting.run, destination, category, clearDestination]
  );

  const cancel = useCallback(async () => {
    if (!ride) return;
    await cancelling.run(ride.id);
  }, [cancelling.run, ride]);

  return {
    ride,
    destination,
    quote,
    category,
    selectDestination,
    clearDestination,
    request,
    cancel,
    loading: requesting.loading || cancelling.loading,
    quoting: quoting.loading,
    error: requesting.error || cancelling.error || quoting.error || subscriptionError,
  };
}
