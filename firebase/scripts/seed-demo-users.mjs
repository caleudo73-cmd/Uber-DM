// Crea los usuarios demo usando la API pública de Firebase (sin service account).
// Uso, desde la raíz del repositorio:
//   node firebase/scripts/seed-demo-users.mjs
//
// Requiere que Email/Password esté habilitado y que mobile/.env tenga las claves.
// Solo para entornos de desarrollo: usa la API key pública y la clave 123456.

import fs from 'node:fs';

const envUrl = new URL('../../mobile/.env', import.meta.url);
const env = Object.fromEntries(
  fs
    .readFileSync(envUrl, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
);

const KEY = env.EXPO_PUBLIC_FIREBASE_API_KEY;
const PROJECT = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

if (!KEY || !PROJECT) {
  console.error('Faltan EXPO_PUBLIC_FIREBASE_API_KEY o EXPO_PUBLIC_FIREBASE_PROJECT_ID en mobile/.env');
  process.exit(1);
}

const AUTH = 'https://identitytoolkit.googleapis.com/v1/accounts:';
const PASSWORD = '123456';

const demoUsers = [
  { name: 'Pasajero Demo', email: 'pasajero@demo.com', role: 'passenger' },
  { name: 'Conductor Demo', email: 'conductor@demo.com', role: 'driver' },
];

const postJson = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

for (const demo of demoUsers) {
  let response = await postJson(`${AUTH}signUp?key=${KEY}`, {
    email: demo.email,
    password: PASSWORD,
    displayName: demo.name,
    returnSecureToken: true,
  });
  let data = await response.json();

  if (!response.ok && data.error?.message === 'EMAIL_EXISTS') {
    response = await postJson(`${AUTH}signInWithPassword?key=${KEY}`, {
      email: demo.email,
      password: PASSWORD,
      returnSecureToken: true,
    });
    data = await response.json();
  }

  if (!response.ok) {
    console.error(`${demo.email}: ${data.error?.message ?? 'error desconocido'}`);
    continue;
  }

  const document = {
    fields: {
      name: { stringValue: demo.name },
      email: { stringValue: demo.email },
      role: { stringValue: demo.role },
      approvalStatus: { stringValue: 'approved' },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };

  const write = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${data.localId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.idToken}`,
      },
      body: JSON.stringify(document),
    }
  );

  if (write.ok) {
    console.log(`OK  ${demo.email}  uid=${data.localId}  rol=${demo.role}`);
  } else {
    const error = await write.json();
    console.error(`FALLO ${demo.email}: ${error.error?.message ?? 'error desconocido'}`);
  }
}
