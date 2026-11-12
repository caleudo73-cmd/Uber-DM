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
