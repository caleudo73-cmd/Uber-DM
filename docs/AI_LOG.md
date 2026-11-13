# Bitácora de uso de IA

Registro de las herramientas de inteligencia artificial usadas en el proyecto. Cada
integrante agrega sus entradas en su propia rama y las integra a `main` mediante Pull
Request.

Reglas:

- Registrar la entrada en el momento de usar la herramienta.
- Copiar el prompt tal como se escribió.
- Nunca pegar llaves de API, tokens ni datos personales reales.
- Marcar en el código los bloques asistidos: `// AI-assisted: see docs/AI_LOG.md #N`.

## Plantilla

```md
### Entrada #N - Fecha: AAAA-MM-DD - Integrante: Nombre Apellido - Herramienta: ...

- **Objetivo:**
- **Prompt:** (texto completo)
- **Resumen de la respuesta:**
- **Qué se usó / modificó / descartó:**
- **Archivos y commit:**
- **Verificación:**
- **Aprendizaje:**
```

---

### Entrada #1 - Fecha: 2026-11-11 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Implementar el motor de tarifas con comisión configurable y migrar el
  backend Express en memoria a Firebase (Auth + Firestore + Cloud Functions).
- **Prompt:** Se adjuntó el documento «UberClone — Versión Conductor» (especificación
  completa del proyecto) y luego el mensaje: «ya tengo un proyecto iniciado
  C:\Users\genie\Desktop\uber-app». Al elegir el alcance se respondió: «Motor de tarifas y
  comisión (Recomendado)» y «migrar a fire base y hacer un commit ya migrado».
- **Resumen de la respuesta:** Se creó `calculateFare` como función pura compartida
  (móvil + Cloud Functions) con redondeo a 100 COP, comisión del 20 % y propina completa
  para el conductor. Se reemplazó el backend Express por Firebase: Auth con persistencia
  en AsyncStorage, Firestore con `onSnapshot` para viajes en tiempo real, reglas de
  seguridad, Cloud Functions de Mercado Pago y script de seed.
- **Qué se usó / modificó / descartó:** Se usó el diseño de datos y las fórmulas de la
  especificación. Se descartó el backend Express (`backend/`) y el almacenamiento de
  tokens JWT en SecureStore, porque Firebase Auth administra la sesión. Se mantuvo el
  buscador de lugares con Photon (OpenStreetMap) y el respaldo de Medellín.
- **Archivos y commit:** `mobile/src/config/pricing.js`, `mobile/src/utils/calculateFare.js`,
  `mobile/src/utils/geo.js`, `mobile/src/services/firebase.js`,
  `mobile/src/services/authService.js`, `mobile/src/services/rideService.js`,
  `mobile/src/services/placesService.js`, `mobile/src/context/AuthContext.js`,
  `firebase/` — commit: `cfa4feb`.
- **Verificación:** `cd mobile && npm run test:pricing` → 8/8 pruebas correctas, incluido
  el ejemplo de 8,5 km / 22 min (Económico 19.200 / XL 26.900). Bundle de Expo generado
  sin errores.
- **Aprendizaje:** (completar) Qué entendí del motor de tarifas y qué haría distinto.

> Borrador generado durante la sesión de trabajo. El integrante debe revisarlo, completar
> los campos y confirmar que la descripción corresponde a lo que realmente se hizo.

---

### Entrada #2 - Fecha: 2026-11-11 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Implementar el registro del conductor en tres pestañas (Datos personales,
  Vehículo, Documentos) con validaciones por campo, fotos de los documentos y estado
  Pendiente de aprobación.
- **Prompt:** Tras la migración se preguntó qué construir y se eligió: «Registro del
  conductor en 3 pestañas (Recomendado)».
- **Resumen de la respuesta:** Se creó un formulario de tres pasos con pestañas numeradas,
  validaciones puras en `src/utils/validators.js` (nombre y apellido, correo, contraseña,
  documento, edad 18–80, celular colombiano, placa de carro o moto, año del vehículo y
  vigencia de licencia, SOAT y tecnomecánica), un selector de fotos que comprime las
  imágenes y las guarda en la subcolección `users/{uid}/documents`, y una pantalla de
  «Solicitud enviada» con el resumen del registro y opción de cerrar sesión.
