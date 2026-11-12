# Uber App — versión conductor

Aplicación móvil multiplataforma (React Native + Expo) inspirada en Uber. El repositorio
incluye la app del pasajero y la base de la app del conductor, con backend en Firebase
(Authentication + Firestore en tiempo real) y Cloud Functions para los pagos.

## Estructura

```
uber-app/
├── mobile/                 App Expo (React Native)
│   ├── src/config/         Tema, constantes, configuración de Firebase y tarifas
│   ├── src/services/       Acceso a Firebase Auth / Firestore / lugares
│   ├── src/hooks/          Hooks de viaje, perfil, búsqueda y acciones
│   ├── src/screens/        Pantallas
│   ├── src/components/     Componentes reutilizables
│   └── scripts/            Pruebas del motor de tarifas
└── firebase/
    ├── firestore.rules     Reglas de seguridad
    ├── firestore.indexes.json
    └── functions/          Cloud Functions (Mercado Pago) y script de seed
```

## Requisitos

- Node.js 20 o superior
- Cuenta de Firebase (plan Spark sirve para Auth + Firestore)
- Expo Go en el teléfono o un emulador

## 1. Crear el proyecto en Firebase

> Guía paso a paso con capturas de dónde hacer clic y solución de errores comunes:
> [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

1. Entra a <https://console.firebase.google.com> y crea un proyecto.
2. **Authentication** → *Comenzar* → habilita el proveedor **Correo electrónico/contraseña**.
3. **Firestore Database** → *Crear base de datos* → modo producción → región `us-central1`.
4. **Configuración del proyecto** → *Tus apps* → agrega una app **Web** (`</>`).
5. Copia los valores del SDK a `mobile/.env` (ver el paso 2).

## 2. Configurar la app

```bash
cd mobile
npm install
```

Copia `mobile/.env.example` a `mobile/.env` y completa:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Si faltan variables, la app muestra una pantalla con las claves pendientes en lugar de
fallar en blanco.

```bash
npx expo start -c
```

## 3. Publicar reglas y usuarios demo

```bash
cd firebase
npm install -g firebase-tools     # una sola vez
firebase login
# edita .firebaserc y reemplaza REPLACE_WITH_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

Para crear los usuarios demo (`pasajero@demo.com` y `conductor@demo.com`, clave `123456`):

```bash
cd firebase/functions
npm install
# Descarga la clave del service account desde Configuración del proyecto -> Cuentas de servicio
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\serviceAccount.json"
$env:FIREBASE_PROJECT_ID="tu-proyecto"
npm run seed
```

El conductor demo queda **Aprobado**. Los conductores que se registran desde la app quedan
en estado **Pendiente**; para aprobarlos cambia `approvalStatus` a `approved` en la consola
de Firestore (colección `users`).

## 4. Cloud Functions y pagos (Mercado Pago)

```bash
cd firebase/functions
npm install
copy .env.example .env    # completa MERCADO_PAGO_ACCESS_TOKEN de PRUEBA
cd ..
firebase deploy --only functions
```

Las funciones son:

- `createPaymentPreference`: recalcula la tarifa en el servidor y crea la preferencia de
  Checkout Pro. Devuelve `init_point` para abrirla en el navegador o un WebView.
- `mercadoPagoWebhook`: consulta el pago contra la API y actualiza
  `paymentStatus`, `paymentId` y `status: paid`.
- `health`: verificación rápida del despliegue.

El access token vive únicamente en `firebase/functions/.env` (excluido de Git). La app nunca
lo ve. Solo se usan credenciales de prueba.

## 5. Tarifas y comisión

Todos los parámetros están en `mobile/src/config/pricing.js` y la función pura en
`mobile/src/utils/calculateFare.js`:

| Parámetro | Valor |
|---|---|
| Tarifa base | 3.500 COP |
| Por km | 1.200 COP |
| Por minuto | 250 COP |
| Tarifa mínima | 6.000 COP |
| Multiplicador Económico / XL / Premium | 1,0 / 1,4 / 1,8 |
| Comisión | 20 % |

```js
calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy' });
// { fare: 19200, commission: 3840, driverEarnings: 15360, commissionRate: 0.2 }
```

La misma función se usa en la estimación del pasajero y al finalizar el viaje. Cada viaje
guarda el `commissionRate` aplicado. La propina va completa al conductor.

Prueba el motor (incluye el ejemplo de la especificación):

```bash
cd mobile
npm run test:pricing
```

## 6. Flujo actual

- Registro e inicio de sesión con Firebase Auth.
- El pasajero busca un destino, ve la estimación y solicita el viaje.
- El conductor ve las solicitudes en tiempo real (`onSnapshot`), acepta, marca
  *Voy en camino*, *Pasajero a bordo*, finaliza y cobra en efectivo.
- Estados del viaje: `requested → accepted → driver_arriving → in_progress →
  completed → paid` (o `cancelled`).
- Perfil con estadísticas calculadas sobre los viajes.

Pendiente de la especificación completa: registro del conductor en tres pestañas con
documentos, interruptor Disponible/No disponible con seguimiento de ubicación, temporizador
de 15 segundos, pantalla de ganancias, historial con filtros y notificaciones push.

## 7. Uso de IA

La bitácora completa está en [docs/AI_LOG.md](docs/AI_LOG.md).
