// AI-assisted: see docs/AI_LOG.md #12, #14
import { GOOGLE_MAPS_API_KEY } from '../config/env.js';
import { distanceKm, estimateDurationMin } from '../utils/geo.js';

const DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

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

const buildDirectionsUrl = (origin, destination, apiKey) => {
  const coords = (point) => `${point.latitude},${point.longitude}`;
  const params = [
    `origin=${encodeURIComponent(coords(origin))}`,
    `destination=${encodeURIComponent(coords(destination))}`,
    'mode=driving',
    'language=es',
    `key=${encodeURIComponent(apiKey)}`,
  ];
  return `${DIRECTIONS_URL}?${params.join('&')}`;
};

// Decodifica el "encoded polyline" de Google a coordenadas de react-native-maps.
// Algoritmo público: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
export const decodePolyline = (encoded) => {
  if (typeof encoded !== 'string' || encoded.length === 0) return [];

  const points = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }

  return points;
};

// Extrae la geometría de la primera ruta de Directions. Null si no hay ruta.
export const parseDirections = (payload) => {
  if (payload?.status !== 'OK') return null;
  const points = decodePolyline(payload?.routes?.[0]?.overview_polyline?.points);
  return points.length >= 2 ? points : null;
};

/**
 * Geometría aproximada de la ruta para dibujarla en el mapa.
 *
 * Devuelve `null` si falta la llave, si Google falla o si no hay ruta; el mapa
 * cae entonces a la línea recta entre origen y destino.
 *
 * @returns {Promise<Array<{ latitude: number, longitude: number }> | null>}
 */
export const getRouteGeometry = async (origin, destination, options = {}) => {
  const {
    apiKey = GOOGLE_MAPS_API_KEY,
    fetchImpl = globalThis.fetch,
    timeoutMs = DIRECTIONS_TIMEOUT_MS,
  } = options;

  if (!isCoordinate(origin) || !isCoordinate(destination)) return null;
  if (!apiKey || typeof fetchImpl !== 'function') return null;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetchImpl(buildDirectionsUrl(origin, destination, apiKey), {
      signal: controller?.signal,
    });
    if (!response.ok) return null;
    return parseDirections(await response.json());
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
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
