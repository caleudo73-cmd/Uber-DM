# Uber App — versión conductor

Aplicación móvil multiplataforma (React Native + Expo) inspirada en Uber. El repositorio
incluye la app del pasajero y la app del conductor, con backend en Firebase
(Authentication + Firestore en tiempo real). El pago con tarjeta funciona en **modo prueba
simulado dentro de la app**; las Cloud Functions de Mercado Pago quedan como camino opcional
para cuando se active el plan Blaze.

Documentación de entrega:

- [Cumplimiento de la especificación](docs/SPEC_COMPLIANCE.md) — matriz ✅ / 🟡 / ❌ punto por punto.
- [Arquitectura](docs/ARCHITECTURE.md) — capas, modelo de datos, estados, hooks y decisiones.
- [Pruebas](docs/TESTING.md) — pruebas automáticas, reglas y lista de verificación manual.
- [Guía de entrega](docs/DELIVERY.md) — instalación, comandos, guion de demo y pendientes.
- [Bitácora de IA](docs/AI_LOG.md) y [Pagos](docs/PAYMENTS.md).

## Estructura

```
uber-app/
├── mobile/                 App Expo (React Native)
│   ├── src/config/         Tema, constantes, configuración de Firebase y tarifas
│   ├── src/context/        Sesión del usuario (AuthContext)
│   ├── src/services/       Acceso a Firebase Auth / Firestore / lugares / pagos
│   ├── src/hooks/          Hooks de viaje, ubicación, ganancias, perfil y formularios
│   ├── src/screens/        Pantallas
│   ├── src/components/     Componentes reutilizables
│   ├── src/utils/          Funciones puras (tarifas, validaciones, filtros, pagos)
│   └── scripts/            Pruebas con Node
├── firebase/
│   ├── firestore.rules     Reglas de seguridad
│   ├── firestore.indexes.json
│   └── functions/          Cloud Functions (Mercado Pago) y script de seed
└── docs/                   Guías, bitácora, arquitectura y cumplimiento
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

## 4. Pagos

### Modo prueba (activo, sin costo)

El pago con tarjeta está **simulado dentro de la app** y no requiere Blaze, Cloud Functions
ni una cuenta de pasarela. Al finalizar el viaje, el pasajero abre un checkout de prueba con
una tarjeta ficticia (`4242 4242 4242 4242`) y elige el resultado:

- **Aprobar**: el viaje pasa a `paid` con `paymentStatus: approved`.
- **Rechazar**: el viaje sigue `completed` con `paymentStatus: rejected` y se puede reintentar.

La app escribe esos campos solo para viajes con `paymentMethod: mercadopago_test`; las
reglas de Firestore lo limitan y siguen bloqueando el pago real desde el cliente. El detalle
está en [docs/PAYMENTS.md](docs/PAYMENTS.md).

### Mercado Pago real (opcional, requiere Blaze)

El camino con **Checkout Pro** ya está implementado en `firebase/functions` y se activa
cuando quieras cobrar de verdad. Requiere el plan **Blaze** y credenciales de prueba de
Mercado Pago. La guía paso a paso (credenciales, webhook, pruebas) está en
[docs/PAYMENTS.md](docs/PAYMENTS.md).

```bash
cd firebase/functions
npm install
copy .env.example .env    # completa MERCADO_PAGO_ACCESS_TOKEN de PRUEBA
cd ..
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Las funciones son:

- `createPaymentPreference`: recalcula la tarifa en el servidor, valida que el viaje sea del
  pasajero y crea la preferencia de Checkout Pro. Devuelve `initPoint` (el checkout de
  sandbox en modo prueba) para abrirlo con `expo-web-browser`.
- `mercadoPagoWebhook`: valida la firma HMAC, consulta el pago contra la API, comprueba que
  el monto coincida con la tarifa + propina y actualiza `paymentStatus`, `paymentId` y
  `status: paid`.
- `paymentReturn`: página que ve el usuario al volver del checkout.
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
- **Registro de conductor en tres pestañas** (Datos personales, Vehículo, Documentos) con
  validaciones por campo: nombre y apellido (máximo 50 caracteres), correo, contraseña,
  documento, edad entre 18 y 80 años, celular, género, idioma, dirección, placa, año del
  vehículo (entre 1990 y el año actual), capacidad de pasajeros (XL exige mínimo 6),
  correo de Mercado Pago, aceptación de términos con el 20 % de comisión y vigencia de
  licencia, SOAT y tecnomecánica. Las fotos de perfil, vehículo y documentos se comprimen
  y se guardan en `users/{uid}/documents`; la foto de perfil se muestra en el perfil.
