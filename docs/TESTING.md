# Pruebas y verificación

## 1. Pruebas automáticas

No se usa Jest: los cálculos y validaciones son funciones puras y se prueban con Node
directamente. Esto mantiene las pruebas rápidas y sin configuración extra.

```bash
cd mobile
npm test
```

Salida esperada (62 pruebas):

| Archivo | Pruebas | Qué cubre |
|---|---:|---|
| `scripts/pricing.test.mjs` | 8 | Tarifa base, distancia, tiempo, categorías, redondeo a 100, comisión, propina, ejemplo de la spec |
| `scripts/validators.test.mjs` | 15 | Nombre, correo, contraseña, documento, celular, placa, año, capacidad XL, marca/modelo ≤ 30, fechas, edad y vigencia estricta de documentos |
| `scripts/countdown.test.mjs` | 6 | Segundos restantes, proporción de la barra, vencimiento y límites |
| `scripts/earnings.test.mjs` | 16 | Totales por día/semana/mes, promedio, saldo y filtros del historial (estado, rol, fecha, método) |
| `scripts/payments.test.mjs` | 11 | Métodos de pago, pago de prueba, transiciones y campos que puede escribir el pasajero |
| `scripts/ratings.test.mjs` | 6 | Rango 1–5, promedio y reglas de calificación |

También se puede correr una suite aislada:

```bash
npm run test:pricing
npm run test:validators
npm run test:countdown
npm run test:earnings
npm run test:payments
npm run test:ratings
```

### Casos clave que deben seguir pasando

- `calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy' })` →
  `fare: 19200`, `commission: 3840`, `driverEarnings: 15360`.
- XL con los mismos datos → `fare: 26900`, `commission: 5380`, `driverEarnings: 21520`.
- La propina se suma completa a `driverEarnings` y no paga comisión.
- Un documento que vence **hoy** ya no es válido (`> hoy`).
- Marca/modelo de 31 caracteres no es válido.
- El saldo puede ser negativo cuando hay más comisión de efectivo que ganancia con tarjeta.

## 2. Verificación del bundle

Antes de entregar, exportar el bundle de Android para detectar imports o sintaxis rotos:

```bash
cd mobile
npx expo export --platform android --output-dir "$env:TEMP\opencode\bundle-check" --clear
```

Debe terminar con un `.hbc` de ~4,5 MB y `metadata.json`, sin errores.

## 3. Verificación de reglas contra Firestore real

Las reglas no se prueban solo con el emulador. Se ejecutó un script temporal con el token de
administrador de Firebase CLI contra el proyecto `uberclone-7afa6`, creando cuentas y un
viaje temporales y borrándolos al final.

Casos verificados (**7/7**):

| # | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 1 | El pasajero crea la solicitud | 200 | ✅ 200 |
| 2 | El conductor 1 rechaza | 200 | ✅ 200 |
| 3 | El conductor 2 rechaza sin borrar al 1 | 200 | ✅ 200 |
| 4 | Un administrador marca el viaje como aceptado | 200 | ✅ 200 |
| 5 | No se rechaza un viaje ya aceptado | 403 | ✅ 403 |
| 6 | El conductor no puede cambiar la tarifa | 403 | ✅ 403 |
| 7 | El conductor no puede cancelar el viaje | 403 | ✅ 403 |

Además se comprobó que no quedaran viajes ni cuentas temporales:

```
Viajes temporales restantes: 0
Cuentas temporales restantes: 0
```

Para volver a verificar tras cambiar reglas:

```bash
cd firebase
npx firebase deploy --only firestore:rules
```

Las reglas deben compilar (`rules file firestore.rules compiled successfully`) y publicarse
(`released rules firestore.rules`).

## 4. Prueba manual en el teléfono

Metro en `exp://<IP-LAN>:8081`. Abrir con Expo Go en dos dispositivos o en un dispositivo y
un emulador.

### Preparación

