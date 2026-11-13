# Arquitectura

Documento de referencia para entender y sustentar el proyecto sin leer todo el código.

## 1. Visión general

Aplicación móvil **React Native + Expo** con dos roles (`passenger` y `driver`) y backend
**Firebase**:

- **Firebase Authentication** (correo/contraseña) para la sesión.
- **Cloud Firestore** como base de datos en tiempo real (`onSnapshot`).
- **Cloud Functions** solo para el camino opcional de Mercado Pago real (no desplegado).

No hay backend propio: la app habla directo con Firebase. Por eso las **reglas de Firestore**
son la última línea de defensa y están escritas para que el cliente no pueda alterar la
cotización, el recorrido, la calificación ni el pago real.

```
┌──────────────────────────── App Expo ────────────────────────────┐
│  screens/  ──>  hooks/  ──>  services/  ──>  Firebase SDK        │
│     │             │             │                                │
│     └── components/            └── utils/ (funciones puras)      │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │           Firebase                │
                 │  Auth · Firestore · Functions     │
                 └───────────────────────────────────┘
```

## 2. Estructura de carpetas

```
uber-app/
├── mobile/
│   ├── App.js                 Providers: SafeArea + Auth
│   ├── src/
│   │   ├── config/            Tema, colores, constantes, tarifas, env, registro
│   │   ├── context/           AuthContext (sesión + perfil en tiempo real)
│   │   ├── navigation/        AppNavigator (Stack + Drawer)
│   │   ├── screens/           Una pantalla por flujo
│   │   ├── components/        UI reutilizable (botones, tarjetas, mapas, modales)
│   │   ├── hooks/             Lógica de estado y suscripciones
│   │   ├── services/          Acceso a Firebase, pagos, lugares y rutas (Directions)
│   │   └── utils/             Funciones puras y testeables
│   └── scripts/               Pruebas con Node (sin Jest)
├── firebase/
│   ├── firestore.rules        Seguridad y validaciones del servidor
│   ├── firestore.indexes.json
│   └── functions/             Mercado Pago real (opcional) + seed
└── docs/                      Guías, bitácora y cumplimiento
```

### Regla de dependencias

```
screens → hooks → services → firebase
   ↓         ↓
components  utils (puro, sin React ni Firebase)
```

`utils/` no importa React ni Firebase: así se prueba con Node directamente.

### Navegación

```
Stack (raíz)
├── Login / Register          (sin sesión)
└── Main → Drawer             (con sesión)
    ├── Inicio                (DriverHome o PassengerHome según el rol)
    ├── Mi perfil             (ProfileScreen)
    ├── Historial             (HistoryScreen)
    ├── Ganancias             (solo conductor)
    └── Configuración         (SettingsScreen)
Stack (encima del Drawer)
├── Detalle del viaje        (RideDetailScreen)
├── Editar datos personales  (EditProfileScreen)
├── Editar vehículo          (EditVehicleScreen)
└── Editar documentos        (EditDocumentsScreen)
```

El Drawer usa `@react-navigation/drawer` con un contenido propio
(`components/AppDrawerContent.js`): datos del usuario, accesos y cierre de sesión.
Las pantallas de edición y el detalle viven en el Stack para conservar el botón de
regreso. `index.js` importa `react-native-gesture-handler` y `App.js` envuelve la app
en `GestureHandlerRootView`, requisitos del Drawer y de Reanimated.

## 3. Sesión y perfil

- `context/AuthContext.js` envuelve la app. Al iniciar:
  1. Restaura la sesión de Firebase Auth (persistida en `AsyncStorage`).
  2. Lee `users/{uid}`.
  3. Se suscribe con `onSnapshot` para reflejar cambios de `approvalStatus`,
     `isAvailable` y `driverLocation` sin cerrar sesión.
- `hooks/useAuth.js` expone `{ user, booting, configError, signIn, signUp, signOut }`.
- Si faltan variables de entorno, `AppNavigator` muestra `FirebaseConfigScreen` con las
  claves pendientes en lugar de fallar en blanco.

### Documento `users/{uid}`

| Campo | Tipo | Descripción |
|---|---|---|
| `name`, `email`, `role` | string | Datos base |
| `approvalStatus` | string | `pending` / `approved` / `rejected` (conductores) |
| `isAvailable` | boolean | Disponibilidad del conductor |
| `driverLocation` | `{ latitude, longitude }` | Última posición conocida |
| `locationUpdatedAt`, `availabilityUpdatedAt` | timestamp | Control de escritura |
| `phone`, `documentType`, `documentNumber`, `birthDate` | varios | Datos personales |
| `gender`, `language`, `city`, `address` | string | Preferencias y datos |
| `vehicle` | object | `{ brand, line, year, plate, color, category, capacity }` |
| `documents` | object | Números y vencimientos (las fotos van aparte) |
| `mercadoPagoEmail` | string | Correo de pagos |
| `acceptedTerms`, `termsAcceptedAt` | boolean / timestamp | Términos con comisión visible |

