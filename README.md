# Uber App — versión conductor

Hice esta app como entrega de la especificación de UberClone. Está construida con React
Native y Expo, y usa Firebase (Authentication y Firestore en tiempo real) como backend. En el
mismo proyecto conviven la vista del pasajero y la del conductor.

El pago con tarjeta quedó en **modo prueba, simulado dentro de la app**. La idea era no
depender de Blaze ni de una pasarela real para poder demostrar el flujo completo. Las Cloud
Functions de Mercado Pago sí están escritas, pero las dejé como camino opcional para cuando
se active el plan Blaze.

Si quieres revisar el detalle de la entrega, dejé estos documentos:

- [Cumplimiento de la especificación](docs/SPEC_COMPLIANCE.md): la matriz punto por punto, con ✅, 🟡 y ❌.
- [Arquitectura](docs/ARCHITECTURE.md): cómo están separadas las capas, el modelo de datos y las decisiones que tomé.
- [Pruebas](docs/TESTING.md): pruebas automáticas y la lista que uso para verificar a mano.
- [Guía de entrega](docs/DELIVERY.md): instalación, comandos y guion de la demo.
- [Bitácora de IA](docs/AI_LOG.md) y [Pagos](docs/PAYMENTS.md).

## Cómo está organizado el repo

```
uber-app/
├── mobile/                 App Expo (React Native)
│   ├── src/config/         Tema, constantes, configuración de Firebase y tarifas
│   ├── src/context/        Sesión del usuario (AuthContext)
│   ├── src/navigation/     Stack del viaje + Drawer de perfil, historial y ajustes
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

La regla que seguí fue simple: las pantallas no hablan con Firebase directamente. Pasan por
hooks, los hooks por servicios y los servicios por el SDK. Lo que es cálculo puro (tarifas,
validaciones, filtros) vive en `utils` y se puede probar sin levantar la app.

## Qué necesitas para correrlo

- Node.js 20 o superior.
- Una cuenta de Firebase. Con el plan Spark alcanza para Auth y Firestore.
- Expo Go en el teléfono, o un emulador.

## 1. Crear el proyecto en Firebase

Dejé una guía con el paso a paso y los errores que me salieron en
[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md). En resumen:

1. Entra a <https://console.firebase.google.com> y crea un proyecto.
2. En **Authentication** habilita el proveedor **Correo electrónico/contraseña**.
3. En **Firestore Database** crea la base de datos en modo producción, región `us-central1`.
4. En **Configuración del proyecto → Tus apps** agrega una app **Web** (`</>`).
5. Copia esos valores al `.env` de la app (siguiente paso).

## 2. Configurar la app

```bash
cd mobile
npm install
```

Copia `mobile/.env.example` a `mobile/.env` y completa las variables:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Opcional: distancia, duración y ruta reales con Google Distance Matrix y Directions
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Si falta alguna variable de Firebase, la app muestra una pantalla con las claves pendientes en
vez de quedarse en blanco. La llave de Google es opcional: sin ella la cotización usa la
estimación local y el mapa dibuja una línea recta.

```bash
npx expo start -c
```

## 3. Reglas de Firestore y usuarios demo

```bash
cd firebase
npm install -g firebase-tools     # una sola vez
firebase login
# edita .firebaserc y reemplaza REPLACE_WITH_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

Para los usuarios demo (`pasajero@demo.com` y `conductor@demo.com`, clave `123456`):

```bash
cd firebase/functions
npm install
# Descarga la clave del service account desde Configuración del proyecto -> Cuentas de servicio
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\serviceAccount.json"
$env:FIREBASE_PROJECT_ID="tu-proyecto"
npm run seed
```

El conductor demo queda **Aprobado**. Los que se registran desde la app quedan **Pendientes**;
para aprobarlos cambio `approvalStatus` a `approved` en la consola de Firestore, colección
`users`.

## 4. Pagos

### Modo prueba (el que está activo)

