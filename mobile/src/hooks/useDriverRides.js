import { useCallback, useState } from 'react';
import * as rideService from '../services/rideService';
import useAsyncAction from './useAsyncAction';
import usePolling from './usePolling';

export default function useDriverRides() {
  const [currentRide, setCurrentRide] = useState(null);
  const [available, setAvailable] = useState([]);

  const refresh = useCallback(async () => {
    const { ride } = await rideService.getCurrentRide();
    setCurrentRide(ride);
    if (!ride) setAvailable((await rideService.getAvailableRides()).rides);
  }, []);

  usePolling(() => refresh().catch(() => {}), true);

  // Acción de transición: ejecuta, actualiza el viaje actual y refresca
  const transition = useCallback(
    (service) => async (id) => {
      const { ride } = await service(id);
      setCurrentRide(ride.status === 'completed' || ride.status === 'cancelled' ? null : ride);
      await refresh();
    },
    [refresh]
  );

  const accept = useAsyncAction(transition(rideService.acceptRide));
  const start = useAsyncAction(transition(rideService.startRide));
  const complete = useAsyncAction(transition(rideService.completeRide));
  const cancel = useAsyncAction(transition(rideService.cancelRide));

  return {
    currentRide,
    available,
    accept: accept.run,
    start: start.run,
    complete: complete.run,
    cancel: cancel.run,
    loading: accept.loading || start.loading || complete.loading || cancel.loading,
    error: accept.error || start.error || complete.error || cancel.error,
  };
}
