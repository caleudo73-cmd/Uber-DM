import { useCallback, useMemo, useState } from 'react';
import { DRIVER_STEPS } from '../config/driverRegistration';
import { ROLES } from '../config/constants';
import { CATEGORIES } from '../config/pricing';
import {
  formatDateInput,
  isNotExpired,
  isValidBirthDate,
  isValidDocumentNumber,
  isValidEmail,
  isValidFullName,
  isValidLicenseNumber,
  isValidPassword,
  isValidPhone,
  isValidPlate,
  isValidSoatNumber,
  isValidTechnomechanicalNumber,
  isValidVehicleYear,
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
  city: 'Medellín',
  address: '',
  // Paso 2: vehículo
  vehicleBrand: '',
  vehicleLine: '',
  vehicleYear: '',
  vehiclePlate: '',
  vehicleColor: '',
  vehicleCategory: CATEGORIES.ECONOMY,
  // Paso 3: documentos
  licenseNumber: '',
  licenseExpiresAt: '',
  soatNumber: '',
  soatExpiresAt: '',
  technomechanicalNumber: '',
  technomechanicalExpiresAt: '',
};

const STEP_FIELDS = {
  personal: ['name', 'email', 'password', 'confirmPassword', 'documentNumber', 'birthDate', 'phone', 'city', 'address'],
  vehicle: ['vehicleBrand', 'vehicleLine', 'vehicleYear', 'vehiclePlate', 'vehicleColor'],
  documents: [
    'licenseNumber',
    'licenseExpiresAt',
    'soatNumber',
    'soatExpiresAt',
    'technomechanicalNumber',
    'technomechanicalExpiresAt',
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
  city: (value) => (required(value) ? null : 'Escribe tu ciudad'),
  address: (value) =>
    String(value).trim().length >= 5 ? null : 'Escribe tu dirección (mínimo 5 caracteres)',
  vehicleBrand: (value) => (required(value) ? null : 'Escribe la marca'),
  vehicleLine: (value) => (required(value) ? null : 'Escribe la línea o modelo'),
  vehicleYear: (value) => (isValidVehicleYear(value) ? null : 'Año entre 1990 y el próximo año'),
  vehiclePlate: (value) => (isValidPlate(value) ? null : 'Placa inválida (ej. ABC123)'),
  vehicleColor: (value) => (required(value) ? null : 'Escribe el color'),
  licenseNumber: (value) => (isValidLicenseNumber(value) ? null : 'Número de licencia inválido'),
  licenseExpiresAt: (value) => (isNotExpired(value) ? null : 'La licencia debe estar vigente'),
  soatNumber: (value) => (isValidSoatNumber(value) ? null : 'Número de SOAT inválido'),
  soatExpiresAt: (value) => (isNotExpired(value) ? null : 'El SOAT debe estar vigente'),
  technomechanicalNumber: (value) =>
    isValidTechnomechanicalNumber(value) ? null : 'Número de certificado inválido',
  technomechanicalExpiresAt: (value) =>
    isNotExpired(value) ? null : 'La tecnomecánica debe estar vigente',
};

const PHOTO_KEYS = ['license', 'soat', 'technomechanical'];

export default function useDriverRegisterForm() {
  const { signUp } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [photos, setPhotos] = useState({ license: null, soat: null, technomechanical: null });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const { run, loading, error } = useAsyncAction(signUp);

  const stepKey = DRIVER_STEPS[step].key;

  const setField = useCallback((name, rawValue) => {
    let value = rawValue;
    if (['documentNumber', 'phone'].includes(name)) value = onlyDigits(rawValue);
    if (name === 'vehicleYear') value = onlyDigits(rawValue).slice(0, 4);
    if (name === 'vehiclePlate') value = normalizePlate(rawValue).slice(0, 6);
    if (name.endsWith('ExpiresAt') || name === 'birthDate') value = formatDateInput(rawValue);

    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
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
      const found = validateFields(STEP_FIELDS[key], currentValues);
      if (key === 'documents') {
        for (const photoKey of PHOTO_KEYS) {
          if (!currentPhotos[photoKey]?.base64) {
            found[`photo_${photoKey}`] = 'Adjunta una foto del documento';
          }
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
      const firstInvalid = DRIVER_STEPS.findIndex((item) =>
        STEP_FIELDS[item.key].some((key) => allErrors[key])
      );
      const documentsInvalid = PHOTO_KEYS.some((key) => allErrors[`photo_${key}`]);
      setStep(firstInvalid >= 0 ? firstInvalid : documentsInvalid ? 2 : 0);
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
      city: values.city.trim(),
      address: values.address.trim(),
      vehicle: {
        brand: values.vehicleBrand.trim(),
        line: values.vehicleLine.trim(),
        year: Number(values.vehicleYear),
        plate: normalizePlate(values.vehiclePlate),
        color: values.vehicleColor.trim(),
        category: values.vehicleCategory,
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
        technomechanical: {
          number: values.technomechanicalNumber.trim(),
          expiresAt: toISODate(values.technomechanicalExpiresAt),
        },
      },
      photos: Object.fromEntries(
        PHOTO_KEYS.map((key) => [
          key,
          photos[key]?.base64
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
