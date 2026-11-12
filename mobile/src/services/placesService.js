import { collection, getDocs, query, where } from 'firebase/firestore';
import { RIDE_STATUS } from '../config/constants';
import { distanceKm } from '../utils/geo';
import { db, requireFirebase } from './firebase';
import { toRide } from './rideService';

// Lugares con Photon (OpenStreetMap, gratis, pensado para autocompletar).
// Ya no pasa por un backend propio: se llama directo desde la app.
const PHOTON_URL = 'https://photon.komoot.io/api/';
const NEARBY_QUERIES = ['parque', 'centro comercial', 'estación de metro', 'universidad'];
const NEARBY_RADIUS_KM = 5;
const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

// Respaldo si no hay internet o el servicio falla (Medellín).
const FALLBACK_PLACES = [
  { name: 'Parque Lleras', address: 'El Poblado, Medellín', latitude: 6.2088, longitude: -75.5675 },
  { name: 'Centro Comercial Santafé', address: 'El Poblado, Medellín', latitude: 6.1962, longitude: -75.5737 },
  { name: 'Aeropuerto Olaya Herrera', address: 'Medellín', latitude: 6.2205, longitude: -75.5906 },
  { name: 'Terminal del Norte', address: 'Medellín', latitude: 6.279, longitude: -75.5769 },
  { name: 'Parque Explora', address: 'Medellín', latitude: 6.2717, longitude: -75.5656 },
  { name: 'Estadio Atanasio Girardot', address: 'Laureles, Medellín', latitude: 6.2565, longitude: -75.59 },
  { name: 'Jardín Botánico', address: 'Medellín', latitude: 6.2721, longitude: -75.5632 },
  { name: 'Unicentro Medellín', address: 'Medellín', latitude: 6.2429, longitude: -75.5906 },
].map((place, index) => ({ id: `fallback-${index}`, ...place }));

const normalize = (text) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const toPlace = (feature) => {
  const properties = feature.properties || {};
  const [longitude, latitude] = feature.geometry.coordinates;
  const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
  const name = properties.name || street || properties.city || 'Lugar sin nombre';
  const address = [
    street && street !== name ? street : null,
    properties.district || properties.locality,
    properties.city,
    properties.state,
  ]
    .filter(Boolean)
    .join(', ');

  return { id: `${properties.osm_type}${properties.osm_id}`, name, address, latitude, longitude };
};

const unique = (places) => [...new Map(places.map((place) => [place.id, place])).values()];

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': 'uber-app-dev' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

const fetchPhoton = async (text, near) => {
  const params = new URLSearchParams({ q: text, limit: '6' });
  if (near) {
    params.set('lat', String(near.latitude));
    params.set('lon', String(near.longitude));
  }

  const response = await fetchWithTimeout(`${PHOTON_URL}?${params}`);
  if (!response.ok) throw new Error(`Photon ${response.status}`);
  const data = await response.json();
  return unique(data.features.map(toPlace));
};

const searchPlaces = async (text, near) => {
  try {
    return await fetchPhoton(text, near);
  } catch (error) {
    console.warn('Búsqueda de lugares falló, usando respaldo:', error.message);
    return FALLBACK_PLACES.filter((place) => normalize(place.name).includes(normalize(text)));
  }
};

const nearbyFromFallback = (near) =>
  FALLBACK_PLACES.map((place) => ({ ...place, distanceKm: distanceKm(near, place) }))
    .filter((place) => place.distanceKm <= 25)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 5);

const nearbyCache = new Map();

const searchNearby = async (near) => {
  const key = `${near.latitude.toFixed(2)},${near.longitude.toFixed(2)}`;
  const cached = nearbyCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.places;

  try {
    const batches = await Promise.all(NEARBY_QUERIES.map((text) => fetchPhoton(text, near)));
    const places = unique(batches.flat())
      .map((place) => ({ ...place, distanceKm: distanceKm(near, place) }))
      .filter((place) => place.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);

    if (places.length === 0) throw new Error('sin resultados cercanos');

    nearbyCache.set(key, { at: Date.now(), places });
    return places;
  } catch (error) {
    console.warn('Lugares cercanos falló, usando respaldo:', error.message);
    return nearbyFromFallback(near);
  }
};

// Destinos con nombre a los que más ha viajado el usuario (sin contar cancelados).
const frequentDestinations = async (limit = 3) => {
  const { auth } = requireFirebase();
  const user = auth.currentUser;
  if (!user) return [];

  const snapshot = await getDocs(
    query(collection(db, 'trips'), where('participants', 'array-contains', user.uid))
  );
  const groups = new Map();

  for (const ride of snapshot.docs.map(toRide)) {
    if (ride.passengerId !== user.uid || ride.status === RIDE_STATUS.CANCELLED) continue;
    const { name, latitude, longitude } = ride.destination ?? {};
    if (!name) continue;

    const key = `${name}|${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const group = groups.get(key) || { id: `freq-${key}`, name, latitude, longitude, trips: 0 };
    group.trips += 1;
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => b.trips - a.trips)
    .slice(0, limit)
    .map(({ trips, ...place }) => ({
      ...place,
      address: trips === 1 ? '1 viaje' : `${trips} viajes`,
    }));
};

export const search = async (text, location) => ({
  places: await searchPlaces(text, location),
});

export const getSuggestions = async (location) => {
  const [frequent, nearby] = await Promise.all([
    frequentDestinations().catch(() => []),
    location ? searchNearby(location) : Promise.resolve([]),
  ]);

  return { frequent, nearby };
};