El pago con tarjeta está simulado dentro de la app. No necesita Blaze, ni Cloud Functions, ni
cuenta de pasarela. Cuando el viaje termina, el pasajero abre un checkout de prueba con una
tarjeta ficticia (`4242 4242 4242 4242`) y escoge qué pasa:

- **Aprobar**: el viaje pasa a `paid` con `paymentStatus: approved`.
- **Rechazar**: el viaje queda en `completed` con `paymentStatus: rejected` y se puede reintentar.

Esos campos solo se pueden escribir en viajes con `paymentMethod: mercadopago_test`, y las
reglas de Firestore lo limitan. El pago real desde el cliente sigue bloqueado. Lo explico con
más detalle en [docs/PAYMENTS.md](docs/PAYMENTS.md).

### Mercado Pago real (opcional, requiere Blaze)

El camino con **Checkout Pro** ya está implementado en `firebase/functions`. Lo dejé listo pero
sin desplegar. Para activarlo hacen falta el plan **Blaze** y credenciales de prueba de Mercado
Pago:

```bash
cd firebase/functions
npm install
copy .env.example .env    # completa MERCADO_PAGO_ACCESS_TOKEN de PRUEBA
cd ..
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Las funciones que escribí son:

- `createPaymentPreference`: recalcula la tarifa en el servidor, valida que el viaje sea del pasajero y crea la preferencia de Checkout Pro. Devuelve `initPoint` para abrirlo con `expo-web-browser`.
- `mercadoPagoWebhook`: valida la firma HMAC, consulta el pago contra la API, revisa que el monto coincida con la tarifa más la propina y actualiza `paymentStatus`, `paymentId` y `status: paid`.
- `paymentReturn`: la página que ve el usuario al volver del checkout.
- `health`: una verificación rápida de que el despliegue quedó bien.

El access token vive solo en `firebase/functions/.env`, que está por fuera de Git. La app nunca
lo ve. Todo se probó con credenciales de prueba.

## 5. Tarifas y comisión

Los parámetros están en `mobile/src/config/pricing.js` y el cálculo en una sola función pura,
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

Uso la misma función para la estimación del pasajero y para cerrar el viaje, así no hay dos
tarifas distintas. Cada viaje guarda el `commissionRate` con el que se calculó, y la propina va
completa al conductor. Para probar solo el motor (incluye el ejemplo de la especificación):

```bash
cd mobile
npm run test:pricing
```

## 6. Cómo funciona el flujo

Empiezo por el registro. El conductor se registra en tres pestañas (Datos personales, Vehículo,
Documentos) y cada campo se valida al salir: nombre y apellido de máximo 50 caracteres, correo,
contraseña, documento, edad entre 18 y 80, celular, género, idioma, dirección, placa, año del
vehículo entre 1990 y el actual, capacidad (XL pide mínimo 6) y correo de Mercado Pago. La
fecha de nacimiento y los vencimientos se pueden elegir con el calendario nativo o escribir a
mano en `DD/MM/AAAA`. La **tecnomecánica solo se pide a vehículos de 6 años o más**; en los más
nuevos el campo ni aparece. Las fotos se comprimen y se guardan en `users/{uid}/documents`, y la
de perfil se muestra en el perfil.

El conductor nuevo queda **Pendiente** y no puede ponerse disponible hasta que un administrador
cambie `approvalStatus` a `approved` en Firestore. Eso lo hice así para que la aprobación se
refleje en vivo, sin cerrar sesión.

Del lado del pasajero: busca el destino, ve la estimación, elige **Efectivo** o **Tarjeta
(prueba)** y solicita. La distancia y la duración las pido a **Google Distance Matrix** si hay
llave; si no, las estimo localmente y guardo en `trips.routeSource` si vinieron de `google` o de
`estimate`. En el detalle, la ruta se dibuja con **Google Directions** usando la misma llave, y
si algo falla cae a una línea recta.

El conductor ve las solicitudes en tiempo real con `onSnapshot`, junto con la duración y el
método de pago, y puede aceptar o rechazar. Rechazar solo esconde el viaje para él
(`trips.rejectedBy`); el viaje sigue disponible para los demás. Cada solicitud tiene una
**cuenta regresiva de 15 segundos** con barra de progreso y, al llegar a cero, desaparece. Al
aceptar, el viaje guarda una copia del conductor y su vehículo, y el pasajero ve nombre,
marca/línea, color, tipo y placa.

Los estados son `requested → accepted → driver_arriving → in_progress → completed → paid`, o
`cancelled`. El conductor marca *Voy en camino*, *Pasajero a bordo* y finaliza. Con efectivo
confirma el cobro; con tarjeta espera a que el pasajero apruebe el checkout de prueba. Mientras
tanto le muestro *Esperando el pago de prueba del pasajero…*. No se mueve dinero real.

Cuando se aprueba el pago se abre el modal de calificación de 1 a 5 estrellas. También se puede
calificar después desde **Historial → Detalle del viaje**. La calificación va a `trips.rating`,
solo la escribe el pasajero y una sola vez; el promedio se ve en el perfil del conductor.

El perfil tiene estadísticas calculadas sobre los viajes y un **Drawer** con inicio, perfil,
historial, ganancias y configuración. Todo el perfil es editable: datos personales, foto,
vehículo, documentos, correo de Mercado Pago e idioma. Los cambios se guardan en `users/{uid}` y
se ven al instante, sin volver a iniciar sesión.

En **Ganancias** el conductor ve los totales de Hoy, Semana y Mes con ganancia neta, tarifas
cobradas, comisión, propinas y promedio por viaje. También el **saldo con la plataforma**: sumo
lo ganado con pagos con tarjeta y resto la comisión de los viajes en efectivo, así que puede
quedar negativo. Ese saldo se calcula en el teléfono a partir de los viajes pagados; no guardo
totales en Firestore.

El **Historial** muestra todos los viajes del usuario en tiempo real, con filtros por estado,
rol, fecha (incluido un rango `DD/MM/AAAA`) y método de pago. Pagina de 10 en 10 con “Ver más”.
El detalle trae el mapa con la ruta, distancia, duración, categoría, tarifa, comisión, propina,
ganancia, estado del pago y datos del vehículo.

Para correr todas las pruebas (tarifas, validaciones, cuenta regresiva, ganancias, historial,
pagos, calificación y rutas; 81 en total):

```bash
cd mobile
npm test
```

## 7. Qué falta o quedó a medias

La matriz completa está en [docs/SPEC_COMPLIANCE.md](docs/SPEC_COMPLIANCE.md). En corto:

- **Terminado:** registro con validaciones (tecnomecánica condicional y calendario nativo),
  disponibilidad y GPS, solicitudes con 15 s y rechazo persistente, máquina de estados,
  tarifa/comisión/propina, distancia y duración con Distance Matrix y ruta con Directions
  (opcionales, con respaldo local), pago de prueba y efectivo, calificación, ganancias,
  historial con filtros, detalle con mapa, perfil editable con Drawer y reglas de seguridad.
- **A medias:** no hay navegación giro a giro, las fotos van en base64 porque el plan Spark no
  incluye Storage, y el pago real está implementado pero sin desplegar.
- **Pendiente:** notificaciones push (FCM pide development build), la bitácora en PDF y el video
  de 5 minutos.

## 8. Uso de IA

Usé un asistente de IA como apoyo para escribir y revisar partes del código, la documentación y
las pruebas. No lo escondo: todo quedó registrado en [docs/AI_LOG.md](docs/AI_LOG.md), con el
prompt, lo que acepté, lo que descarté y cómo lo verifiqué.

En el código, los bloques que salieron de esas sesiones están marcados con
`// AI-assisted: see docs/AI_LOG.md #N`, donde `N` es la entrada de la bitácora. Las decisiones
de producto y la verificación final son mías; la IA fue una herramienta, no quien entregó el
proyecto.
