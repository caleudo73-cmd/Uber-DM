// AI-assisted: see docs/AI_LOG.md #12
import { GOOGLE_MAPS_API_KEY } from '../config/env.js';
import { distanceKm, estimateDurationMin } from '../utils/geo.js';

const DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

// Si Google no responde en este tiempo, se usa la estimación local para que el
// pasajero nunca se quede esperando la cotización.
export const DIRECTIONS_TIMEOUT_MS = 6000;

export const isDirectionsEnabled = () => Boolean(GOOGLE_MAPS_API_KEY);

const isCoordinate = (point) =>
  point != null &&
  point.latitude != null &&
  point.longitude != null &&
  Number.isFinite(Number(point.latitude)) &&
  Number.isFinite(Number(point.longitude));

// Fallback sin API: distancia en línea recta y duración estimada.
// Es el mismo cálculo que se usaba antes de integrar Distance Matrix.
export const estimateRouteMetrics = (origin, destination) => {
  const km = distanceKm(origin, destination);
  return {
    distanceKm: +km.toFixed(2),
    durationMin: estimateDurationMin(km),
    source: 'estimate',
  };
};

// Convierte la respuesta de Distance Matrix en { distanceKm, durationMin }.
// Devuelve null cuando Google no encontró una ruta válida.
export const parseDistanceMatrix = (payload) => {
  const element = payload?.rows?.[0]?.elements?.[0];
  if (payload?.status !== 'OK' || element?.status !== 'OK') return null;

  const meters = Number(element.distance?.value);
  const seconds = Number(element.duration?.value);
  if (!Number.isFinite(meters) || meters < 0) return null;
  if (!Number.isFinite(seconds) || seconds < 0) return null;

  return {
    distanceKm: +(meters / 1000).toFixed(2),
    durationMin: Math.max(1, Math.ceil(seconds / 60)),
  };
};

const buildDistanceMatrixUrl = (origin, destination, apiKey) => {
  const coords = (point) => `${point.latitude},${point.longitude}`;
  const params = [
    `origins=${encodeURIComponent(coords(origin))}`,
    `destinations=${encodeURIComponent(coords(destination))}`,
    'mode=driving',
    'units=metric',
    'language=es',
    `key=${encodeURIComponent(apiKey)}`,
  ];
  return `${DISTANCE_MATRIX_URL}?${params.join('&')}`;
};

/**
 * Distancia y duración del recorrido.
 *
 * Usa Google Distance Matrix cuando `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` está
 * configurada. Si falta la llave, Google falla o responde sin ruta, devuelve la
 * estimación local en línea recta. Nunca lanza por un fallo de la API: la
 * cotización siempre debe poder completarse.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @param {{ apiKey?: string, fetchImpl?: Function, timeoutMs?: number }} [options]
 * @returns {Promise<{ distanceKm: number, durationMin: number, source: 'google'|'estimate' }>}
 */
export const getRouteMetrics = async (origin, destination, options = {}) => {
  const {
    apiKey = GOOGLE_MAPS_API_KEY,
    fetchImpl = globalThis.fetch,
    timeoutMs = DIRECTIONS_TIMEOUT_MS,
  } = options;

  if (!isCoordinate(origin) || !isCoordinate(destination)) {
    throw new Error('El origen y el destino deben tener coordenadas válidas');
  }

  const fallback = () => estimateRouteMetrics(origin, destination);
  if (!apiKey || typeof fetchImpl !== 'function') return fallback();

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetchImpl(buildDistanceMatrixUrl(origin, destination, apiKey), {
      signal: controller?.signal,
    });
    if (!response.ok) return fallback();

    const metrics = parseDistanceMatrix(await response.json());
    return metrics ? { ...metrics, source: 'google' } : fallback();
  } catch {
    // Sin red, timeout o JSON inválido: se cotiza con la estimación local.
    return fallback();
  } finally {
    if (timer) clearTimeout(timer);
  }
};
