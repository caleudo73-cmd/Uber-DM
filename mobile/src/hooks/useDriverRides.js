// AI-assisted: see docs/AI_LOG.md #9, #10
import { useCallback, useEffect, useState } from 'react';
import * as rideService from '../services/rideService';
import useAsyncAction from './useAsyncAction';
import useAuth from './useAuth';
import useTripRequests from './useTripRequests';

export default function useDriverRides({ isAvailable = true } = {}) {
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);

  // Viaje activo del conductor en tiempo real.
  useEffect(() => {
    if (!user) return undefined;
    return rideService.subscribeCurrentRide(user.id, setCurrentRide, setSubscriptionError);
  }, [user?.id]);

  // Solo escucha solicitudes nuevas cuando está disponible y libre.
  const busy = Boolean(currentRide);
  const tripRequests = useTripRequests({
    driverId: user?.id,
    enabled: Boolean(user) && !busy && isAvailable,
  });
  const { dismiss } = tripRequests;

  const accept = useAsyncAction(rideService.acceptRide);
  const reject = useAsyncAction(rideService.rejectRide);
  const arriving = useAsyncAction(rideService.markDriverArriving);
  const start = useAsyncAction(rideService.startRide);
  const complete = useAsyncAction(rideService.completeRide);
  const cancel = useAsyncAction(rideService.cancelRide);
  const cashPaid = useAsyncAction(rideService.markCashPaid);

  const acceptRide = useCallback((id) => accept.run(id), [accept.run]);
  const rejectRide = useCallback(
    async (id) => {
      const result = await reject.run(id);
      // Si se guardó el rechazo, desaparece de la lista de inmediato.
      if (result) dismiss(id);
      return result;
    },
    [reject.run, dismiss]
  );
  // Al vencer los 15 s se guarda el rechazo para que no vuelva a aparecer.
  // Si el viaje ya fue tomado, igual desaparece de esta pantalla.
  const expireRide = useCallback(
    async (id) => {
      await rideService.rejectRide(id).catch(() => {});
      dismiss(id);
    },
    [dismiss]
  );
  const markArriving = useCallback((id) => arriving.run(id), [arriving.run]);
  const startRide = useCallback((id) => start.run(id), [start.run]);
  const completeRide = useCallback((id) => complete.run(id), [complete.run]);
  const cancelRide = useCallback((id) => cancel.run(id), [cancel.run]);
  const markCashPaid = useCallback((id) => cashPaid.run(id), [cashPaid.run]);

  return {
    currentRide,
    available: tripRequests.requests,
    dismiss,
    accept: acceptRide,
    reject: rejectRide,
    expire: expireRide,
    arriving: markArriving,
    start: startRide,
    complete: completeRide,
    cancel: cancelRide,
    cashPaid: markCashPaid,
    loading:
      accept.loading ||
      reject.loading ||
      arriving.loading ||
      start.loading ||
      complete.loading ||
      cancel.loading ||
      cashPaid.loading,
    error:
      accept.error ||
      reject.error ||
      arriving.error ||
      start.error ||
      complete.error ||
      cancel.error ||
      cashPaid.error ||
      tripRequests.error ||
      subscriptionError,
  };
}
