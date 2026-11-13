// AI-assisted: see docs/AI_LOG.md #10
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as rideService from '../services/rideService';
import { isExpired } from '../utils/countdown';

// Solicitudes disponibles para el conductor. La especificación pide un hook
// llamado useTripRequests; aquí viven la suscripción en tiempo real, el filtro
// de solicitudes rechazadas y la desaparición al vencer la cuenta regresiva.
export default function useTripRequests({ driverId, enabled = true }) {
  const [requests, setRequests] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!driverId || !enabled) {
      setRequests([]);
      setError(null);
      return undefined;
    }
    return rideService.subscribeAvailableRides(driverId, setRequests, setError);
  }, [driverId, enabled]);

  const dismiss = useCallback((id) => {
    setDismissed((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const visible = useMemo(
    () => requests.filter((ride) => !dismissed.has(ride.id) && !isExpired(ride.createdAt)),
    [requests, dismissed]
  );

  return { requests: visible, dismiss, error };
}
