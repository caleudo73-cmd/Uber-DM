import { useCallback, useState } from 'react';
import * as rideService from '../services/rideService';
import useAsyncAction from './useAsyncAction';
import usePolling from './usePolling';

export default function usePassengerRide() {
  const [ride, setRide] = useState(null);
  const [destination, setDestination] = useState(null);
  const [quote, setQuote] = useState(null);

  const refresh = useCallback(async () => {
    const { ride: current } = await rideService.getCurrentRide();
    setRide(current);
  }, []);

  usePolling(() => refresh().catch(() => {}), true);

  const quoting = useAsyncAction(rideService.quoteRide);
  const requesting = useAsyncAction(rideService.requestRide);
  const cancelling = useAsyncAction(rideService.cancelRide);

  const selectDestination = useCallback(
    async (origin, place) => {
      setDestination(place);
      setQuote(null);
      const result = await quoting.run(origin, place);
      if (result) setQuote(result);
    },
    [quoting.run]
  );

  const clearDestination = useCallback(() => {
    setDestination(null);
    setQuote(null);
  }, []);

  const request = useCallback(
    async (origin) => {
      const result = await requesting.run(origin, destination);
      if (result) {
        setRide(result.ride);
        clearDestination();
      }
    },
    [requesting.run, destination, clearDestination]
  );

  const cancel = useCallback(async () => {
    if (!ride) return;
    await cancelling.run(ride.id);
    setRide(null);
  }, [cancelling.run, ride]);

  return {
    ride,
    destination,
    quote,
    selectDestination,
    clearDestination,
    request,
    cancel,
    loading: requesting.loading || cancelling.loading,
    quoting: quoting.loading,
    error: requesting.error || cancelling.error || quoting.error,
  };
}