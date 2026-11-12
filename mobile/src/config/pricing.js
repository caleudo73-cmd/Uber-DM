// ÚNICO lugar donde se configuran las tarifas y la comisión.
// Todos los valores están en pesos colombianos enteros (COP).

export const CATEGORIES = {
  ECONOMY: 'economy',
  XL: 'xl',
  PREMIUM: 'premium',
};

export const CATEGORY_LABEL = {
  [CATEGORIES.ECONOMY]: 'Económico',
  [CATEGORIES.XL]: 'XL',
  [CATEGORIES.PREMIUM]: 'Premium',
};

// Multiplicador aplicado a la tarifa base + distancia + tiempo.
export const CATEGORY_MULTIPLIER = {
  [CATEGORIES.ECONOMY]: 1.0,
  [CATEGORIES.XL]: 1.4,
  [CATEGORIES.PREMIUM]: 1.8,
};

export const PRICING = {
  CURRENCY: 'COP',
  BASE_FARE: 3500,
  PER_KM: 1200,
  PER_MINUTE: 250,
  MINIMUM_FARE: 6000,
  COMMISSION_RATE: 0.2,
  ROUNDING_STEP: 100,
};

export const DEFAULT_CATEGORY = CATEGORIES.ECONOMY;
