// Cuenta regresiva de las solicitudes de viaje. Funciones puras para poder
// probarlas sin React ni Firebase (mobile/scripts/countdown.test.mjs).

// Segundos que tiene el conductor para aceptar una solicitud antes de que
// desaparezca de su pantalla.
export const REQUEST_TIMEOUT_SECONDS = 15;

const toMillis = (createdAt) => {
  if (typeof createdAt === 'number') return createdAt;
  if (createdAt instanceof Date) return createdAt.getTime();
  const parsed = Date.parse(createdAt ?? '');
  return Number.isFinite(parsed) ? parsed : null;
};

// Segundos restantes (con decimales) desde que se creó la solicitud.
// Si no hay fecha válida se devuelve el tiempo completo: la tarjeta se muestra
// con la cuenta regresiva completa en lugar de desaparecer.
export const remainingSeconds = (
  createdAt,
  now = Date.now(),
  timeoutSeconds = REQUEST_TIMEOUT_SECONDS
) => {
  const started = toMillis(createdAt);
  if (started === null) return timeoutSeconds;

  const elapsed = (now - started) / 1000;
  return Math.max(0, Math.min(timeoutSeconds, timeoutSeconds - elapsed));
};

// Fracción de tiempo restante entre 0 y 1, para la barra de progreso.
export const remainingRatio = (
  createdAt,
  now = Date.now(),
  timeoutSeconds = REQUEST_TIMEOUT_SECONDS
) => remainingSeconds(createdAt, now, timeoutSeconds) / timeoutSeconds;

export const isExpired = (
  createdAt,
  now = Date.now(),
  timeoutSeconds = REQUEST_TIMEOUT_SECONDS
) => remainingSeconds(createdAt, now, timeoutSeconds) <= 0;