- **Qué se usó / modificó / descartó:** Se usó el modelo de datos y las validaciones de la
  especificación. Se descartó subir fotos a Firebase Storage porque el plan Spark no lo
  incluye; se guardan comprimidas en Firestore (máx. ~240 KB cada una) con una regla que
  limita el tamaño. También se corrigió un import roto de `DEFAULT_CATEGORY` que guardaba
  los viajes sin categoría.
- **Archivos y commit:** `mobile/src/utils/validators.js`,
  `mobile/src/config/driverRegistration.js`, `mobile/src/hooks/useDriverRegisterForm.js`,
  `mobile/src/components/DriverRegisterForm.js`, `mobile/src/components/TabBar.js`,
  `mobile/src/components/PhotoPicker.js`, `mobile/src/components/Input.js`,
  `mobile/src/screens/RegisterScreen.js`, `mobile/src/screens/DriverHomeScreen.js`,
  `mobile/src/services/authService.js`, `firebase/firestore.rules`,
  `mobile/scripts/validators.test.mjs` — commit: `60b83fb`.
- **Verificación:** `cd mobile && npm test` → 8/8 pruebas de tarifas y 12/12 de validaciones.
  Bundle de Android sin errores (1067 módulos). Prueba real contra Firestore con las reglas
  desplegadas: perfil de conductor creado, foto de 200 KB aceptada, foto de 450 KB
  rechazada, cambio de rol bloqueado y lectura de la foto correcta; el usuario de prueba se
  eliminó al final.
- **Aprendizaje:** (completar) Qué entendí del registro por pasos y qué haría distinto.

> Ajuste posterior (commit `62be170`): se agregó `subscribeToProfile` para escuchar
> `users/{uid}` con `onSnapshot` y que la aprobación del administrador se refleje en la app
> sin cerrar sesión.

---

### Entrada #3 - Fecha: 2026-11-11 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Implementar el interruptor Disponible / No disponible con seguimiento de
  ubicación, la cuenta regresiva de 15 segundos de cada solicitud y mostrarle al pasajero
  el nombre, vehículo, tipo de vehículo y placa del conductor.
- **Prompt:** «sigue con el siguiente paso, y no te olvides que al usuario también le tiene
  que salir nombre, vehículo, tipo de vehículo, y placas».
- **Resumen de la respuesta:** Se agregó el hook `useDriverAvailability`, que guarda
  `isAvailable` y `driverLocation` en el perfil y sigue la ubicación con `expo-location`
  (escrituras limitadas a una cada 10 s o cada 25 m). El conductor solo escucha solicitudes
  cuando está disponible y libre. Cada tarjeta usa la utilidad pura `utils/countdown.js`
  para la cuenta regresiva de 15 s con barra de progreso y se descarta al expirar. Al
  aceptar, `acceptRide` copia al viaje el nombre y el vehículo del conductor, y
  `ActiveRidePanel` los muestra al pasajero.
- **Qué se usó / modificó / descartó:** Se usó el GPS del teléfono en primer plano (sin
  tareas en segundo plano, para no gastar batería ni complicar la entrega). Se descartó
  filtrar solicitudes por categoría para no necesitar un índice compuesto en Firestore;
  la categoría se muestra en la tarjeta.
- **Archivos y commit:** `mobile/src/utils/countdown.js`,
  `mobile/src/hooks/useDriverAvailability.js`, `mobile/src/hooks/useDriverRides.js`,
  `mobile/src/services/userService.js`, `mobile/src/services/rideService.js`,
  `mobile/src/components/AvailabilityToggle.js`, `mobile/src/components/RideRequestCard.js`,
  `mobile/src/components/ActiveRidePanel.js`, `mobile/src/screens/DriverHomeScreen.js`,
  `mobile/scripts/countdown.test.mjs` — commit: `d8f8186`.
- **Verificación:** `cd mobile && npm test` → 8/8 tarifas, 12/12 validaciones y 6/6 de la
  cuenta regresiva. Bundle de Android sin errores (1071 módulos).
- **Aprendizaje:** (completar) Qué entendí del estado de disponibilidad y qué haría distinto.

---

### Entrada #4 - Fecha: 2026-11-11 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Implementar la pantalla de ganancias del conductor y el historial de viajes
  con filtros y detalle, según la especificación.
