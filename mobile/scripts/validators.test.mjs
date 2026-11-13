// Pruebas de las validaciones del registro de conductor.
// Se ejecutan con: npm run test:validators

import assert from 'node:assert/strict';
import {
  formatDateInput,
  hasAcceptedTerms,
  isNotExpired,
  isRequired,
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
  normalizePlate,
  parseDateInput,
  toISODate,
} from '../src/utils/validators.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const now = new Date(2026, 10, 11); // 11 de noviembre de 2026

test('Nombre completo exige nombre y apellido', () => {
  assert.equal(isValidFullName('Ana María Pérez'), true);
  assert.equal(isValidFullName('  Ana   Pérez '), true);
  assert.equal(isValidFullName('Ana'), false);
  assert.equal(isValidFullName('Ana123'), false);
  assert.equal(isValidFullName(''), false);
  assert.equal(isValidFullName(`Ana ${'P'.repeat(46)}`), true); // 50 caracteres
  assert.equal(isValidFullName(`Ana ${'P'.repeat(47)}`), false); // 51 caracteres
});

test('Correo electrónico', () => {
  assert.equal(isValidEmail('pasajero@demo.com'), true);
  assert.equal(isValidEmail('pasajero@demo'), false);
  assert.equal(isValidEmail('pasajero demo.com'), false);
});

test('Contraseña de mínimo 6 caracteres', () => {
  assert.equal(isValidPassword('123456'), true);
  assert.equal(isValidPassword('12345'), false);
});

test('Celular colombiano', () => {
  assert.equal(isValidPhone('3001234567'), true);
  assert.equal(isValidPhone('300 123 4567'), true);
  assert.equal(isValidPhone('2001234567'), false);
  assert.equal(isValidPhone('300123456'), false);
});

test('Número de documento entre 6 y 10 dígitos', () => {
  assert.equal(isValidDocumentNumber('1020304050'), true);
  assert.equal(isValidDocumentNumber('12345'), false);
  assert.equal(isValidDocumentNumber('12345678901'), false);
});

test('Placas de carro y moto', () => {
  assert.equal(normalizePlate('abc-123'), 'ABC123');
  assert.equal(isValidPlate('ABC123'), true);
  assert.equal(isValidPlate('abc 123'), true);
  assert.equal(isValidPlate('ABC12A'), true);
  assert.equal(isValidPlate('ABC12'), false);
  assert.equal(isValidPlate('AB1234'), false);
});

test('Año del vehículo', () => {
  assert.equal(isValidVehicleYear('2019', now), true);
  assert.equal(isValidVehicleYear('2026', now), true);
  assert.equal(isValidVehicleYear('2027', now), false);
  assert.equal(isValidVehicleYear('1989', now), false);
  assert.equal(isValidVehicleYear('', now), false);
});

test('Capacidad de pasajeros', () => {
  assert.equal(isValidPassengerCapacity('4', 'economy'), true);
  assert.equal(isValidPassengerCapacity('1', 'premium'), true);
  assert.equal(isValidPassengerCapacity('6', 'xl'), true);
  assert.equal(isValidPassengerCapacity('5', 'xl'), false);
  assert.equal(isValidPassengerCapacity('0', 'economy'), false);
  assert.equal(isValidPassengerCapacity('4.5', 'economy'), false);
  assert.equal(isValidPassengerCapacity('', 'economy'), false);
});

test('Aceptación de términos', () => {
  assert.equal(hasAcceptedTerms(true), true);
  assert.equal(hasAcceptedTerms(false), false);
  assert.equal(hasAcceptedTerms('true'), false);
  assert.equal(hasAcceptedTerms(undefined), false);
});

test('Fechas DD/MM/AAAA', () => {
  assert.equal(formatDateInput('15081999'), '15/08/1999');
  assert.equal(formatDateInput('15/08/1999'), '15/08/1999');
  assert.equal(formatDateInput('1508'), '15/08');
  assert.equal(toISODate('15/08/1999'), '1999-08-15');
  assert.equal(parseDateInput('31/02/2000'), null);
  assert.equal(parseDateInput('15/08/1999') instanceof Date, true);
});

test('Edad entre 18 y 80 años', () => {
  assert.equal(isValidBirthDate('15/08/1999', now), true);
  assert.equal(isValidBirthDate('11/11/2010', now), false);
  assert.equal(isValidBirthDate('11/11/2008', now), true); // cumple 18 justo hoy
  assert.equal(isValidBirthDate('01/01/1900', now), false);
});

test('Documentos vigentes', () => {
  assert.equal(isNotExpired('11/11/2026', now), false); // vence hoy: ya no sirve
  assert.equal(isNotExpired('12/11/2026', now), true); // posterior a hoy
  assert.equal(isNotExpired('10/11/2026', now), false);
  assert.equal(isNotExpired('01/01/2028', now), true);
  assert.equal(isNotExpired('', now), false);
});

test('Marca y modelo máximo 30 caracteres', () => {
  assert.equal(isValidVehicleText('Renault'), true);
  assert.equal(isValidVehicleText('  Logan  '), true);
  assert.equal(isValidVehicleText('A'.repeat(30)), true);
  assert.equal(isValidVehicleText('A'.repeat(31)), false);
  assert.equal(isValidVehicleText('   '), false);
});

test('Números de documentos', () => {
  assert.equal(isValidLicenseNumber('12345678'), true);
  assert.equal(isValidLicenseNumber('AB-12'), false);
  assert.equal(isValidSoatNumber('SOAT-123456'), true);
  assert.equal(isValidSoatNumber('12'), false);
  assert.equal(isValidTechnomechanicalNumber('TM-998877'), true);
});

test('Campos obligatorios', () => {
  assert.equal(isRequired('Medellín'), true);
  assert.equal(isRequired('   '), false);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}\n       ${error.message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} pruebas correctas`);
if (failed > 0) process.exit(1);
