// AI-assisted: see docs/AI_LOG.md #10
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import * as userService from '../services/userService';
import { distanceKm } from '../utils/geo';

// No escribimos en Firestore en cada lectura del GPS: solo cada 10 s o cuando
// el conductor se movió más de 25 m.
const MIN_WRITE_INTERVAL_MS = 10000;
const MIN_DISTANCE_METERS = 25;

const toPoint = (coords) => ({ latitude: coords.latitude, longitude: coords.longitude });

// Seguimiento de la ubicación del conductor mientras está Disponible.
// La especificación pide un hook llamado useDriverLocation; aquí vive el
// watchPosition y la escritura controlada en Firestore.
export default function useDriverLocation({ userId, enabled = false, initialLocation = null }) {
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState(null);
  const lastWrite = useRef({ at: 0, location: null });

  // Si el perfil llega después del primer render, se usa como posición inicial.
  useEffect(() => {
    if (!location && initialLocation) setLocation(initialLocation);
  }, [initialLocation, location]);

  useEffect(() => {
    if (!enabled || !userId) return undefined;

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
            userService.updateDriverLocation(userId, next).catch(() => {});
          }
        }
      );
    })().catch(() => setError('No se pudo seguir tu ubicación'));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, userId]);

  return { location, setLocation, error, setError };
}
