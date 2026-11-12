import { CATEGORY_MULTIPLIER, PRICING } from '../config/pricing.js';

const roundToStep = (value, step) => Math.round(value / step) * step;

/**
 * Función pura usada tanto en la estimación del pasajero como en el cierre del viaje.
 *
 * - La tarifa se redondea al múltiplo de 100 COP más cercano antes de calcular la comisión.
 * - La comisión se aplica solo a la tarifa; la propina va completa al conductor.
 *
 * @param {{ distanceKm: number, durationMin: number, category?: string, tip?: number }} input
 * @returns {{ fare: number, commission: number, driverEarnings: number, commissionRate: number }}
 */
export function calculateFare({ distanceKm, durationMin, category = 'economy', tip = 0 } = {}) {
  const km = Number(distanceKm);
  const minutes = Number(durationMin);
  const tipAmount = Number(tip ?? 0);

  if (!Number.isFinite(km) || km < 0) {
    throw new Error('distanceKm debe ser un número mayor o igual a 0');
  }
  if (!Number.isFinite(minutes) || minutes < 0) {
    throw new Error('durationMin debe ser un número mayor o igual a 0');
  }
  if (!Number.isFinite(tipAmount) || tipAmount < 0) {
    throw new Error('tip debe ser un número mayor o igual a 0');
  }

  const multiplier = CATEGORY_MULTIPLIER[category];
  if (!multiplier) {
    throw new Error(`Categoría inválida: ${category}`);
  }

  const raw = PRICING.BASE_FARE + km * PRICING.PER_KM + minutes * PRICING.PER_MINUTE;
  const fare = Math.max(roundToStep(raw * multiplier, PRICING.ROUNDING_STEP), PRICING.MINIMUM_FARE);
  const commission = Math.round(fare * PRICING.COMMISSION_RATE);
  const driverEarnings = fare - commission + Math.round(tipAmount);

  return { fare, commission, driverEarnings, commissionRate: PRICING.COMMISSION_RATE };
}
