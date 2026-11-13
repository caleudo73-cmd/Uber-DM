// Pruebas de la distancia y duración del recorrido (Google Distance Matrix
// con respaldo local). Se ejecutan con: npm run test:directions

import assert from 'node:assert/strict';
import {
  DIRECTIONS_TIMEOUT_MS,
  estimateRouteMetrics,
  getRouteMetrics,
  isDirectionsEnabled,
  parseDistanceMatrix,
} from '../src/services/directionsService.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const ORIGIN = { latitude: 6.2442, longitude: -75.5812 }; // Medellín
const DESTINATION = { latitude: 6.15, longitude: -75.6 };

const distanceMatrixResponse = (overrides = {}) => ({
  status: 'OK',
  rows: [
    {
      elements: [
        {
          status: 'OK',
          distance: { value: 12500, text: '12,5 km' },
          duration: { value: 1500, text: '25 min' },
          ...overrides,
        },
      ],
    },
  ],
});

test('Sin llave se usa la estimación local', () => {
  const metrics = estimateRouteMetrics(ORIGIN, DESTINATION);
  assert.equal(metrics.source, 'estimate');
  assert.ok(metrics.distanceKm > 10 && metrics.distanceKm < 12);
  assert.ok(Number.isInteger(metrics.durationMin));
});

test('La estimación local redondea la distancia a dos decimales', () => {
  const metrics = estimateRouteMetrics(ORIGIN, DESTINATION);
  assert.equal(metrics.distanceKm, +metrics.distanceKm.toFixed(2));
  assert.equal(metrics.durationMin, Math.max(1, Math.ceil(metrics.distanceKm * 2.5) + 2));
});

test('Distance Matrix se convierte a km y minutos', () => {
  assert.deepEqual(parseDistanceMatrix(distanceMatrixResponse()), {
    distanceKm: 12.5,
    durationMin: 25,
  });
});

test('Distance Matrix redondea la duración hacia arriba', () => {
  const response = distanceMatrixResponse({ duration: { value: 61 } });
  assert.equal(parseDistanceMatrix(response).durationMin, 2);
});

test('Distance Matrix sin ruta devuelve null', () => {
  assert.equal(parseDistanceMatrix(distanceMatrixResponse({ status: 'ZERO_RESULTS' })), null);
  assert.equal(parseDistanceMatrix({ status: 'ZERO_RESULTS', rows: [] }), null);
  assert.equal(parseDistanceMatrix({ status: 'REQUEST_DENIED' }), null);
  assert.equal(parseDistanceMatrix(null), null);
});

test('Distance Matrix con datos incompletos devuelve null', () => {
  assert.equal(parseDistanceMatrix(distanceMatrixResponse({ distance: undefined })), null);
  assert.equal(parseDistanceMatrix(distanceMatrixResponse({ duration: undefined })), null);
});

test('Sin llave configurada no se llama a la API', async () => {
  let called = false;
  const metrics = await getRouteMetrics(ORIGIN, DESTINATION, {
    apiKey: '',
    fetchImpl: () => {
      called = true;
    },
  });
  assert.equal(called, false);
  assert.equal(metrics.source, 'estimate');
});

test('Con llave se consulta Distance Matrix', async () => {
  let requestedUrl = '';
  const metrics = await getRouteMetrics(ORIGIN, DESTINATION, {
    apiKey: 'test-key',
    fetchImpl: async (url) => {
      requestedUrl = url;
      return { ok: true, json: async () => distanceMatrixResponse() };
    },
  });

  assert.deepEqual(metrics, { distanceKm: 12.5, durationMin: 25, source: 'google' });
  assert.match(requestedUrl, /origins=6\.2442%2C-75\.5812/);
  assert.match(requestedUrl, /destinations=6\.15%2C-75\.6/);
  assert.match(requestedUrl, /mode=driving/);
  assert.match(requestedUrl, /key=test-key/);
});

test('Si Google falla se usa la estimación local', async () => {
  const metrics = await getRouteMetrics(ORIGIN, DESTINATION, {
    apiKey: 'test-key',
    fetchImpl: async () => {
      throw new Error('sin red');
    },
  });
  assert.equal(metrics.source, 'estimate');
  assert.ok(metrics.distanceKm > 0);
});

test('Si Google responde con error HTTP se usa la estimación local', async () => {
  const metrics = await getRouteMetrics(ORIGIN, DESTINATION, {
    apiKey: 'test-key',
    fetchImpl: async () => ({ ok: false, json: async () => ({}) }),
  });
  assert.equal(metrics.source, 'estimate');
});

test('Si Google no encuentra ruta se usa la estimación local', async () => {
  const metrics = await getRouteMetrics(ORIGIN, DESTINATION, {
    apiKey: 'test-key',
    fetchImpl: async () => ({
      ok: true,
      json: async () => distanceMatrixResponse({ status: 'ZERO_RESULTS' }),
    }),
  });
  assert.equal(metrics.source, 'estimate');
});

test('Coordenadas inválidas lanzan un error claro', async () => {
  await assert.rejects(() => getRouteMetrics(null, DESTINATION), /coordenadas válidas/);
  await assert.rejects(
    () => getRouteMetrics(ORIGIN, { latitude: 'x', longitude: 1 }),
    /coordenadas válidas/
  );
});

test('La llave es opcional y el timeout es razonable', () => {
  assert.equal(typeof isDirectionsEnabled(), 'boolean');
  assert.ok(DIRECTIONS_TIMEOUT_MS > 0 && DIRECTIONS_TIMEOUT_MS <= 10000);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}\n       ${error.message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} pruebas correctas`);
if (failed > 0) process.exit(1);
