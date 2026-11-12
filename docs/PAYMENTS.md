# Pagos

Hay dos caminos implementados. **El que está activo es el pago de prueba simulado**, porque
no requiere tarjeta, cuenta de pasarela ni el plan Blaze de Firebase.

| Camino | Estado | Requisitos | Quién confirma el pago |
|---|---|---|---|
| **Prueba simulado** (por defecto) | Activo | Ninguno | El pasajero, dentro de la app |
| **Mercado Pago real** (Checkout Pro) | Opcional | Plan Blaze + credenciales | Webhook de Mercado Pago |

---

## 1. Pago de prueba (activo)

El checkout se simula en la app: no hay pasarela, no se piden datos reales y **no se cobra
dinero**. Sirve para demostrar el ciclo `completed → paid` completo.

### Cómo funciona

```
App (pasajero)                                  Firestore
     │                                              │
     │ toca "Pagar con tarjeta (prueba)"            │
     │ abre TestPaymentModal                        │
     │ elige Aprobar o Simular rechazo              │
     │ transacción:                                 │
     │   paymentStatus = approved/rejected ────────►│
     │   status = paid (si aprueba)                 │
     │◄──── onSnapshot actualiza la pantalla ───────│
```

- **Aprobar**: `status: paid`, `paymentStatus: approved`, `paymentAmount: tarifa + propina`,
  `paymentId: test_<id>`, `paidAt` con la hora del servidor.
- **Rechazar**: `status` sigue en `completed`, `paymentStatus: rejected` y el botón permite
  reintentar.

El viaje se crea con `paymentMethod: 'mercadopago_test'`. Las reglas de Firestore solo
permiten al **pasajero dueño del viaje** escribir los campos de pago cuando el método es
`mercadopago_test` y el resultado es exactamente uno de los dos anteriores. Los viajes con
`paymentMethod: 'mercadopago'` (pago real) siguen bloqueados para el cliente.

### Tarjeta ficticia

El modal muestra la tarjeta de prueba estándar de Mercado Pago:

```
4242 4242 4242 4242 · 12/30 · CVV 123
```

No hay campos que completar: solo se elige el resultado a simular.

### Probarlo

1. Inicia sesión como pasajero (`pasajero@demo.com` / `123456`).
2. Pide un viaje eligiendo **Tarjeta (prueba)**.
3. Con el conductor (`conductor@demo.com`), acepta y finaliza el viaje.
4. En la app del pasajero toca **Pagar con tarjeta (prueba)** y luego **Aprobar pago de prueba**.
5. El viaje pasa a `paid` y aparece en **Ganancias** e **Historial**.

---

## 2. Mercado Pago real (opcional, requiere Blaze)

Este camino ya está programado en `firebase/functions` y queda listo para cuando quieras
cobrar de verdad. La app pide una preferencia de **Checkout Pro**, abre el checkout en el
navegador y el pago se confirma por **webhook**. La app nunca ve ni guarda el token.

```
App (pasajero)                Cloud Functions                 Mercado Pago
     │                              │                              │
     │ createPaymentPreference ────►│ crea preferencia ───────────►│
     │◄──────── initPoint ──────────│                              │
     │ abre checkout en el navegador ──────────────────────────────►│
     │                              │◄──── webhook "payment" ──────│
     │                              │ valida firma + monto         │
     │◄──── onSnapshot: paid ───────│ actualiza trips/{id}         │
```

### 2.1 Activar el plan Blaze

Cloud Functions requiere el plan **Blaze**. En la consola de Firebase:

1. ⚙️ **Uso y facturación** → **Modificar plan** → **Blaze**.
2. Agrega una tarjeta. La capa gratuita cubre 2 millones de invocaciones y 400 000
   GB-segundos al mes; para este proyecto el costo esperado es $0.

> Mientras no quieras activarlo, el modo de prueba del punto 1 cubre toda la demo.

### 2.2 Crear la aplicación en Mercado Pago

1. Entra a <https://www.mercadopago.com.co/developers/panel/app> y crea una aplicación.
2. En **Credenciales de prueba** copia el **Access Token** (empieza por `APP_USR-` o
   `TEST-`).
3. En **Cuentas de prueba** crea un usuario comprador; con ese usuario iniciarás sesión en
   el checkout de prueba.

### 2.3 Configurar las variables (solo en tu máquina)

```bash
cd firebase/functions
copy .env.example .env
```

Edita `firebase/functions/.env`:

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...        # credencial de PRUEBA
MERCADO_PAGO_SANDBOX=true
```

`firebase/functions/.env` está en `.gitignore`: **no se sube al repositorio**.

### 2.4 Desplegar

```bash
cd firebase
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Al terminar tendrás estas URLs:

- `https://us-central1-uberclone-7afa6.cloudfunctions.net/createPaymentPreference`
- `https://us-central1-uberclone-7afa6.cloudfunctions.net/mercadoPagoWebhook`
- `https://us-central1-uberclone-7afa6.cloudfunctions.net/paymentReturn`

### 2.5 Configurar el webhook

En el panel de la aplicación → **Webhooks**:

- **URL de producción:** `https://us-central1-uberclone-7afa6.cloudfunctions.net/mercadoPagoWebhook`
- **Evento:** *Pagos* (`payment`).
- Copia la **firma secreta** y agrégala al `.env`:

```env
MERCADO_PAGO_WEBHOOK_SECRET=...
```

Vuelve a desplegar (`firebase deploy --only functions`). Si dejas la firma vacía el webhook
funciona, pero no valida el origen.

### 2.6 Cambiar la app al pago real

El servicio `startMercadoPagoCheckout` de `mobile/src/services/paymentService.js` ya abre el
checkout. Para usarlo hay que:

1. Ofrecer `PAYMENT_METHOD.MERCADO_PAGO` en `PAYMENT_METHOD_OPTIONS`
   (`mobile/src/utils/payments.js`).
2. Llamar `startMercadoPagoCheckout` en lugar de `payWithTestCard` desde el hook del
   pasajero.

Con eso, el botón abre el navegador y el webhook marca el viaje como `paid`.

### Seguridad implementada

- El **access token** vive únicamente en `firebase/functions/.env` (ignorado por git).
- La tarifa se **recalcula en el servidor** con la misma lógica del móvil
  (`mobile/scripts/pricing.test.mjs` verifica que coincidan).
- El webhook **valida la firma HMAC** (`x-signature`) y que el monto pagado coincida con
  la tarifa + propina.
- Las reglas de Firestore impiden que la app escriba `paymentStatus`, `paymentId`,
  `paidAt` o `paymentPreferenceId` en viajes con tarjeta real; solo el Admin SDK (webhook)
  puede hacerlo. En modo prueba, la escritura se limita al pasajero dueño y a los dos
  resultados permitidos.
- El pago es idempotente: si el viaje ya está pagado, la función responde `alreadyPaid`.