- **Prompt:** «sigue con ganancias e historial».
- **Resumen de la respuesta:** Se agregó `utils/earnings.js` con funciones puras para
  calcular los totales de Hoy, Semana (desde el lunes) y Mes (desde el día 1), sumando solo
  viajes `completed`/`paid`: bruto, comisión, propinas y neto. `utils/history.js` concentra
  los filtros por estado y por rol. La pantalla **Ganancias** muestra la ganancia neta en un
  bloque destacado, dos tarjetas (bruto y comisión tomada de `PRICING`) y un desglose
  completo. **Historial** escucha `subscribeRideHistory` (`participants array-contains`),
  ordena en el cliente, filtra con chips, pagina de 10 en 10 y abre el detalle del viaje.
- **Qué se usó / modificó / descartó:** Se calcularon los totales en el teléfono en lugar de
  guardarlos en Firestore para no duplicar la fuente de verdad ni necesitar Cloud Functions.
  Se descartó `orderBy` en la consulta porque exigiría un índice compuesto; el orden se hace
  con `sortByDateDesc`.
- **Archivos y commit:** `mobile/src/utils/earnings.js`, `mobile/src/utils/history.js`,
  `mobile/src/hooks/useRideHistory.js`, `mobile/src/screens/EarningsScreen.js`,
  `mobile/src/screens/HistoryScreen.js`, `mobile/src/screens/RideDetailScreen.js`,
  `mobile/src/components/ChipRow.js`, `mobile/src/utils/format.js`,
  `mobile/src/services/rideService.js`, `mobile/src/navigation/AppNavigator.js`,
  `mobile/src/screens/ProfileScreen.js`, `mobile/scripts/earnings.test.mjs` — commit: `2c39ec7`.
- **Verificación:** `cd mobile && npm test` → 8/8 tarifas, 12/12 validaciones, 6/6 cuenta
  regresiva y 9/9 ganancias/historial. Bundle de Android sin errores (1078 módulos).
- **Aprendizaje:** (completar) Qué entendí de separar los cálculos puros de las pantallas y
  qué haría distinto.

---

### Entrada #5 - Fecha: 2026-11-11 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Implementar el pago con tarjeta en modo prueba con Mercado Pago, cerrando el
  ciclo `completed → paid` sin efectivo.
- **Prompt:** «La A» (elegí la opción A: Cloud Functions + checkout en el navegador).
- **Resumen de la respuesta:** Se completaron las Cloud Functions de pago: la preferencia de
  Checkout Pro se crea en el servidor, que recalcula la tarifa y valida que el viaje sea del
  pasajero. El webhook valida la firma HMAC (`x-signature`), consulta el pago real contra la
  API, comprueba que el monto coincida con tarifa + propina y marca el viaje como `paid`.
  En modo prueba se abre `sandbox_init_point`. En la app se agregó el selector
  **Efectivo / Mercado Pago** al confirmar el viaje, el botón *Pagar con Mercado Pago* al
  finalizar (abre el checkout con `expo-web-browser`) y el estado *Esperando el pago…* en la
  pantalla del conductor.
- **Qué se usó / modificó / descartó:** Se reutilizó la base de funciones del commit
  `cfa4feb` y se amplió. Se descartaron los SDK nativos de Mercado Pago y Stripe porque no
  funcionan en Expo Go; en su lugar se usa Checkout Pro en el navegador. Se descartó guardar
  el pago desde la app: las reglas de Firestore bloquean `paymentStatus`, `paymentId`,
  `paidAt` y `paymentPreferenceId` en viajes con tarjeta, y solo el webhook (Admin SDK) los
  escribe.
- **Archivos y commit:** `firebase/functions/index.js`, `firebase/functions/.env.example`,
  `firebase/firestore.rules`, `mobile/src/services/paymentService.js`,
  `mobile/src/utils/payments.js`, `mobile/src/hooks/usePassengerRide.js`,
  `mobile/src/components/ConfirmPanel.js`, `mobile/src/components/ActiveRidePanel.js`,
  `mobile/src/screens/PassengerHomeScreen.js`, `mobile/src/screens/DriverHomeScreen.js`,
  `mobile/scripts/payments.test.mjs`, `docs/PAYMENTS.md`, `README.md` — commit: `27a56b3`.
