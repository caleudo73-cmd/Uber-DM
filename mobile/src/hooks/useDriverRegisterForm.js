// AI-assisted: see docs/AI_LOG.md #8
import { useCallback, useMemo, useState } from 'react';
import { DRIVER_STEPS } from '../config/driverRegistration';
import { ROLES } from '../config/constants';
import { CATEGORIES } from '../config/pricing';
import {
  formatDateInput,
  hasAcceptedTerms,
  isNotExpired,
  isValidBirthDate,
  isValidDocumentNumber,
  isValidEmail,
  isValidFullName,
  isValidLicenseNumber,
  isValidPassengerCapacity,
  isValidPassword,
  isValidPhone,
  isValidPlate,
  isValidSoatNumber,
  isValidTechnomechanicalNumber,
  isValidVehicleYear,
  isValidVehicleText,
  needsTechnomechanical,
  normalizePlate,
  onlyDigits,
  toISODate,
} from '../utils/validators';
import useAsyncAction from './useAsyncAction';
import useAuth from './useAuth';

const initialValues = {
  // Paso 1: datos personales y cuenta
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  documentType: 'CC',
  documentNumber: '',
  birthDate: '',
  phone: '',
  gender: '',
  language: 'es',
  city: 'Medellín',
  address: '',
  // Paso 2: vehículo
  vehicleBrand: '',
  vehicleLine: '',
  vehicleYear: '',
  vehiclePlate: '',
  vehicleColor: '',
  vehicleCategory: CATEGORIES.ECONOMY,
  vehicleCapacity: '',
  // Paso 3: documentos
  licenseNumber: '',
  licenseExpiresAt: '',
  soatNumber: '',
  soatExpiresAt: '',
  technomechanicalNumber: '',
  technomechanicalExpiresAt: '',
  mercadoPagoEmail: '',
  acceptTerms: false,
};

const STEP_FIELDS = {
  personal: [
    'name',
    'email',
    'password',
    'confirmPassword',
    'documentNumber',
    'birthDate',
    'phone',
    'gender',
    'language',
    'city',
    'address',
  ],
  vehicle: ['vehicleBrand', 'vehicleLine', 'vehicleYear', 'vehiclePlate', 'vehicleColor', 'vehicleCapacity'],
  documents: [
    'licenseNumber',
    'licenseExpiresAt',
    'soatNumber',
    'soatExpiresAt',
    'technomechanicalNumber',
    'technomechanicalExpiresAt',
    'mercadoPagoEmail',
    'acceptTerms',
  ],
};

// Cada paso valida sus propias fotos obligatorias.
const STEP_PHOTOS = {
  personal: [{ key: 'profile', message: 'Adjunta tu foto de perfil' }],
  vehicle: [{ key: 'vehicle', message: 'Adjunta una foto donde se vea la placa' }],
  documents: [
    { key: 'license', message: 'Adjunta una foto de la licencia' },
    { key: 'soat', message: 'Adjunta una foto del SOAT' },
    { key: 'technomechanical', message: 'Adjunta una foto de la tecnomecánica' },
  ],
};

const required = (value) => String(value ?? '').trim().length > 0;

