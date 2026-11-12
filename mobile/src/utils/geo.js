const EARTH_RADIUS_KM = 6371;

const toRad = (degrees) => (degrees * Math.PI) / 180;

// Distancia en línea recta entre dos coordenadas { latitude, longitude }.
export const distanceKm = (a, b) => {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

// Estimación temporal mientras no se conecta Google Distance Matrix.
// Se reemplaza por la duración real cuando se agregue la API key.
export const estimateDurationMin = (km) => Math.max(1, Math.ceil(km * 2.5) + 2);
