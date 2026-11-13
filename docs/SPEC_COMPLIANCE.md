# Cumplimiento de la especificación

Comparación punto por punto entre el PDF **UberClone — Versión Conductor** y el estado
real del repositorio (rama `feat/firebase-setup`).

Leyenda:

- ✅ **Cumple**: implementado y verificable en el código o en Firestore.
- 🟡 **Parcial**: funciona, pero con una simplificación o falta un detalle de la spec.
- ❌ **No cumple / pendiente**: no está implementado.

> Última revisión: 2026-11-12. Comando de pruebas: `cd mobile && npm test` → **76/76**.
> Bundle Android exportado sin errores.

---

## 1. Descripción general y funcionalidades principales

| # | Funcionalidad del PDF | Estado | Dónde / nota |
|---|---|---|---|
| 1 | Registro del conductor con datos, vehículo y documentos, con validaciones | ✅ | `screens/RegisterScreen.js`, `components/DriverRegisterForm.js`, `hooks/useDriverRegisterForm.js`, `utils/validators.js` |
| 2 | Disponible / No disponible y ubicación en tiempo real | ✅ | `hooks/useDriverAvailability.js`, `hooks/useDriverLocation.js`, `services/userService.js` |
| 3 | Recepción de solicitudes con tiempo límite para aceptar o rechazar | ✅ | `hooks/useTripRequests.js`, `components/RideRequestCard.js` (15 s, rechazo automático persistente) |
| 4 | Navegación al punto de recogida y al destino con Google Directions API | 🟡 | Distancia y duración reales con **Google Distance Matrix** cuando hay `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (`services/directionsService.js`), con respaldo local. El trazo del mapa sigue siendo una **línea recta** con `Polyline`. |
| 5 | Cobro con Mercado Pago / Stripe en modo prueba y efectivo | 🟡 | Efectivo ✅ y **pago de prueba simulado** ✅. Checkout Pro real está implementado en `firebase/functions` pero **no desplegado** (requiere Blaze). Stripe no está integrado. |
| 6 | Cálculo automático de tarifa, comisión y ganancia neta | ✅ | `utils/calculateFare.js`, `config/pricing.js` |
| 7 | Historial con filtros y resumen de ganancias día/semana/mes | ✅ | `screens/HistoryScreen.js`, `screens/EarningsScreen.js`, `utils/history.js`, `utils/earnings.js` |
| 8 | Navegación combinada: Stack + Tabs + Drawer | ✅ | **Stack** para el flujo del viaje y las pantallas de edición, **Tabs** para el registro y **Drawer** para inicio, perfil, historial, ganancias y configuración (`navigation/AppNavigator.js`, `components/AppDrawerContent.js`). |

---

## 2. Registro del conductor

| Requisito | Estado | Nota |
|---|---|---|
| Tres pestañas: Datos personales, Vehículo, Documentos | ✅ | `config/driverRegistration.js`, `components/TabBar.js` |
| Botón Enviar solo con las tres pestañas completas y válidas | ✅ | `submit()` valida todos los pasos y salta al primero con error |
| Errores debajo de cada campo (no `Alert`) | ✅ | `components/Input.js`, `PhotoPicker.js` |
| Cuenta queda **Pendiente** y no puede ponerse Disponible | ✅ | `authService.signUp`, `DriverHomeScreen` bloquea con `approvalStatus !== approved` |
| Foto de perfil obligatoria | ✅ | `PhotoPicker` + `users/{uid}/documents` (base64 comprimido) |
| Nombre máximo 50, solo letras y espacios | ✅ | `isValidFullName` |
| Documento numérico de 6 a 10 dígitos | ✅ | `isValidDocumentNumber` |
| Celular de 10 dígitos | ✅ | `isValidPhone` (empieza por 3) |
| Fecha de nacimiento con **selector de fecha**, mayor de 18 | ✅ | `DateField` abre el calendario nativo (`@react-native-community/datetimepicker`) y limita el rango a 18–80 años; el texto `DD/MM/AAAA` sigue siendo editable. |
| Género en lista desplegable | ✅ | `Choice` con `GENDER_OPTIONS` |
| Correo con validación de @ y dominio | ✅ | `isValidEmail` |
| Idioma Español / inglés | ✅ | `LANGUAGE_OPTIONS`; se guarda en el perfil. La UI sigue en español. |
| Categoría en lista (Económico, XL, Premium) | ✅ | `VEHICLE_CATEGORIES` |
| Placa colombiana ABC123, mayúsculas antes de validar | ✅ | `normalizePlate` + `isValidPlate` (carro y moto) |
| Marca y modelo, máximo 30 caracteres cada uno | ✅ | `MAX_VEHICLE_TEXT_LENGTH` + `isValidVehicleText`, `maxLength={30}` |
| Año de 4 dígitos, no mayor al actual | ✅ | `isValidVehicleYear` (mínimo 1990) |
| Color en **lista desplegable** | ✅ | `VEHICLE_COLORS` + `Choice` |
| Capacidad numérica; XL exige mínimo 6 | ✅ | `isValidPassengerCapacity` |
| Foto del vehículo donde se vea la placa | ✅ | `PhotoPicker` obligatorio |
| Licencia: número + foto + vencimiento **posterior a hoy** | ✅ | `isNotExpired` estricto (`> hoy`) |
| SOAT: foto + vencimiento posterior a hoy | ✅ | `isNotExpired` |
| Tecnomecánica: foto + vencimiento **si aplica según el año** | ✅ | `needsTechnomechanical`: se exige para vehículos con **6 años o más**; en los más nuevos el campo y la foto se ocultan y se guardan como `null`. |
| Correo de Mercado Pago con formato válido | ✅ | `isValidEmail` |
| Checkbox de términos con el 20 % visible | ✅ | `DriverRegisterForm` (paso Documentos) |
| No guardar números de cuenta/tarjeta ni datos sensibles | ✅ | Solo se guarda el correo de Mercado Pago; no hay datos de tarjeta |

---

## 3. Pantallas del conductor

| Pantalla / requisito | Estado | Nota |
|---|---|---|
| **Inicio**: mapa + interruptor Disponible / No disponible | ✅ | `DriverHomeScreen`, `AvailabilityToggle`, `RideMap` |
| Ubicación se actualiza cada pocos segundos mientras está Disponible | ✅ | `useDriverLocation` escribe como máximo cada 10 s o si se movió > 25 m |
| El seguimiento se detiene al pasar a No disponible o salir de pantalla | ✅ | `useEffect` con `subscription.remove()` en la limpieza |
| **Solicitud entrante**: origen, destino, distancia, duración, categoría, método de pago, tarifa y ganancia neta | ✅ | `RideRequestCard` |
| Temporizador de 15 s y rechazo automático al llegar a cero | ✅ | `utils/countdown.js`; al vencer se guarda `rejectedBy` y desaparece |
| **Viaje en curso**: ruta a recogida y cambio a destino al tocar *Pasajero a bordo* | 🟡 | Los estados y el mapa cambian correctamente. La distancia y la duración son reales con Distance Matrix (si hay llave); el trazo sigue siendo una línea recta. |
| Botón para finalizar el viaje | ✅ | `CurrentRidePanel` → `complete` |
| **Cobro y resumen**: tarifa final, comisión, ganancia neta y estado del pago | ✅ | `ActiveRidePanel`, `RideDetailScreen`; estados Aprobado / Pendiente / Rechazado / Efectivo |
| **Ganancias**: día, semana y mes | ✅ | `EarningsScreen` + `useEarnings` |
| **Historial** con filtros | ✅ | `HistoryScreen` |
| **Perfil y configuración**: datos editables, vehículo, documentos, idioma y cierre de sesión | ✅ | `ProfileScreen`, `SettingsScreen`, `EditProfileScreen`, `EditVehicleScreen` y `EditDocumentsScreen`. La foto de perfil, el vehículo y los documentos se pueden reemplazar; el idioma se guarda en el perfil. |

### Estados del viaje

| Estado | Estado | Nota |
|---|---|---|
| `requested` | ✅ | Lo crea el pasajero |
| `accepted` | ✅ | Lo toma un conductor; el rechazo/vencimiento no bloquea a los demás (`rejectedBy`) |
| `driver_arriving` | ✅ | `markDriverArriving` |
| `in_progress` | ✅ | `startRide` |
| `completed` | ✅ | `completeRide` recalcula la tarifa con `calculateFare` |
| `paid` | ✅ | Pago de prueba o efectivo confirmado |
| `cancelled` | ✅ | Cancelación antes de `in_progress` |

### Hooks obligatorios vistos en clase

| Requisito | Estado | Nota |
|---|---|---|
| `useState` para disponibilidad, solicitud activa y formularios | ✅ | `useDriverAvailability`, `useDriverRides`, `useDriverRegisterForm` |
| `useEffect` con limpieza para ubicación, temporizador y suscripciones | ✅ | `useDriverLocation`, `RideRequestCard`, `useTripRequests`, `useDriverRides` |
| `useContext` para la sesión del conductor y el viaje activo | ✅ | `context/AuthContext.js` + `hooks/useAuth.js` |
| `useMemo` para totales de ganancias | ✅ | `hooks/useEarnings.js` |
| `useCallback` para aceptar y rechazar | ✅ | `useDriverRides.js` |
| Hooks personalizados `useDriverLocation`, `useTripRequests`, `useEarnings` | ✅ | Archivos con esos nombres en `src/hooks/` |
| AsyncStorage solo para preferencias y sesión | ✅ | `services/storage.js`; la sesión la persiste Firebase Auth con `AsyncStorage`; no se guardan datos sensibles |

---

## 4. Pasarela de pagos

| Requisito | Estado | Nota |
|---|---|---|
| Mercado Pago Checkout Pro recomendado | 🟡 | Implementado en `firebase/functions/index.js` (preferencia + webhook + retorno), **sin desplegar** por falta de plan Blaze |
| Stripe en modo prueba | ❌ | No integrado |
| Flujo: calcular tarifa final con la misma función | ✅ | `completeRide` usa `calculateFare` |
| Enviar `tripId` y monto al backend | ✅ | `paymentService.createPaymentPreference` (solo camino real) |
| Backend crea preferencia con llave secreta | ✅ | `firebase/functions/index.js` |
| App abre checkout y el pasajero paga con tarjeta de prueba | 🟡 | El camino activo es un **checkout simulado** dentro de la app (`TestPaymentModal`) |
| Webhook/retorno actualiza `paymentStatus`, `paymentId`, `status: paid` | 🟡 | Implementado para el camino real; el camino activo lo escribe la app con reglas restringidas a `mercadopago_test` |
| App del conductor escucha el cambio en tiempo real | ✅ | `onSnapshot` sobre `trips` |
| Secretos solo en backend, `.env` excluido de Git | ✅ | `firebase/functions/.env` ignorado; `.env.example` solo nombres |
| `.env.example` con nombres sin valores | ✅ | `mobile/.env.example`, `firebase/functions/.env.example` |
| Solo credenciales de prueba | ✅ | No hay credenciales reales en el repo |
| Efectivo: el conductor marca el cobro y la comisión queda como saldo | ✅ | `markCashPaid`; saldo en `EarningsScreen` |

---

## 5. Cálculo de tarifa, comisión y ganancias

| Requisito | Estado | Nota |
|---|---|---|
| Comisión 20 % y propina 100 % al conductor | ✅ | `config/pricing.js`, `utils/calculateFare.js` |
| Valores en COP enteros y configurables en un único archivo | ✅ | `PRICING` |
| Redondeo al múltiplo de 100 antes de la comisión | ✅ | `ROUNDING_STEP = 100` |
| Una sola función pura `calculateFare({ distanceKm, durationMin, category, tip })` | ✅ | Usada en estimación y cierre |
| Cada viaje guarda `commissionRate` | ✅ | `requestRide` |
| Ganancias: viajes, facturado, comisiones, propinas, neto y promedio por viaje | ✅ | `summarizeEarnings` + `useEarnings` |
| Saldo: ganancias con tarjeta − comisiones de efectivo | ✅ | `summarizeBalance` |
| Distancia y duración desde Google Distance Matrix | ✅ | `services/directionsService.js`: Distance Matrix si hay llave; respaldo local en línea recta (`utils/geo.js`) si falta, falla o tarda más de 6 s. |
| Ejemplo 8,5 km / 22 min → 19.200 / 3.840 / 15.360 | ✅ | Probado en `scripts/pricing.test.mjs` |

---

## 6. Historial de carreras

| Requisito | Estado | Nota |
|---|---|---|
| FlatList ordenada del más reciente al más antiguo | ✅ | `HistoryScreen` |
| Filtros Hoy, Semana, Mes y Rango de fechas | ✅ | `utils/history.js`, rango `DD/MM/AAAA` inclusivo |
| Filtro por método de pago | ✅ | `HISTORY_PAYMENT_FILTERS` |
| Cada elemento: fecha y hora, origen → destino, categoría, tarifa, ganancia neta y estado del pago | ✅ | `RideRow` |
| Detalle con ruta en el mapa, duración, distancia, comisión, propina y calificación | ✅ | `RideDetailScreen` (trazo recto entre origen y destino) |
| Modelo de datos con los campos sugeridos | ✅ | `trips` en Firestore; además `participants`, `rejectedBy`, `driver`, `currency` |
| Mensaje vacío cuando no hay viajes | ✅ | `ListEmptyComponent` |
| Paginación o límite de la consulta | ✅ | “Ver más” de 10 en 10 en la UI; la suscripción trae los viajes del usuario |

---

## 7. APIs gratuitas adicionales

| Servicio | Decisión en el PDF | Estado | Nota |
|---|---|---|---|
| Firebase Cloud Messaging (push) | Obligatoria | ❌ | No implementado; en Expo Go no funciona y requiere development build |
| Firestore en tiempo real (`onSnapshot`) | Obligatoria | ✅ | Solicitudes, viaje activo, perfil e historial |
| Geolocalización (`watchPosition`) | Obligatoria | ✅ | `expo-location` en `useDriverLocation` |
| Maps SDK (`react-native-maps`) | Ya incluida | ✅ | `RideMap`, `RideDetailScreen` |
| Cloudinary para fotos | Recomendada | 🟡 | Hoy las fotos se comprimen y guardan en base64 en `users/{uid}/documents` (Spark no incluye Storage) |
| Nominatim (coordenadas → dirección) | Opcional | 🟡 | Se usa **Photon** (OpenStreetMap) para buscar lugares; no se hace geocodificación inversa |
| OSRM / OpenRouteService | Opcional | ❌ | No implementado |

---

## 8. Bitácora de IA

| Requisito | Estado | Nota |
|---|---|---|
| `docs/AI_LOG.md` en el repositorio | ✅ | Entradas #1–#13 |
| Cada entrada con fecha, integrante, herramienta, objetivo, prompt, resumen, uso/modificación/descarte, archivos, commit, verificación y aprendizaje | 🟡 | La estructura está; varios campos **“Integrante”** y **“Aprendizaje”** dicen `(completar)` |
| README con sección **Uso de IA** y enlace | ✅ | `README.md` |
| Bitácora exportada a PDF | ❌ | Pendiente para la entrega |
| Código marcado con `// AI-assisted: see docs/AI_LOG.md #N` | ✅ | En los archivos asistidos |