### Subcolección `users/{uid}/documents/{key}`

Fotos de perfil, vehículo, licencia, SOAT y tecnomecánica como **base64 comprimido**
(`expo-image-manipulator`). Se eligió así porque el plan Spark no incluye Cloud Storage.
Cada documento guarda `{ type, base64, mimeType, updatedAt }`.

## 4. Modelo de datos de viajes

Colección `trips` (nombres en inglés, como pide la spec):

| Campo | Tipo | Descripción |
|---|---|---|
| `passengerId`, `driverId` | string | Referencias a usuarios |
| `passengerName`, `driverName`, `driver` | string / object | Copia para mostrar sin joins |
| `participants` | array | `[passengerId]` y luego `[passengerId, driverId]` |
| `origin`, `destination` | `{ latitude, longitude, name, address }` | Puntos del viaje |
| `distanceKm`, `durationMin` | number | Distancia y duración reales (Distance Matrix) o estimación local |
| `routeSource` | string | `google` o `estimate`; indica de dónde salieron la distancia y la duración |
| `category` | string | `economy` / `xl` / `premium` |
| `fare`, `commission`, `tip`, `driverEarnings` | number | COP enteros |
| `commissionRate` | number | `0.20`, congelado por viaje |
| `currency` | string | `COP` |
| `paymentMethod` | string | `cash` / `mercadopago_test` / `mercadopago` / `stripe` |
| `paymentStatus`, `paymentId` | string | Estado y referencia del pago |
| `status` | string | Estado del viaje |
| `rating` | number | 1–5, solo lo escribe el pasajero |
| `rejectedBy` | array | Conductores que rechazaron la solicitud |
| `createdAt`, `completedAt`, `paidAt` | timestamp | Fechas |

La suscripción de solicitudes filtra `status == 'requested'` y descarta los viajes donde el
UID del conductor está en `rejectedBy`. No se usan índices compuestos.

## 5. Máquina de estados del viaje

```
requested ──accept──> accepted ──arriving──> driver_arriving ──start──> in_progress
    │                    │                         │                       │
    │                    │                         │                    complete
    │                    │                         │                       ▼
    │                    │                         │                   completed
    │                    │                         │                       │
    │                    │                         │              pago prueba/efectivo
    │                    │                         │                       ▼
    │                    │                         │                     paid
    └──cancel────────────┴─────────────────────────┘
                    (solo antes de in_progress)
```

- **Rechazar** no cancela: agrega el UID a `rejectedBy` y el viaje sigue `requested` para
  los demás.
- **Vencer** los 15 s ejecuta el mismo rechazo persistente y oculta la tarjeta.
- Al **completar**, el conductor asignado recalcula `fare`, `commission` y `driverEarnings`
  con la misma función pura de la estimación.
- El pago de prueba o el efectivo cierran el viaje en `paid`.

## 6. Cálculo de tarifa

`utils/calculateFare.js` es la **única** fuente de verdad:

```js
calculateFare({ distanceKm, durationMin, category, tip })
// => { fare, commission, driverEarnings, commissionRate, currency }
```

1. `base + km * PER_KM + min * PER_MINUTE`.
2. Se aplica el multiplicador de categoría.
3. Se redondea al múltiplo de 100 **antes** de la comisión.
4. Comisión = 20 % de la tarifa redondeada.
5. Propina = 100 % al conductor.
6. `driverEarnings = fare - commission + tip`.

La estimación del pasajero y el cierre del conductor llaman a la misma función. El
`commissionRate` se guarda en cada viaje para que un cambio futuro no altere el historial.

### Distancia y duración del recorrido

`services/directionsService.js` obtiene `{ distanceKm, durationMin }` antes de llamar a
`calculateFare`:

1. Si `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` está configurada, consulta **Google Distance
   Matrix** (`mode=driving`, unidades métricas, español) con un tiempo máximo de 6 s.
2. Si la llave falta, la API falla, responde sin ruta o se agota el tiempo, usa la
   estimación local: distancia en línea recta (`utils/geo.js`) y
   `estimateDurationMin(km) = ceil(km * 2.5) + 2`.
3. El origen de los datos se guarda en `trips.routeSource` (`google` o `estimate`).

La llave es opcional y se restringe en Google Cloud a las apps Android/iOS y a Distance
Matrix API. No es un secreto de servidor: `EXPO_PUBLIC_*` queda dentro del bundle, por eso
la restricción por firma de la app es obligatoria. El trazo del mapa sigue siendo una
`Polyline` recta; la geometría real requeriría Directions API o Routes API.

