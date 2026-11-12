import { useEffect, useMemo, useState } from 'react';
import * as rideService from '../services/rideService';
import { sortByDateDesc } from '../utils/earnings';
import useAuth from './useAuth';

// Historial del usuario en tiempo real, ordenado del más reciente al más antiguo.
export default function useRideHistory() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return undefined;

    setLoading(true);
    return rideService.subscribeRideHistory(
      user.id,
      (next) => {
        setRides(next);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );
  }, [user?.id]);

  const sorted = useMemo(() => sortByDateDesc(rides), [rides]);

  return { rides: sorted, loading, error };
}