- El conductor queda en estado **Pendiente** hasta que un administrador cambie
  `approvalStatus` a `approved` en Firestore.
- El pasajero busca un destino, ve la estimación, elige **Efectivo** o **Tarjeta (prueba)** y
  solicita el viaje.
- El conductor ve las solicitudes en tiempo real (`onSnapshot`), con la duración estimada y el
  método de pago, y puede **aceptar o rechazar**. Rechazar solo oculta el viaje para ese
  conductor (`trips.rejectedBy`) y el viaje sigue disponible para los demás. Luego marca
  *Voy en camino*, *Pasajero a bordo* y finaliza. Con efectivo confirma el cobro; con
  tarjeta espera a que el pasajero complete el checkout de prueba.
- **Disponible / No disponible**: el conductor activa el interruptor y la app empieza a
  seguir su ubicación (`expo-location`) y a escuchar solicitudes; el estado se guarda en
  `users/{uid}.isAvailable`.
- Cada solicitud entrante tiene una **cuenta regresiva de 15 segundos** con barra de
  progreso; al llegar a cero desaparece de la pantalla.
- Al aceptar, el viaje guarda una copia del conductor y su vehículo, y el pasajero ve
  **nombre, marca/línea, color, tipo de vehículo y placa**.
- Estados del viaje: `requested → accepted → driver_arriving → in_progress →
  completed → paid` (o `cancelled`).
- **Pago con tarjeta (prueba)**: al finalizar, el pasajero toca *Pagar con tarjeta (prueba)*,
  se abre un checkout simulado y el viaje pasa a `paid` al aprobar. El conductor ve
  *Esperando el pago de prueba del pasajero…* mientras tanto. No se cobra dinero real.
- **Calificación**: al aprobar el pago se abre un modal para calificar al conductor con 1 a 5
  estrellas. También se puede calificar después desde **Historial → Detalle del viaje**. La
  calificación se guarda en `trips.rating`, solo la puede escribir el pasajero y una sola vez;
  el promedio aparece en el perfil del conductor.
- Perfil con estadísticas calculadas sobre los viajes.
- **Ganancias** (conductor): totales de Hoy / Semana / Mes con ganancia neta, tarifas
  cobradas, comisión de la plataforma, propinas y **promedio por viaje**. También muestra el
  **saldo con la plataforma**: suma lo ganado con pagos con tarjeta y resta la comisión de
  los viajes cobrados en efectivo (puede quedar negativo). Se calcula en el teléfono a
  partir de los viajes pagados; no se guarda ningún total en Firestore.
- **Historial**: todos los viajes del usuario en tiempo real, con filtros por estado
  (todos / completados / cancelados), rol (pasajero / conductor), fecha (todo / hoy / semana /
  mes / rango de fechas `DD/MM/AAAA`) y método de pago, paginación "Ver más" de 10 en 10 y
  detalle completo de cada viaje.
- **Detalle del viaje**: mapa con la ruta aproximada en línea recta, recorrido, distancia,
  duración, categoría, tarifa, comisión, propina, ganancia del conductor, método y estado del
  pago, y datos del vehículo.

Pruebas (tarifas, validaciones, cuenta regresiva, ganancias, historial, pagos y calificación;
62 en total):

```bash
cd mobile
npm test
```

## 7. Estado frente a la especificación

La matriz completa está en [docs/SPEC_COMPLIANCE.md](docs/SPEC_COMPLIANCE.md). Resumen:

- **Completo:** registro con validaciones, disponibilidad y GPS, solicitudes con 15 s y
  rechazo persistente, máquina de estados, tarifa/comisión/propina, pago de prueba y efectivo,
  calificación, ganancias, historial con filtros, detalle con mapa, reglas de seguridad.
- **Parcial:** perfil de solo lectura (sin edición), navegación sin Drawer, ruta en línea
  recta (sin Google Directions), fotos en base64 (sin Cloudinary), tecnomecánica siempre
  obligatoria, pago real implementado pero sin desplegar.
- **Pendiente:** notificaciones push (FCM), bitácora en PDF, video de 5 minutos y PR/merge a
  `main`.

## 8. Uso de IA

La bitácora completa está en [docs/AI_LOG.md](docs/AI_LOG.md). Cada bloque asistido está
marcado en el código con `// AI-assisted: see docs/AI_LOG.md #N`.
