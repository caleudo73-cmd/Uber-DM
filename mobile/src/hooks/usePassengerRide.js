import { useCallback, useEffect, useState } from 'react';
import * as rideService from '../services/rideService';
import { RIDE_STATUS } from '../config/constants';
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

  // Cada vez que cambia el destino, recalcula el precio
  const selectDestination = useCallback(
    async (origin, point) => {
      setDestination(point);
      setQuote(null);
      const result = await quoting.run(origin, point);
      if (result) setQuote(result);
    },
    [quoting.run]
  );

  const request = useCallback(
    async (origin) => {
      const result = await requesting.run(origin, destination);
      if (result) {
        setRide(result.ride);
        setDestination(null);
        setQuote(null);
      }
    },
    [requesting.run, destination]
  );

  const cancel = useCallback(async () => {
    if (!ride) return;
    await cancelling.run(ride.id);
    setRide(null);
  }, [cancelling.run, ride]);

  useEffect(() => {
    if (ride?.status === RIDE_STATUS.COMPLETED) setRide(null);
  }, [ride]);

  return {
    ride,
    destination,
    quote,
    selectDestination,
    request,
    cancel,
    loading: requesting.loading || cancelling.loading || quoting.loading,
    error: requesting.error || cancelling.error || quoting.error,
  };
}
