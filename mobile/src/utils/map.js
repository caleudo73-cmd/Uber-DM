import { DEFAULT_REGION } from '../config/constants';

// Región que encierra todos los puntos (con margen para el panel inferior).
export const regionFor = (points) => {
  const valid = points.filter(Boolean);
  if (valid.length === 0) return DEFAULT_REGION;

  const lats = valid.map((p) => p.latitude);
  const lons = valid.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 2.2, 0.03),
    longitudeDelta: Math.max((maxLon - minLon) * 2.2, 0.03),
  };
};