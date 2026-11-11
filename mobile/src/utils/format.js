export const formatPrice = (value, currency = 'COP') =>
  `${currency} ${Math.round(value).toLocaleString('es-CO')}`;

export const formatKm = (km) => `${km.toFixed(1)} km`;