- **Verificación:** `cd mobile && npm test` → 8/8 tarifas, 12/12 validaciones, 6/6 cuenta
  regresiva, 9/9 ganancias/historial y 5/5 pagos. Bundle de Android sin errores (1085
  módulos). Reglas de Firestore desplegadas. El despliegue de Functions quedó pendiente de
  activar el plan Blaze.
- **Aprendizaje:** (completar) Qué entendí de no confiar en el monto que envía la app y qué
  haría distinto.

---

### Entrada #6 - Fecha: 2026-11-11 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Cerrar el ciclo `completed → paid` sin activar el plan Blaze ni contratar una
  pasarela, para que la app se pueda demostrar completa.
- **Prompt:** «no pagare cual es la otra opcion?» (no se activará Blaze).
- **Resumen de la respuesta:** Se implementó la opción B: un checkout de prueba simulado
  dentro de la app. Al finalizar el viaje, el pasajero ve una tarjeta ficticia
  (`4242 4242 4242 4242`) y elige **Aprobar pago de prueba** o **Simular rechazo**. Aprobar
  marca el viaje como `paid` con `paymentStatus: approved`, `paymentAmount` (tarifa +
  propina) y `paymentId: test_<id>`; rechazar deja el viaje en `completed` para reintentar.
  El viaje usa el método `mercadopago_test`, así que las reglas de Firestore solo permiten
  al pasajero dueño escribir los campos de pago en esos dos resultados. El camino real de
  Mercado Pago (Cloud Functions + webhook) queda intacto y documentado como opcional.
- **Qué se usó / modificó / descartó:** Se reutilizó `buildTestPaymentUpdate` como función
  pura para que las pruebas y las reglas validen exactamente los mismos campos. Se descartó
  pedir datos de tarjeta reales (el checkout es una simulación y debe verse como tal). Se
  descartó activar Blaze y desplegar las Functions: el usuario no quiere poner tarjeta. Se
  mantuvo `expo-web-browser` y `startMercadoPagoCheckout` para el día en que se active el
  pago real.
- **Archivos y commit:** `mobile/src/config/constants.js`, `mobile/src/utils/payments.js`,
  `mobile/src/services/paymentService.js`, `mobile/src/hooks/usePassengerRide.js`,
  `mobile/src/components/TestPaymentModal.js` (nuevo),
  `mobile/src/components/ActiveRidePanel.js`, `mobile/src/screens/PassengerHomeScreen.js`,
  `mobile/src/screens/DriverHomeScreen.js`, `mobile/scripts/payments.test.mjs`,
  `firebase/firestore.rules`, `docs/PAYMENTS.md`, `README.md` — commit: `f63eddd`.
- **Verificación:** `cd mobile && npm test` → 8/8 tarifas, 12/12 validaciones, 6/6 cuenta
  regresiva, 9/9 ganancias/historial y 11/11 pagos (46 en total). Bundle de Android sin
  errores (1086 módulos). Reglas de Firestore desplegadas sin necesidad de Blaze.
- **Aprendizaje:** (completar) Qué entendí de separar el "modo prueba" del pago real y qué
  haría distinto.

---

### Entrada #7 - Fecha: 2026-11-11 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Implementar la calificación del pasajero al conductor (1 a 5 estrellas) y
  mostrar el promedio en el perfil del conductor.
- **Prompt:** «sigue con la calificacion».
- **Resumen de la respuesta:** Se agregó `utils/ratings.js` con las reglas puras
  (`canRateRide`, `canShowRating`, `isValidRating`, etiquetas por puntaje). El servicio
  `rateRide` valida dentro de una transacción que quien califica sea el pasajero, que el
  viaje esté `completed`/`paid` y que no tenga calificación previa. Al aprobar el pago de
  prueba se abre el modal **Califica tu viaje** con estrellas interactivas; también se puede
  calificar después desde **Historial → Detalle del viaje**. El promedio del perfil ahora
  cuenta solo los viajes donde el usuario fue `driverId`. Se corrigió además un bug: el viaje
  `completed` desaparecía de la pantalla principal porque la suscripción solo miraba los
  estados activos, así que ni el pago ni la calificación llegaban a mostrarse.