const fieldValidators = {
  name: (value) => (isValidFullName(value) ? null : 'Escribe nombre y apellido (solo letras)'),
  email: (value) => (isValidEmail(value) ? null : 'Correo electrónico inválido'),
  password: (value) =>
    isValidPassword(value) ? null : 'La contraseña debe tener mínimo 6 caracteres',
  confirmPassword: (value, values) =>
    value === values.password ? null : 'Las contraseñas no coinciden',
  documentNumber: (value) => (isValidDocumentNumber(value) ? null : 'Entre 6 y 10 dígitos'),
  birthDate: (value) => (isValidBirthDate(value) ? null : 'Debes tener entre 18 y 80 años'),
  phone: (value) => (isValidPhone(value) ? null : 'Celular de 10 dígitos que empiece por 3'),
  gender: (value) => (required(value) ? null : 'Selecciona tu género'),
  language: (value) => (required(value) ? null : 'Selecciona el idioma'),
  city: (value) => (required(value) ? null : 'Escribe tu ciudad'),
  address: (value) =>
    String(value).trim().length >= 5 ? null : 'Escribe tu dirección (mínimo 5 caracteres)',
  vehicleBrand: (value) =>
    isValidVehicleText(value) ? null : 'Máximo 30 caracteres',
  vehicleLine: (value) =>
    isValidVehicleText(value) ? null : 'Máximo 30 caracteres',
  vehicleYear: (value) => (isValidVehicleYear(value) ? null : 'Año entre 1990 y el año actual'),
  vehiclePlate: (value) => (isValidPlate(value) ? null : 'Placa inválida (ej. ABC123)'),
  vehicleColor: (value) => (required(value) ? null : 'Selecciona el color'),
  vehicleCapacity: (value, values) => {
    if (isValidPassengerCapacity(value, values.vehicleCategory)) return null;
    return values.vehicleCategory === CATEGORIES.XL
      ? 'XL exige mínimo 6 pasajeros'
      : 'Capacidad inválida (mínimo 1)';
  },
  licenseNumber: (value) => (isValidLicenseNumber(value) ? null : 'Número de licencia inválido'),
  licenseExpiresAt: (value) => (isNotExpired(value) ? null : 'La licencia debe estar vigente'),
  soatNumber: (value) => (isValidSoatNumber(value) ? null : 'Número de SOAT inválido'),
  soatExpiresAt: (value) => (isNotExpired(value) ? null : 'El SOAT debe estar vigente'),
  mercadoPagoEmail: (value) =>
    isValidEmail(value) ? null : 'Correo de Mercado Pago inválido',
  acceptTerms: (value) =>
    hasAcceptedTerms(value) ? null : 'Debes aceptar los términos y la comisión',
  technomechanicalNumber: (value) =>
    isValidTechnomechanicalNumber(value) ? null : 'Número de certificado inválido',
  technomechanicalExpiresAt: (value) =>
    isNotExpired(value) ? null : 'La tecnomecánica debe estar vigente',
};

const PHOTO_KEYS = Object.values(STEP_PHOTOS).flat().map((photo) => photo.key);
const initialPhotos = Object.fromEntries(PHOTO_KEYS.map((key) => [key, null]));

