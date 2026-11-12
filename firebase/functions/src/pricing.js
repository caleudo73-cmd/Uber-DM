// Copia CommonJS del motor de tarifas para Cloud Functions.
// Debe mantenerse idéntica a mobile/src/config/pricing.js + mobile/src/utils/calculateFare.js.
// mobile/scripts/pricing.test.mjs verifica que ambas implementaciones coincidan.

const CATEGORY_MULTIPLIER = { economy: 1.0, xl: 1.4, premium: 1.8 };

const PRICING = {
  CURRENCY: 'COP',
  BASE_FARE: 3500,
  PER_KM: 1200,
  PER_MINUTE: 250,
  MINIMUM_FARE: 6000,
  COMMISSION_RATE: 0.2,
  ROUNDING_STEP: 100,
};

const roundToStep = (value, step) => Math.round(value / step) * step;

const calculateFare = ({ distanceKm, durationMin, category = 'economy', tip = 0 } = {}) => {
  const km = Number(distanceKm);
  const minutes = Number(durationMin);
  const tipAmount = Number(tip ?? 0);

  if (!Number.isFinite(km) || km < 0) throw new Error('distanceKm inválido');
  if (!Number.isFinite(minutes) || minutes < 0) throw new Error('durationMin inválido');
  if (!Number.isFinite(tipAmount) || tipAmount < 0) throw new Error('tip inválido');

  const multiplier = CATEGORY_MULTIPLIER[category];
  if (!multiplier) throw new Error(`Categoría inválida: ${category}`);

  const raw = PRICING.BASE_FARE + km * PRICING.PER_KM + minutes * PRICING.PER_MINUTE;
  const fare = Math.max(roundToStep(raw * multiplier, PRICING.ROUNDING_STEP), PRICING.MINIMUM_FARE);
  const commission = Math.round(fare * PRICING.COMMISSION_RATE);
  const driverEarnings = fare - commission + Math.round(tipAmount);

  return { fare, commission, driverEarnings, commissionRate: PRICING.COMMISSION_RATE };
};

module.exports = { calculateFare, PRICING, CATEGORY_MULTIPLIER };