1. Un usuario **pasajero** y un usuario **conductor** aprobado.
2. El conductor debe estar en **Disponible**.
3. El pasajero debe tener un destino elegido.

### Flujo completo

- [ ] **Registro del conductor**: tres pestañas, errores debajo de cada campo, no deja enviar
      con campos vacíos, fotos obligatorias, marca/modelo de más de 30 se recorta, color es
      lista, documentos vencidos se rechazan.
- [ ] **Aprobación**: el conductor recién registrado ve “Pendiente” y no puede ponerse
      Disponible. Al cambiar `approvalStatus` a `approved` en Firestore, la app se actualiza
      sin cerrar sesión.
- [ ] **Disponibilidad**: al activar el interruptor se pide permiso de ubicación y
      `users/{uid}.driverLocation` empieza a actualizarse; al desactivar, deja de escribir.
- [ ] **Solicitud entrante**: el conductor ve origen, destino, distancia, duración,
      categoría, método de pago, tarifa y ganancia neta.
- [ ] **Rechazar**: el viaje desaparece para ese conductor y sigue disponible para otro.
- [ ] **Vencer**: dejar pasar 15 s sin tocar nada; la tarjeta desaparece y no reaparece.
- [ ] **Aceptar**: el pasajero ve nombre, vehículo, color y placa del conductor.
- [ ] **Viaje**: *Voy en camino* → *Pasajero a bordo* → *Finalizar*.
- [ ] **Efectivo**: el conductor marca el cobro; el viaje pasa a `paid` y aparece en
      ganancias con la comisión como deuda.
- [ ] **Tarjeta de prueba**: el pasajero abre el checkout simulado, aprueba y el viaje pasa a
      `paid`. Probar también “Simular rechazo” y reintentar.
- [ ] **Calificación**: al aprobar el pago se abre el modal de 1–5 estrellas; se puede
      calificar después desde el detalle. El promedio aparece en el perfil del conductor.
- [ ] **Ganancias**: Hoy / Semana / Mes muestran viajes, bruto, comisión, propinas, neto,
      promedio y saldo.
- [ ] **Historial**: filtros por estado, rol, fecha (incluido rango `DD/MM/AAAA`) y método;
      “Ver más” pagina de 10 en 10; el mensaje vacío aparece cuando no hay viajes.
- [ ] **Detalle**: mapa con ruta, distancia, duración, categoría, tarifa, comisión, propina,
      ganancia, estado del pago y calificación.
- [ ] **Drawer**: el botón de menú abre el panel con inicio, perfil, historial, ganancias
      (solo conductor) y configuración; el ítem activo se resalta.
- [ ] **Perfil editable**: cambiar nombre, celular, ciudad y foto; guardar y ver el cambio
      reflejado al volver al perfil.
- [ ] **Vehículo y documentos**: editar marca, placa, color y vencimientos; reemplazar una
      foto. Una fecha de vencimiento pasada debe mostrar el error debajo del campo.
- [ ] **Idioma**: cambiar entre Español e English en *Configuración* y verificar que se
      guarda en `users/{uid}.language` (la interfaz sigue en español).
- [ ] **Cierre de sesión**: vuelve al login y la sesión no se restaura.

## 5. Datos de prueba

En Firestore puede haber viajes de prueba (`test_calificacion_1`, viajes pagados con
calificación). No son necesarios para la app; se pueden borrar antes de la entrega si se
quiere una base limpia.

Cuentas demo (si se corrió el seed):

| Rol | Correo | Clave |
|---|---|---|
| Pasajero | `pasajero@demo.com` | `123456` |
| Conductor | `conductor@demo.com` | `123456` |

## 6. Qué no está cubierto por pruebas automáticas

- Componentes de React Native (no hay Jest + Testing Library).
- Llamadas reales a Firebase desde la app.
- Pagos reales de Mercado Pago (no desplegados).
- Notificaciones push (no implementadas).
- Permisos de cámara/galería/ubicación en dispositivos físicos.

Esas partes se validan con la lista manual anterior y con la verificación de reglas.
