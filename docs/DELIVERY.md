# Guía de entrega

Checklist para instalar, ejecutar, demostrar y entregar el proyecto.

## 1. Estado del repositorio

| Dato | Valor |
|---|---|
| Proyecto Firebase | `uberclone-7afa6` |
| Región de Firestore | `us-central1` |
| Rama de trabajo | `feat/firebase-setup` |
| Rama principal | `main` (fusionada con `feat/firebase-setup`) |
| Remoto | `https://github.com/caleudo73-cmd/Uber-DM.git` |
| Último commit funcional | ver `git log --oneline` |

> La rama de trabajo ya está fusionada y subida a `main`. No se abrió PR porque `gh` no está
> instalado en el equipo; el merge se hizo localmente y se subió al remoto. Si se necesita el PR
> para la rúbrica, se puede abrir desde GitHub con la rama `feat/firebase-setup`.

## 2. Instalación desde cero

Requisitos: Node.js 20+, cuenta de Firebase y Expo Go.

```bash
git clone https://github.com/caleudo73-cmd/Uber-DM.git
cd Uber-DM
git checkout feat/firebase-setup
cd mobile
npm install
```

Crear `mobile/.env` a partir de `mobile/.env.example`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Opcional: distancia y duración reales con Google Distance Matrix
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Los valores están en **Firebase Console → Configuración del proyecto → Tus apps → Web**.
Si falta alguno, la app muestra una pantalla con las claves pendientes. La llave de Google es
opcional: sin ella la cotización usa la estimación local.

```bash
npx expo start -c
```

Escanear el QR con Expo Go (mismo Wi-Fi) o abrir el emulador.

### Reglas de Firestore

```bash
cd firebase
npx firebase login
npx firebase deploy --only firestore:rules
```

`firebase/.firebaserc` ya apunta a `uberclone-7afa6`. Si se usa otro proyecto, cambiarlo.

### Usuarios demo (opcional)

```bash
cd firebase/functions
npm install
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\serviceAccount.json"
$env:FIREBASE_PROJECT_ID="uberclone-7afa6"
npm run seed
```

Crea `pasajero@demo.com` y `conductor@demo.com` con clave `123456`.

## 3. Comandos útiles

| Comando | Dónde | Para qué |
|---|---|---|
| `npm install` | `mobile/` | Dependencias de la app |
| `npx expo start -c` | `mobile/` | Metro con caché limpia |
| `npm test` | `mobile/` | 76 pruebas automáticas |
| `npx expo export --platform android` | `mobile/` | Verificar que el bundle compila |
| `npx firebase deploy --only firestore:rules` | `firebase/` | Publicar reglas |
| `npm run seed` | `firebase/functions/` | Crear usuarios demo |
| `npx firebase deploy --only functions` | `firebase/` | Pago real (requiere Blaze) |

## 4. Guion de demostración (5 minutos)

1. **Registro del conductor** (1 min): mostrar las tres pestañas, un error debajo de un campo,
   el límite de 30 en marca/modelo, el color como lista y una fecha de vencimiento pasada
   rechazada. Enviar y mostrar el estado **Pendiente**.
2. **Aprobación** (20 s): cambiar `approvalStatus` a `approved` en Firestore y mostrar que la
   app se actualiza sin cerrar sesión.
3. **Disponibilidad** (20 s): activar el interruptor y mostrar el permiso de ubicación.
4. **Solicitud** (1 min): desde el pasajero pedir un viaje. En el conductor mostrar la tarjeta
   con duración, método de pago, tarifa y ganancia. Rechazar y mostrar que desaparece; pedir
   otro y aceptar.
5. **Viaje** (1 min): *Voy en camino* → *Pasajero a bordo* → *Finalizar*.
6. **Pago** (1 min): en el pasajero abrir el checkout de prueba y aprobar. Mostrar el resumen
   del cobro en el conductor.
7. **Calificación** (20 s): calificar con 5 estrellas y mostrar el promedio en el perfil.
8. **Ganancias e historial** (1 min): mostrar totales, saldo, filtros y detalle con mapa.
9. **Perfil y Drawer** (40 s): abrir el menú lateral, entrar a *Mi perfil*, editar un dato y
   guardar; mostrar que el cambio se refleja al instante. Mostrar también el selector de
   idioma en *Configuración*.

Consejo: dejar la app ya abierta y con sesión iniciada para no gastar tiempo en el login.

## 5. Variables de entorno y secretos

| Archivo | Contenido | ¿Se commitea? |
|---|---|---|
| `mobile/.env.example` | Nombres de las variables de Firebase y Google Maps | ✅ Sí |
| `mobile/.env` | Valores reales | ❌ No (ignorado) |
| `firebase/functions/.env.example` | Nombres de Mercado Pago | ✅ Sí |
| `firebase/functions/.env` | Access token de Mercado Pago | ❌ No (ignorado) |

Nunca pegar tokens, claves privadas ni datos personales reales en la app, en la bitácora ni
en los prompts de IA.

## 6. Entregables

| Entregable | Estado | Acción |
|---|---|---|
| Repositorio con ramas y PR | ✅ | `feat/firebase-setup` fusionada en `main` y subida al remoto |
| README con instalación y Uso de IA | ✅ | `README.md` |
| `docs/AI_LOG.md` | 🟡 | Completar integrantes y aprendizajes |
| Bitácora en PDF | ❌ | Exportar `docs/AI_LOG.md` a PDF |
| Video de 5 minutos | ❌ | Grabar el guion de la sección 4 |
| Documentación de arquitectura | ✅ | `docs/ARCHITECTURE.md` |
| Matriz de cumplimiento | ✅ | `docs/SPEC_COMPLIANCE.md` |
| Guía de pruebas | ✅ | `docs/TESTING.md` |

## 7. Limitaciones que se deben declarar

- El **pago con tarjeta es simulado** (modo prueba). El pago real con Mercado Pago está
  implementado pero no desplegado porque requiere el plan Blaze.
- **No hay notificaciones push** (FCM requiere development build).
- La **ruta dibujada es una línea recta**. Con `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` la distancia
  y la duración sí vienen de Google Distance Matrix; sin llave se estiman localmente.
- Las **fotos van en base64** en Firestore; no se usa Cloudinary.
- La **tecnomecánica** se exige solo a vehículos con **6 años o más**.
- La UI está en **español**; el idioma se guarda en el perfil pero no traduce la app.

## 8. Antes de subir el video

- [ ] `cd mobile && npm test` → 76/76.
- [ ] `npx expo export --platform android` sin errores.
- [ ] Reglas desplegadas y compiladas.
- [ ] Base de datos sin viajes ni cuentas temporales de prueba.
- [ ] `docs/AI_LOG.md` sin campos `(completar)`.
- [ ] README y documentos con los enlaces correctos.
- [ ] Rama fusionada y subida a `main`.
- [ ] Video de máximo 5 minutos.
