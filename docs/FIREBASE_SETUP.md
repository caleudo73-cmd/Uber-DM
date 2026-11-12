# Guía: configurar Firebase para Uber App

Tiempo estimado: 15–20 minutos. Al terminar tendrás login, base de datos en tiempo real
y los dos usuarios demo funcionando.

> Todo esto se hace **una sola vez**. Las credenciales de pago (Mercado Pago) van aparte,
> en el paso 10, y son opcionales para probar la app.

---

## 0. Antes de empezar

- Cuenta de Google.
- Node.js instalado (ya lo tienes).
- El proyecto en `C:\Users\genie\Desktop\uber-app`.

**Plan:** Authentication y Firestore funcionan en el plan gratuito **Spark**. Las Cloud
Functions (pagos) requieren **Blaze** (pago por uso, con cuota gratuita). Para el flujo de
viajes no necesitas Blaze.

---

## 1. Crear el proyecto

1. Entra a <https://console.firebase.google.com>.
2. **Crear proyecto** (o *Add project*).
3. Nombre: `uber-app` (o el que quieras). Firebase le agrega un ID único, por ejemplo
   `uber-app-4f3a1`.
4. Google Analytics: puedes desactivarlo.
5. **Crear proyecto** y espera.

Anota el **ID del proyecto** (lo usarás en el paso 6). Está en *Configuración del proyecto
→ General*.

---

## 2. Registrar la app y copiar la configuración

1. En la pantalla del proyecto, clic en el ícono **`</>`** (*Web*).
2. Apodo: `uber-app-mobile`. **No** marques Firebase Hosting.
3. **Registrar app**.
4. Firebase muestra un bloque `const firebaseConfig = { ... }`. Cópialo; lo necesitas en
   el paso 3. Se ve así:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "uber-app-4f3a1.firebaseapp.com",
  projectId: "uber-app-4f3a1",
  storageBucket: "uber-app-4f3a1.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

> Estos valores son públicos (van dentro de la app); la seguridad real la dan las reglas
> de Firestore. No pasa nada si terminan en el repositorio, pero igual los dejamos en
> `.env`.

---

## 3. Crear `mobile/.env`

En PowerShell, desde la raíz del proyecto:

```powershell
cd C:\Users\genie\Desktop\uber-app
copy mobile\.env.example mobile\.env
notepad mobile\.env
```