- **Qué se usó / modificó / descartó:** Se usó la colección `trips.rating` (ya prevista en el
  modelo de datos) en lugar de una subcolección de reseñas, para no duplicar la fuente de
  verdad. Se descartó que el conductor califique al pasajero en esta entrega (la
  especificación pide la calificación del pasajero al conductor) y se descartó guardar el
  promedio en el perfil: se calcula en el teléfono a partir de los viajes, igual que las
  ganancias. La suscripción de viaje actual ahora incluye `completed` y ordena por
  `createdAt` descendente para mostrar el más reciente.
- **Archivos y commit:** `mobile/src/utils/ratings.js` (nuevo),
  `mobile/src/components/RatingInput.js` (nuevo),
  `mobile/src/components/RatingModal.js` (nuevo),
  `mobile/src/services/rideService.js`, `mobile/src/services/userService.js`,
  `mobile/src/hooks/usePassengerRide.js`, `mobile/src/screens/PassengerHomeScreen.js`,
  `mobile/src/screens/RideDetailScreen.js`, `mobile/src/config/constants.js`,
  `mobile/scripts/ratings.test.mjs` (nuevo), `firebase/firestore.rules`, `README.md` —
  commit: `8438a44`.
- **Verificación:** `cd mobile && npm test` → 8/8 tarifas, 12/12 validaciones, 6/6 cuenta
  regresiva, 9/9 ganancias/historial, 11/11 pagos y 6/6 calificación (52 en total). Bundle
  de Android sin errores (1089 módulos). Reglas de Firestore desplegadas y verificadas contra
  Firestore real 5/5: no se califica un viaje en curso, el conductor no puede calificar, se
  rechaza un valor mayor a 5 y el pasajero sí califica un viaje terminado.
- **Aprendizaje:** (completar) Qué entendí de validar la calificación también en las reglas
  del servidor y qué haría distinto.

---

### Entrada #8 - Fecha: 2026-11-12 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Completar el registro del conductor con los campos que exige la
  especificación: foto de perfil, género, idioma, capacidad de pasajeros, foto del vehículo,
  correo de Mercado Pago y aceptación de términos con la comisión visible.
- **Prompt:** «listo, que falta del documento?» y luego «Completar el registro».
- **Resumen de la respuesta:** Se agregó al paso de datos personales la **foto de perfil**
  (obligatoria), un selector de **género** y otro de **idioma** (español / inglés). En el paso
  del vehículo se agregó la **capacidad de pasajeros** (entero; la categoría XL exige mínimo
  6) y la **foto del vehículo** donde se vea la placa. En documentos se agregó el **correo de
  Mercado Pago** con validación de formato y un **checkbox de términos** que muestra el 20 %
  de comisión. El nombre ahora se limita a 50 caracteres y el año del vehículo ya no acepta el
  año siguiente. Las fotos se siguen comprimiendo y guardando en `users/{uid}/documents`; la
  foto de perfil se lee desde ahí y se muestra en la pantalla de perfil.
- **Qué se usó / modificó / descartó:** Se reutilizó el componente `PhotoPicker` para las
  cuatro fotos nuevas (perfil, vehículo, licencia, SOAT y tecnomecánica) y el selector
  `Choice` para género, idioma y categoría. Se descartó agregar una dependencia de selector
  nativo: los chips existentes ya cumplen la función de lista desplegable y funcionan igual en
  iOS y Android. Se descartó guardar la foto de perfil en el documento principal para no
  cargar la imagen en cada lectura del perfil; va en la subcolección `documents`. Las reglas
  de Firestore ahora exigen el registro completo del conductor (términos, idioma, género,
  correo y capacidad) y rechazan XL con menos de 6 pasajeros.
- **Archivos y commit:** `mobile/src/utils/validators.js`,
  `mobile/src/config/driverRegistration.js`, `mobile/src/hooks/useDriverRegisterForm.js`,
  `mobile/src/components/DriverRegisterForm.js`, `mobile/src/services/authService.js`,
  `mobile/src/hooks/useProfilePhoto.js` (nuevo), `mobile/src/screens/ProfileScreen.js`,
  `mobile/scripts/validators.test.mjs`, `firebase/firestore.rules`, `README.md` —
  commit: `9920c70`.
