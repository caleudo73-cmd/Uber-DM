// Lugares con Photon (OpenStreetMap, gratis, pensado para autocompletar).
const { distanceKm } = require('./pricingService');

const PHOTON_URL = 'https://photon.komoot.io/api/';
const NEARBY_QUERIES = ['parque', 'centro comercial', 'estación de metro', 'universidad'];
const NEARBY_RADIUS_KM = 5;
const CACHE_TTL_MS = 10 * 60 * 1000;

// Respaldo si no hay internet o el servicio falla (Medellín)
const FALLBACK_PLACES = [
  { name: 'Parque Lleras', address: 'El Poblado, Medellín', latitude: 6.2088, longitude: -75.5675 },
  { name: 'Centro Comercial Santafé', address: 'El Poblado, Medellín', latitude: 6.1962, longitude: -75.5737 },
  { name: 'Aeropuerto Olaya Herrera', address: 'Medellín', latitude: 6.2205, longitude: -75.5906 },
  { name: 'Terminal del Norte', address: 'Medellín', latitude: 6.279, longitude: -75.5769 },
  { name: 'Parque Explora', address: 'Medellín', latitude: 6.2717, longitude: -75.5656 },
  { name: 'Estadio Atanasio Girardot', address: 'Laureles, Medellín', latitude: 6.2565, longitude: -75.59 },
  { name: 'Jardín Botánico', address: 'Medellín', latitude: 6.2721, longitude: -75.5632 },
  { name: 'Unicentro Medellín', address: 'Medellín', latitude: 6.2429, longitude: -75.5906 },
].map((p, i) => ({ id: `fallback-${i}`, ...p }));

const normalize = (text) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const toPlace = (feature) => {
  const p = feature.properties || {};
  const [longitude, latitude] = feature.geometry.coordinates;
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  const name = p.name || street || p.city || 'Lugar sin nombre';
  const address = [street && street !== name ? street : null, p.district || p.locality, p.city, p.state]
    .filter(Boolean)
    .join(', ');
  return { id: `${p.osm_type}${p.osm_id}`, name, address, latitude, longitude };
};

const unique = (places) => [...new Map(places.map((p) => [p.id, p])).values()];

const fetchPhoton = async (query, near) => {
  const params = new URLSearchParams({ q: query, limit: '6' });
  if (near) {
    params.set('lat', String(near.latitude));
    params.set('lon', String(near.longitude));
  }
  const response = await fetch(`${PHOTON_URL}?${params}`, {
    headers: { 'User-Agent': 'uber-app-dev' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Photon ${response.status}`);
  const data = await response.json();
  return unique(data.features.map(toPlace));
};

const searchPlaces = async (query, near) => {
  try {
    return await fetchPhoton(query, near);
  } catch (error) {
    console.warn('Búsqueda falló, usando respaldo:', error.message);
    return FALLBACK_PLACES.filter((p) => normalize(p.name).includes(normalize(query)));
  }
};

const nearbyFromFallback = (near) =>
  FALLBACK_PLACES.map((p) => ({ ...p, distanceKm: distanceKm(near, p) }))
    .filter((p) => p.distanceKm <= 25)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 5);

const nearbyCache = new Map();

const searchNearby = async (near) => {
  const key = `${near.latitude.toFixed(2)},${near.longitude.toFixed(2)}`;
  const cached = nearbyCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.places;

  try {
    const batches = await Promise.all(NEARBY_QUERIES.map((q) => fetchPhoton(q, near)));
    const places = unique(batches.flat())
      .map((p) => ({ ...p, distanceKm: distanceKm(near, p) }))
      .filter((p) => p.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
    if (places.length === 0) throw new Error('sin resultados cercanos');

    nearbyCache.set(key, { at: Date.now(), places });
    return places;
  } catch (error) {
    console.warn('Cercanos falló, usando respaldo:', error.message);
    return nearbyFromFallback(near);
  }
};

module.exports = { searchPlaces, searchNearby };