## 7. Pagos

Hay dos caminos y el activo no depende de Blaze:

| Camino | Quién confirma | Requisitos |
|---|---|---|
| **Prueba simulado** (`mercadopago_test`) | El pasajero en `TestPaymentModal` | Ninguno |
| **Mercado Pago real** (`mercadopago`) | Webhook de Cloud Functions | Blaze + credenciales |

El camino real está implementado en `firebase/functions/index.js`:

- `createPaymentPreference`: recalcula la tarifa en el servidor y crea el Checkout Pro.
- `mercadoPagoWebhook`: valida firma, consulta el pago y actualiza el viaje.
- `paymentReturn`: página de retorno.

Las reglas de Firestore solo permiten al pasajero escribir `paymentStatus` y `status: paid`
cuando `paymentMethod == 'mercadopago_test'`; el pago real no se puede simular desde el
cliente. Los secretos viven en `firebase/functions/.env` (ignorado por Git).

El **saldo** del conductor se calcula en el teléfono: ganancias de viajes con tarjeta menos
comisión de viajes en efectivo. Puede ser negativo (deuda con la plataforma).

## 8. Tiempo real y hooks

| Hook | Responsabilidad |
|---|---|
| `useAuth` | Sesión y perfil desde el contexto |
| `useDriverLocation` | `watchPosition`, permiso y escritura limitada a Firestore |
| `useDriverAvailability` | Disponible / No disponible; compone `useDriverLocation` |
| `useTripRequests` | Solicitudes `requested`, filtro `rejectedBy`, vencimiento y descarte |
| `useDriverRides` | Viaje activo + acciones (aceptar, rechazar, avanzar, finalizar, cobrar) |
| `usePassengerRide` | Viaje activo del pasajero, cotización, pago y calificación |
| `useEarnings` | Totales por período y saldo con `useMemo` |
| `useRideHistory` | Suscripción al historial del usuario |
| `useProfile` / `useProfilePhoto` | Perfil y foto al abrir la pantalla |
| `useProfileForm` | Estado, validación y guardado de los formularios de edición |
| `useDocumentPhoto` | Carga la foto de un documento para reemplazarla |

Suscripciones principales:

- Solicitudes: `trips where status == 'requested'`.
- Viaje activo: `trips where driverId/passengerId == uid` y estado distinto de cerrado.
- Historial: `trips where participants array-contains uid`.
- Perfil: `users/{uid}`.

Todas las suscripciones devuelven su función de limpieza y se usan dentro de `useEffect`.

## 9. Seguridad (reglas de Firestore)

Resumen de `firebase/firestore.rules`:

- Solo usuarios autenticados leen viajes.
- El pasajero crea el viaje con `passengerId == auth.uid`, `status == 'requested'` y
  `participants == [uid]`.
- Solo los participantes actualizan; un conductor puede tomar un viaje `requested`
  agregándose como `driverId`.
- Rechazar solo modifica `rejectedBy` mientras el viaje sigue `requested`.
- El recorrido y la cotización quedan **congelados** al crear el viaje.
- La tarifa solo se recalcula al pasar de `in_progress` a `completed`, por el conductor
  asignado.
- El pago de prueba solo lo escribe el pasajero y solo para `mercadopago_test`.
- La calificación (1–5) solo la escribe el pasajero, una sola vez, sobre un viaje terminado.
- El conductor no puede cancelar ni cambiar la tarifa después de aceptar.

## 10. Decisiones y compromisos

| Decisión | Motivo |
|---|---|
| Firebase JS SDK (no `@react-native-firebase`) | Funciona en Expo Go sin development build |
| Fotos en base64 en Firestore | El plan Spark no incluye Storage; Cloudinary queda como mejora |
| Ruta dibujada en línea recta con `Polyline` | La geometría real requiere Directions/Routes API; Distance Matrix ya da distancia y duración |
| Distance Matrix opcional con respaldo local | La app funciona sin llave y nunca bloquea la cotización por un fallo de Google |
| Sin índices compuestos | Las consultas usan `array-contains` y filtros en el teléfono |
| Totales calculados en el teléfono | No se guardan agregados en Firestore; menos escrituras y menos datos inconsistentes |
| Idioma guardado en el perfil, UI en español | La spec pide el selector; la traducción completa queda fuera del alcance |
| Rechazo persistente en `rejectedBy` | Evita que la solicitud reaparezca y no afecta a otros conductores |

## 11. Limitaciones conocidas

- **Push (FCM)**: no implementado; requiere development build.
- **Google Directions / geometría de la ruta**: Distance Matrix da distancia y duración, pero el
  mapa dibuja una línea recta.
- **Cloudinary**: no conectado; las fotos van en base64 en Firestore.
- **Pago real**: implementado pero sin desplegar (requiere Blaze).
