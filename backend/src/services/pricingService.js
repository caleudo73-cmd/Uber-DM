const { PRICING } = require('../config/constants');

const toRad = (deg) => (deg * Math.PI) / 180;

const distanceKm = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const calculatePrice = (km) => {
  const raw = PRICING.BASE_FARE + km * PRICING.PER_KM;
  return Math.round(Math.max(raw, PRICING.MIN_FARE) / 100) * 100;
};

module.exports = { distanceKm, calculatePrice };