export default function useDriverRegisterForm() {
  const { signUp } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [photos, setPhotos] = useState(initialPhotos);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const { run, loading, error } = useAsyncAction(signUp);

  const stepKey = DRIVER_STEPS[step].key;

  const setField = useCallback((name, rawValue) => {
    let value = rawValue;
    if (['documentNumber', 'phone'].includes(name)) value = onlyDigits(rawValue);
    if (name === 'vehicleYear') value = onlyDigits(rawValue).slice(0, 4);
    if (name === 'vehicleCapacity') value = onlyDigits(rawValue).slice(0, 2);
    if (name === 'vehiclePlate') value = normalizePlate(rawValue).slice(0, 6);
    if (name === 'vehicleBrand' || name === 'vehicleLine') value = rawValue.slice(0, 30);
    if (name.endsWith('ExpiresAt') || name === 'birthDate') value = formatDateInput(rawValue);

    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      // Al cambiar de categoría, la capacidad se vuelve a validar.
      const keys = name === 'vehicleCategory' ? [name, 'vehicleCapacity'] : [name];
      // Si cambia el año, la tecnomecánica puede dejar de aplicar.
      if (name === 'vehicleYear') {
        keys.push('technomechanicalNumber', 'technomechanicalExpiresAt', 'photo_technomechanical');
      }
      if (!keys.some((key) => current[key])) return current;
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  const setPhoto = useCallback((key, photo) => {
    setPhotos((current) => ({ ...current, [key]: photo }));
    setErrors((current) => {
      if (!current[`photo_${key}`]) return current;
      const next = { ...current };
      delete next[`photo_${key}`];
      return next;
    });
  }, []);

  const validateFields = useCallback(
    (keys, currentValues) => {
      const found = {};
      for (const key of keys) {
        const message = fieldValidators[key]?.(currentValues[key], currentValues);
        if (message) found[key] = message;
      }
      return found;
    },
    []
  );

  const validateStep = useCallback(
    (index, currentValues = values, currentPhotos = photos) => {
      const key = DRIVER_STEPS[index].key;
      // La tecnomecánica solo se exige si el vehículo tiene 6 años o más.
      const skipTechnomechanical = !needsTechnomechanical(currentValues.vehicleYear);
      const fields = STEP_FIELDS[key].filter(
        (field) => !(skipTechnomechanical && field.startsWith('technomechanical'))
      );
      const found = validateFields(fields, currentValues);
      for (const photo of STEP_PHOTOS[key] ?? []) {
        if (skipTechnomechanical && photo.key === 'technomechanical') continue;
        if (!currentPhotos[photo.key]?.base64) {
          found[`photo_${photo.key}`] = photo.message;
        }
      }
      return found;
    },
    [photos, validateFields, values]
  );

  const next = useCallback(() => {
    const found = validateStep(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return false;
    setStep((current) => Math.min(current + 1, DRIVER_STEPS.length - 1));
    return true;
  }, [step, validateStep]);

  const back = useCallback(() => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const goToStep = useCallback((index) => {
    setErrors({});
    setStep(Math.min(Math.max(index, 0), DRIVER_STEPS.length - 1));
  }, []);

  const submit = useCallback(async () => {
    const allErrors = {};
    DRIVER_STEPS.forEach((_, index) => {
      Object.assign(allErrors, validateStep(index));
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstInvalid = DRIVER_STEPS.findIndex((item) => {
        const keys = STEP_FIELDS[item.key] ?? [];
        const photoKeys = (STEP_PHOTOS[item.key] ?? []).map((photo) => `photo_${photo.key}`);
        return [...keys, ...photoKeys].some((key) => allErrors[key]);
      });
      setStep(firstInvalid >= 0 ? firstInvalid : 0);
      return null;
    }

    const payload = {
      name: values.name.trim().replace(/\s+/g, ' '),
      email: values.email.trim(),
      password: values.password,
      role: ROLES.DRIVER,
      phone: onlyDigits(values.phone),
      documentType: values.documentType,
      documentNumber: onlyDigits(values.documentNumber),
      birthDate: toISODate(values.birthDate),
      gender: values.gender,
      language: values.language,
      city: values.city.trim(),
      address: values.address.trim(),
      vehicle: {
        brand: values.vehicleBrand.trim(),
        line: values.vehicleLine.trim(),
        year: Number(values.vehicleYear),
        plate: normalizePlate(values.vehiclePlate),
        color: values.vehicleColor.trim(),
        category: values.vehicleCategory,
        capacity: Number(values.vehicleCapacity),
      },
      documents: {
        license: {
          number: values.licenseNumber.trim(),
          expiresAt: toISODate(values.licenseExpiresAt),
        },
        soat: {
          number: values.soatNumber.trim(),
          expiresAt: toISODate(values.soatExpiresAt),
        },
        technomechanical: needsTechnomechanical(values.vehicleYear)
          ? {
              number: values.technomechanicalNumber.trim(),
              expiresAt: toISODate(values.technomechanicalExpiresAt),
            }
          : null,
      },
      mercadoPagoEmail: values.mercadoPagoEmail.trim().toLowerCase(),
      acceptedTerms: values.acceptTerms,
      photos: Object.fromEntries(
        PHOTO_KEYS.map((key) => [
          key,
          key === 'technomechanical' && !needsTechnomechanical(values.vehicleYear)
            ? null
            : photos[key]?.base64
              ? { base64: photos[key].base64, mimeType: photos[key].mimeType ?? 'image/jpeg' }
              : null,
        ])
      ),
    };

    return run(payload);
  }, [photos, run, validateStep, values]);

  const completed = useMemo(() => {
    const done = {};
    DRIVER_STEPS.forEach((item, index) => {
      done[item.key] = index < step;
    });
    return done;
  }, [step]);

  return {
    step,
    stepKey,
    stepCount: DRIVER_STEPS.length,
    isLastStep: step === DRIVER_STEPS.length - 1,
    completed,
    values,
    errors,
    photos,
    setField,
    setPhoto,
    next,
    back,
    goToStep,
    submit,
    loading,
    error,
  };
}