Completa con tus valores, **sin comillas**:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=uber-app-4f3a1.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=uber-app-4f3a1
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=uber-app-4f3a1.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
```

Guarda y cierra. `mobile/.env` está en `.gitignore`: no se sube al repositorio.

---

## 4. Habilitar Authentication

1. Menú izquierdo → **Compilación → Authentication**.
2. **Comenzar**.
3. Pestaña **Sign-in method** → **Correo electrónico/contraseña**.
4. Activa **Habilitar** → **Guardar**.

Sin esto, el registro falla con `auth/operation-not-allowed`.

---

## 5. Crear Firestore

1. Menú izquierdo → **Compilación → Firestore Database**.
2. **Crear base de datos**.
3. Ubicación: `us-central1` (la misma región de las Cloud Functions).
4. Modo: **Producción**.
5. **Crear**.

Quedará bloqueada hasta que despliegues las reglas del paso 6. Es lo esperado.

---

## 6. Instalar la CLI, asociar el proyecto y desplegar reglas

```powershell
npm install -g firebase-tools
cd C:\Users\genie\Desktop\uber-app\firebase
firebase login
```

Se abre el navegador: inicia sesión con la misma cuenta de Google.

Asocia la carpeta con tu proyecto:

```powershell
firebase use --add
```

- Elige tu proyecto de la lista.
- Alias: escribe `default`.

Esto reemplaza el `REPLACE_WITH_FIREBASE_PROJECT_ID` de `firebase/.firebaserc`.

Despliega las reglas de seguridad:

```powershell
firebase deploy --only firestore:rules
```

Debe terminar con `Deploy complete!`.

---

## 7. Crear los usuarios demo

### Opción A — script (recomendada)

1. En Firebase: **Configuración del proyecto → Cuentas de servicio**.
2. **Generar nueva clave privada** → se descarga un `.json`.
3. Guárdalo **fuera del repositorio**, por ejemplo:
   `C:\Users\genie\secrets\uber-app-service-account.json`.
4. Ejecuta:

```powershell
cd C:\Users\genie\Desktop\uber-app\firebase\functions
npm install
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\genie\secrets\uber-app-service-account.json"
$env:FIREBASE_PROJECT_ID="tu-project-id"
npm run seed
```

Debe imprimir `Perfil listo: users/...` para los dos usuarios.

### Opción B — a mano (si no quieres usar el service account)

1. **Authentication → Users → Add user**:
   - `pasajero@demo.com` / `123456`
   - `conductor@demo.com` / `123456`
2. Copia el **UID** de cada uno.
3. **Firestore → Start collection** `users` → documento con el UID:
   - Pasajero: `name`, `email`, `role: "passenger"`, `approvalStatus: "approved"`.
   - Conductor: `name`, `email`, `role: "driver"`, `approvalStatus: "approved"`.

> El documento del conductor es obligatorio. Si falta, la app lo trata como pasajero
> porque el rol por defecto es `passenger`.

---

## 8. Arrancar la app

```powershell
cd C:\Users\genie\Desktop\uber-app\mobile
npx expo start -c
```

La `-c` borra la caché de Metro: es necesaria porque cambió `.env` y se instalaron
paquetes nuevos. Escanea el QR con Expo Go.

---

## 9. Verificación

Haz esta prueba corta:

1. Abre la app → inicia sesión con `pasajero@demo.com` / `123456`.
2. En Firebase → **Authentication → Users** deben aparecer los usuarios.
3. En Firestore → colección `users` deben estar los dos documentos.
4. Con el pasajero: elige un destino y solicita un viaje.
5. En Firestore → colección `trips` debe aparecer el documento con `status: "requested"`.
6. Cierra sesión y entra con `conductor@demo.com`.
7. El conductor debe ver la solicitud. Al aceptar, el documento cambia a `accepted` **sin
   recargar**: eso confirma que `onSnapshot` está funcionando.
8. Finaliza el viaje: se guardan `fare`, `commission`, `driverEarnings` y
   `commissionRate: 0.2`.

Si algo falla, revisa la sección de errores.

---

## 10. Cloud Functions y Mercado Pago (opcional)

Requiere plan **Blaze**. Solo si vas a probar el cobro con tarjeta.

```powershell
cd C:\Users\genie\Desktop\uber-app\firebase\functions
copy .env.example .env
notepad .env
```

Completa con credenciales **de prueba**:

- `MERCADO_PAGO_ACCESS_TOKEN`: panel de Mercado Pago → *Tus integraciones* → aplicación →
  *Credenciales de prueba*.
- `MERCADO_PAGO_WEBHOOK_URL`: la URL de la función `mercadoPagoWebhook` (te la da Firebase
  después del primer deploy).
- `MERCADO_PAGO_BACK_URL`: puede ser cualquier URL HTTPS tuya o de ejemplo.

```powershell
cd C:\Users\genie\Desktop\uber-app\firebase
firebase deploy --only functions
```

La app todavía no tiene la pantalla de pago conectada; esta parte queda lista para la
siguiente fase.

---

## 11. Errores comunes

| Síntoma | Causa | Solución |
|---|---|---|
| Pantalla «Falta configurar Firebase» | `.env` ausente o vacío | Crear `mobile/.env` y reiniciar con `npx expo start -c` |
| `auth/operation-not-allowed` | Email/Password deshabilitado | Paso 4 |
| `auth/invalid-api-key` | `apiKey` mal copiada | Revisar paso 3 |
| `permission-denied` en Firestore | Reglas sin desplegar | Paso 6 |
| El conductor no ve solicitudes | `approvalStatus` distinto de `approved` o falta el documento `users/{uid}` | Paso 7 |
| No aparece nada en Firestore | La app está usando otro proyecto | Revisar `projectId` en `.env` |
| `firebase deploy` falla con permisos | Cuenta sin rol en el proyecto | Usar la cuenta dueña del proyecto |
| Error al desplegar Functions | Plan Spark | Cambiar a Blaze o dejar los pagos para después |

---

## 12. Dónde vive cada credencial

| Credencial | Ubicación | ¿Se sube a Git? |
|---|---|---|
| Config del SDK web (apiKey, projectId…) | `mobile/.env` | No |
| Service account (seed) | Fuera del repo, en `C:\Users\genie\secrets\` | No |
| Access token de Mercado Pago | `firebase/functions/.env` | No |
| Nombres de variables (sin valores) | `mobile/.env.example`, `firebase/functions/.env.example` | Sí |
| Reglas de seguridad | `firebase/firestore.rules` | Sí |

Regla de oro: **ningún token secreto en el código de la app ni en el repositorio**.