- **Verificación:** `cd mobile && npm test` → 8/8 tarifas, 14/14 validaciones, 6/6 cuenta
  regresiva, 9/9 ganancias/historial, 11/11 pagos y 6/6 calificación (54 en total). Bundle de
  Android exportado sin errores. Reglas desplegadas y verificadas contra Firestore real 4/4:
  se rechaza un conductor sin aceptar términos, se rechaza XL con capacidad 5, se acepta el
  registro completo con XL y capacidad 6, y se acepta el registro de un pasajero. El usuario
  y los documentos temporales de la prueba se eliminaron.
- **Aprendizaje:** (completar) Qué entendí de validar los campos nuevos tanto en el formulario
  como en las reglas, y qué haría distinto.

---

### Entrada #9 - Fecha: 2026-11-12 - Integrante: (completar) - Herramienta: Asistente de código (Big Pickle / OpenCode)

- **Objetivo:** Cerrar los huecos rápidos del flujo de viaje: rechazar solicitudes sin
  cancelarlas, mostrar duración y método de pago en la tarjeta de solicitud, promedio por
  viaje y saldo del conductor en ganancias, filtros de fecha y método de pago en el historial,
  y mapa con la ruta en el detalle del viaje.
- **Prompt:** «Huecos rápidos de viaje» (opción elegida tras completar el registro).
- **Resumen de la respuesta:** El botón **Rechazar** agrega el UID del conductor a
  `trips.rejectedBy`; el viaje sigue en `requested` para los demás y la suscripción filtra los
  que ese conductor ya rechazó. La tarjeta de solicitud muestra la **duración estimada** y el
  **método de pago**. En Ganancias se agregó el **promedio neto por viaje** y una tarjeta de
  **saldo con la plataforma** (ganancias con tarjeta menos comisión de viajes en efectivo,
  que puede ser negativa). El historial ahora filtra por **Hoy / Semana / Mes / rango de
  fechas** (`DD/MM/AAAA`, inclusivo) y por **método de pago**, además de estado y rol. El
  detalle del viaje muestra un mapa con la ruta aproximada en línea recta entre origen y
  destino.
- **Qué se usó / modificó / descartó:** Se reutilizaron `ChipRow`, `Input` y las funciones
  puras de `utils/earnings.js` y `utils/history.js`. Los filtros y totales se calculan en el
  teléfono; no se agregaron índices ni campos nuevos en Firestore, salvo `rejectedBy`. Se
  descartó cancelar el viaje al rechazarlo (afectaría al pasajero y a otros conductores) y se
  descartó integrar Google Directions/Distance Matrix por ahora: la ruta es una `Polyline`
  recta y queda como mejora futura. Las reglas ahora congelan los datos del recorrido y de la
  cotización (origen, destino, distancia, duración, categoría, propina, moneda y
  `commissionRate`) y solo permiten recalcular la tarifa al pasar de `in_progress` a
  `completed`, para que el conductor no pueda alterar el precio después de aceptar.
- **Archivos y commit:** `mobile/src/services/rideService.js`,
  `mobile/src/hooks/useDriverRides.js`, `mobile/src/components/RideRequestCard.js`,
  `mobile/src/components/RideMap.js`, `mobile/src/screens/DriverHomeScreen.js`,
  `mobile/src/screens/EarningsScreen.js`, `mobile/src/screens/HistoryScreen.js`,
  `mobile/src/screens/RideDetailScreen.js`, `mobile/src/utils/earnings.js`,
  `mobile/src/utils/history.js`, `mobile/scripts/earnings.test.mjs`,
  `firebase/firestore.rules`, `README.md` — commit: `b1b2cfc`.
- **Verificación:** `cd mobile && npm test` → 8/8 tarifas, 14/14 validaciones, 6/6 cuenta
  regresiva, 16/16 ganancias/historial, 11/11 pagos y 6/6 calificación (61 en total). Bundle
  de Android exportado sin errores. Reglas desplegadas y verificadas contra Firestore real
  7/7: el pasajero crea la solicitud, dos conductores rechazan sin borrarse entre sí, no se
  rechaza un viaje ya aceptado, el conductor no puede cambiar la tarifa ni cancelar el viaje.
  El viaje y las tres cuentas temporales de la prueba se eliminaron.
- **Aprendizaje:** (completar) Qué entendí de separar el rechazo (ocultar para un conductor)
  de la cancelación (afectar a todos), de calcular el saldo como deuda, y de congelar la
  cotización en las reglas para que el precio no se pueda manipular.

