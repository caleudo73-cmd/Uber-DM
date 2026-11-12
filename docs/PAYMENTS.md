# Pagos con Mercado Pago (modo prueba)

El cobro con tarjeta usa **Checkout Pro**: la app pide una preferencia a una Cloud
Function, abre el checkout en el navegador del teléfono y el pago se confirma por
**webhook**. La app nunca ve ni guarda el token de Mercado Pago.

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

## 1. Activar el plan Blaze

Cloud Functions requiere el plan **Blaze**. En la consola de Firebase:

1. ⚙️ **Uso y facturación** → **Modificar plan** → **Blaze**.
2. Agrega una tarjeta. La capa gratuita cubre 2 millones de invocaciones y 400 000
   GB-segundos al mes; para este proyecto el costo esperado es $0.

## 2. Crear la aplicación en Mercado Pago

1. Entra a <https://www.mercadopago.com.co/developers/panel/app> y crea una aplicación.
2. En **Credenciales de prueba** copia el **Access Token** (empieza por `APP_USR-` o
   `TEST-`).
3. En **Cuentas de prueba** crea un usuario comprador; con ese usuario iniciarás sesión
   en el checkout de prueba.

## 3. Configurar las variables (solo en tu máquina)

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

## 4. Desplegar

```bash
cd firebase
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Al terminar tendrás estas URLs:

- `https://us-central1-uberclone-7afa6.cloudfunctions.net/createPaymentPreference`
- `https://us-central1-uberclone-7afa6.cloudfunctions.net/mercadoPagoWebhook`
- `https://us-central1-uberclone-7afa6.cloudfunctions.net/paymentReturn`

## 5. Configurar el webhook

En el panel de la aplicación → **Webhooks**:

- **URL de producción:** `https://us-central1-uberclone-7afa6.cloudfunctions.net/mercadoPagoWebhook`
- **Evento:** *Pagos* (`payment`).
- Copia la **firma secreta** y agrégala al `.env`:

```env
MERCADO_PAGO_WEBHOOK_SECRET=...
```

Vuelve a desplegar (`firebase deploy --only functions`). Si dejas la firma vacía el
webhook funciona, pero no valida el origen.

## 6. Probar en la app

1. Inicia sesión como pasajero y pide un viaje eligiendo **Mercado Pago**.
2. El conductor acepta, recoge y finaliza el viaje.
3. En la app del pasajero aparece **Pagar con Mercado Pago**. Al tocarlo se abre el
   checkout en el navegador.
4. Paga con el usuario de prueba y una tarjeta de prueba de Mercado Pago.
5. El webhook marca el viaje como `paid` y la app se actualiza sola por `onSnapshot`.

## Seguridad implementada

- El **access token** vive únicamente en `firebase/functions/.env` (ignorado por git).
- La tarifa se **recalcula en el servidor** con la misma lógica del móvil
  (`mobile/scripts/pricing.test.mjs` verifica que coincidan).
- El webhook **valida la firma HMAC** (`x-signature`) y que el monto pagado coincida con
  la tarifa + propina.
- Las reglas de Firestore impiden que la app escriba `paymentStatus`, `paymentId`,
  `paidAt` o `paymentPreferenceId` en viajes con tarjeta; solo el Admin SDK (webhook)
  puede hacerlo.
- El pago es idempotente: si el viaje ya está pagado, la función responde `alreadyPaid`.

## Pasar a producción

1. Credenciales de producción en el `.env`.
2. `MERCADO_PAGO_SANDBOX=false`.
3. Configura el webhook con la URL pública y su firma secreta.
4. Redeploy de las funciones.
