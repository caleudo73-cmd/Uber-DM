import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import * as userService from '../services/userService';
import { distanceKm } from '../utils/geo';
import useAuth from './useAuth';

// No escribimos en Firestore en cada lectura del GPS: solo cada 10 s o cuando
// el conductor se movió más de 25 m.
const MIN_WRITE_INTERVAL_MS = 10000;
const MIN_DISTANCE_METERS = 25;

const toPoint = (coords) => ({ latitude: coords.latitude, longitude: coords.longitude });

export default function useDriverAvailability() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(Boolean(user?.isAvailable));
  const [location, setLocation] = useState(user?.driverLocation ?? null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastWrite = useRef({ at: 0, location: null });

  // Si el estado cambia en el perfil (otro dispositivo), se refleja aquí.
  useEffect(() => {
    if (typeof user?.isAvailable === 'boolean') setAvailable(user.isAvailable);
  }, [user?.isAvailable]);

  // Seguimiento de ubicación solo mientras está disponible.
  useEffect(() => {
    if (!available || !user?.id) return undefined;

    let subscription = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado. Actívalo para recibir viajes.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: MIN_DISTANCE_METERS,
          timeInterval: MIN_WRITE_INTERVAL_MS,
        },
        ({ coords }) => {
          const next = toPoint(coords);
          setLocation(next);

          const now = Date.now();
          const moved =
            !lastWrite.current.location ||
            distanceKm(lastWrite.current.location, next) * 1000 >= MIN_DISTANCE_METERS;

          if (moved && now - lastWrite.current.at >= MIN_WRITE_INTERVAL_MS) {
            lastWrite.current = { at: now, location: next };
            userService.updateDriverLocation(user.id, next).catch(() => {});
          }
        }
      );
    })().catch(() => setError('No se pudo seguir tu ubicación'));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [available, user?.id]);

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
    [user?.id, loading, location]
  );

  return { available, location, loading, error, toggle };
}
