// Validaciones puras del registro de conductor.
// Sin dependencias de React ni de Firebase: se pueden probar con Node
// (mobile/scripts/validators.test.mjs).

export const MIN_PASSWORD_LENGTH = 6;
export const MIN_AGE = 18;
export const MAX_AGE = 80;
export const MIN_VEHICLE_YEAR = 1990;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/;

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

export const isRequired = (value) => String(value ?? '').trim().length > 0;

export const isValidEmail = (value) => EMAIL_RE.test(String(value ?? '').trim());

export const isValidPassword = (value) =>
  String(value ?? '').length >= MIN_PASSWORD_LENGTH;

// Nombre completo: al menos nombre y apellido, solo letras y separadores.
export const isValidFullName = (value) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (text.length < 5 || text.length > 80) return false;
  if (!NAME_RE.test(text)) return false;
  return text.split(' ').filter(Boolean).length >= 2;
};

// Celular colombiano: 10 dígitos y empieza por 3.
export const isValidPhone = (value) => /^3\d{9}$/.test(onlyDigits(value));

// Cédula / extranjería: entre 6 y 10 dígitos.
export const isValidDocumentNumber = (value) => /^\d{6,10}$/.test(onlyDigits(value));

export const normalizePlate = (value) =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

// Placas colombianas: carro AAA123 o moto AAA12A.
export const isValidPlate = (value) => {
  const plate = normalizePlate(value);
  return /^[A-Z]{3}\d{3}$/.test(plate) || /^[A-Z]{3}\d{2}[A-Z]$/.test(plate);
};

export const isValidVehicleYear = (value, now = new Date()) => {
  const year = Number(value);
  if (!Number.isInteger(year)) return false;
  return year >= MIN_VEHICLE_YEAR && year <= now.getFullYear() + 1;
};

export const isValidLicenseNumber = (value) => /^[A-Za-z0-9]{5,15}$/.test(String(value ?? '').trim());

export const isValidSoatNumber = (value) => /^[A-Za-z0-9-]{5,20}$/.test(String(value ?? '').trim());

export const isValidTechnomechanicalNumber = (value) =>
  /^[A-Za-z0-9-]{5,20}$/.test(String(value ?? '').trim());

// --- Fechas en formato DD/MM/AAAA ---

export const formatDateInput = (value) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// Devuelve un Date a medianoche local o null si la fecha no existe.
export const parseDateInput = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? '').trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const startOfToday = (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const ageInYears = (birthDate, now = new Date()) => {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return age;
};

export const isValidBirthDate = (value, now = new Date()) => {
  const date = parseDateInput(value);
  if (!date) return false;
  const age = ageInYears(date, now);
  return age >= MIN_AGE && age <= MAX_AGE;
};

// Documentos vigentes: la fecha de vencimiento debe ser hoy o posterior.
export const isNotExpired = (value, now = new Date()) => {
  const date = parseDateInput(value);
  if (!date) return false;
  return date.getTime() >= startOfToday(now).getTime();
};

export const toISODate = (value) => {
  const date = parseDateInput(value);
  if (!date) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
