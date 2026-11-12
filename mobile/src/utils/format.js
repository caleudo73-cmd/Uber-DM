export const formatPrice = (value, currency = 'COP') =>
  `${currency} ${Math.round(value).toLocaleString('es-CO')}`;

export const formatKm = (km) => `${km.toFixed(1)} km`;

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "11 nov 2026, 15:30"
export const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// "11 nov, 15:30"
export const formatShortDate = (value) => {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
