// AI-assisted: see docs/AI_LOG.md #10
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as userService from '../services/userService';
import useAuth from './useAuth';
import useDriverLocation from './useDriverLocation';

const toPoint = (coords) => ({ latitude: coords.latitude, longitude: coords.longitude });

// Disponible / No disponible. El seguimiento de la ubicación vive en
// useDriverLocation y solo se activa mientras el conductor está disponible.
export default function useDriverAvailability() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(Boolean(user?.isAvailable));
  const [loading, setLoading] = useState(false);
  const { location, setLocation, error, setError } = useDriverLocation({
    userId: user?.id,
    enabled: available,
    initialLocation: user?.driverLocation ?? null,
  });

  // Si el estado cambia en el perfil (otro dispositivo), se refleja aquí.
  useEffect(() => {
    if (typeof user?.isAvailable === 'boolean') setAvailable(user.isAvailable);
  }, [user?.isAvailable]);

  const toggle = useCallback(
    async (next) => {
      if (!user?.id || loading) return;

      setLoading(true);
      setError(null);
      try {
        let position = location;

        if (next) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            throw new Error('Permiso de ubicación denegado. Actívalo para recibir viajes.');
          }
          const { coords } = await Location.getCurrentPositionAsync({});
          position = toPoint(coords);
          setLocation(position);
        }

        await userService.setDriverAvailability(user.id, next, position);
        setAvailable(next);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, loading, location, setLocation, setError]
  );

  return { available, location, loading, error, toggle };
}