---

## 9. Entregables y rúbrica

| Entregable | Estado | Nota |
|---|---|---|
| Repositorio con ramas por integrante y PR revisados | 🟡 | La rama `feat/firebase-setup` está fusionada en `main` y el remoto está actualizado. No se abrió PR porque `gh` no está instalado; GitHub ofrecía crearlo desde el navegador. |
| Merge en `main` | ✅ | `main` incluye todos los commits de la rama de trabajo. |
| README con instalación, variables `.env.example` y Uso de IA | ✅ | `README.md`, `mobile/.env.example` |
| `docs/AI_LOG.md` | ✅ | Existe; faltan datos de integrantes |
| `docs/AI_LOG.md` en PDF | ❌ | Pendiente |
| Video de máximo 5 minutos con el flujo completo | ❌ | Pendiente |

---

## Brechas priorizadas

### Cerradas en esta pasada

- **Perfil editable**: datos personales, vehículo, documentos, foto e idioma.
- **Drawer** de navegación con inicio, perfil, historial, ganancias y configuración.
- **Tecnomecánica condicional**: solo se exige en vehículos con 6 años o más.
- **Selector nativo de fecha** para nacimiento y vencimientos, con texto editable.
- **Google Distance Matrix** opcional para distancia y duración reales, con respaldo local.
- Límite de 30 caracteres en marca y modelo.
- Color del vehículo como lista desplegable.
- Vigencia estricta de documentos (`> hoy`).
- Rechazo automático persistente al vencer los 15 s.
- Hooks con los nombres de la spec (`useDriverLocation`, `useTripRequests`, `useEarnings`).
- Historial con categoría, estado de pago, tarifa y neto/propina.
- Reglas que congelan la cotización y el recorrido del viaje.

### Recomendadas para cerrar la entrega

1. **Bitácora en PDF** y **video** de 5 minutos.
2. Completar los campos `(completar)` de `docs/AI_LOG.md`.

### Opcionales / requieren servicios externos

- **FCM push**: requiere development build y configuración de Firebase Messaging.
- **Google Directions** para dibujar la ruta real en el mapa: Distance Matrix ya aporta distancia y duración; falta la geometría codificada.
- **Cloudinary**: requiere cuenta y plan gratuito; hoy base64 en Firestore.
