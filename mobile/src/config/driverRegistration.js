// Definición de los tres pasos del registro de conductor y de los documentos
// obligatorios. La lógica de validación vive en src/utils/validators.js.

import { CATEGORIES, CATEGORY_LABEL } from './pricing';

export const DRIVER_STEPS = [
  { key: 'personal', label: 'Datos personales' },
  { key: 'vehicle', label: 'Vehículo' },
  { key: 'documents', label: 'Documentos' },
];

export const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
];

export const VEHICLE_CATEGORIES = [CATEGORIES.ECONOMY, CATEGORIES.XL, CATEGORIES.PREMIUM].map(
  (value) => ({ value, label: CATEGORY_LABEL[value] })
);

export const REQUIRED_DOCUMENTS = [
  {
    key: 'license',
    label: 'Licencia de conducción',
    numberLabel: 'Número de licencia',
    expiryLabel: 'Vence el',
    photoHint: 'Foto del frente de la licencia',
  },
  {
    key: 'soat',
    label: 'SOAT',
    numberLabel: 'Número del SOAT',
    expiryLabel: 'Vence el',
    photoHint: 'Foto del certificado del SOAT',
  },
  {
    key: 'technomechanical',
    label: 'Revisión tecnomecánica',
    numberLabel: 'Número del certificado',
    expiryLabel: 'Vence el',
    photoHint: 'Foto del certificado vigente',
  },
];
