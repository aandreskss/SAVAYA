# PAYMENTS-VENEZUELA.md — Flujo de pagos venezolano de SAVAYA

> Última actualización: 2026-08-15
> Este es el documento más crítico de negocio. La implementación es la Fase 3.6.

---

## 1. Flujo general

```
Cliente confirma carrito
  └─► Checkout paso 1: datos personales (nombre, apellido, email, WhatsApp)
  └─► Checkout paso 2: método de entrega (delivery / envío nacional / retiro)
  └─► Checkout paso 3: selección de método de pago
        └─► Se muestran instrucciones específicas del método
        └─► Cliente declara referencia, monto, fecha, titular, banco/teléfono
        └─► Cliente sube comprobante (imagen o PDF) — upload firmado a Cloudinary privado
  └─► Checkout paso 4: confirmación — estado PENDING_PAYMENT
        └─► Número de pedido SAV-XXXXXX
        └─► Opción "Enviar por WhatsApp" (mensaje prellenado, wa.me, no automático)

Admin recibe notificación de pedido con comprobante pendiente
  └─► Panel de verificación: datos del pedido + comprobante ampliable
  └─► Acción: Aprobar pago → Order pasa a PAYMENT_UNDER_REVIEW → PAID
        └─► Dispara evento `purchase` en AnalyticsService
        └─► Notificación al cliente (email)
  └─► Acción: Rechazar pago → Order pasa a PAYMENT_REJECTED (motivo obligatorio)
        └─► Cliente recibe notificación con motivo
        └─► Cliente puede reintentar: Order vuelve a PENDING_PAYMENT
  └─► Acción: Solicitar información adicional → notificación al cliente
```

---

## 2. Métodos de pago activos

Los métodos se configuran en la tabla `PaymentMethod` de la DB, editables desde el admin. **No están hardcodeados en el código.** Si el negocio quiere desactivar un método o cambiar los datos bancarios, lo hace desde el admin sin deploy.

| Método | Moneda | Datos que el negocio proporciona al cliente | Datos que el cliente declara |
|---|---|---|---|
| **Zelle** | USD | Email o teléfono del titular + nombre | Email o teléfono usado, nombre del titular, referencia de confirmación |
| **Pago Móvil** | Bs. | Banco, teléfono, CI/RIF del receptor | Banco origen del cliente, teléfono desde el que pagó, CI del cliente, referencia |
| **Transferencia bancaria** | Bs. | Banco, tipo de cuenta, número de cuenta, titular, CI/RIF | Banco origen, número de cuenta destino confirmado, titular, referencia |
| **USDT TRC20** | USD | Dirección de wallet | Hash de transacción, monto en USDT |
| **Binance Pay** | USD | Pay ID | ID de orden Binance o captura de confirmación |
| **Efectivo** | USD o Bs. | Dirección de la tienda (CC Multi Tienda God is Good, local A-4, Valencia) | Solo para retiro en tienda — no requiere comprobante previo |

Los campos del formulario del paso 3 son dinámicos según el método seleccionado — no hay un formulario genérico con campos que no aplican a todos.

---

## 3. Reservas parciales (adelantos)

El cliente puede pagar un porcentaje del total como adelanto. El saldo se paga contra entrega.

- **Porcentajes disponibles:** configurables en `ApplicationSetting.reserva_parcial_porcentajes` — valor por defecto del seed: `[20, 35, 50]`
- **No hardcodeados:** si el negocio quiere agregar 25% o eliminar el 35%, lo hace desde el admin en `ApplicationSetting` sin tocar código
- **El mínimo de reserva:** el cliente puede elegir pagar el 100% también — la opción de reserva parcial es adicional, no obligatoria
- **La lógica de cálculo** (montos de adelanto y saldo) se calcula en servidor, nunca en cliente

---

## 4. Tasa de cambio y equivalencia en bolívares

- **Precio de referencia:** siempre USD
- **Equivalencia en Bs.:** calculada en tiempo real usando `ExchangeRateProvider` y mostrada al cliente durante el checkout
- **Congelamiento de tasa:** al crear el pedido (`createOrder`), la tasa vigente en ese momento se guarda en `Order.exchange_rate_snapshot`. Este valor es inmutable — no se recalcula después silenciosamente aunque la tasa BCV cambie
- **El monto en Bs. que el cliente pagó** queda registrado en `Payment.amount_bs` junto con la tasa usada
- **Política USDT:** [PENDIENTE — el negocio debe definir si 1 USDT = 1 USD o si aplica un spread. Mientras no esté definido, el sistema usa 1:1 como valor por defecto temporal pero el campo `usdt_rate_policy` en `ApplicationSetting` debe configurarse explícitamente antes de habilitar el método en producción]

---

## 5. Reserva de inventario

Al crear el pedido en estado `PENDING_PAYMENT`, el stock de cada variante se reserva temporalmente para evitar que otro cliente compre las mismas unidades mientras el primero está esperando que aprueben su pago.

- **Duración de la reserva:** configurable en `ApplicationSetting.reserva_inventario_horas` — valor por defecto del seed: `24` horas. No es una constante en el código — si el negocio quiere cambiarlo a 48h, lo hace desde el admin
- **Implementación:** al crear el pedido, se inserta un `InventoryMovement` de tipo `RESERVED` para cada variante. El stock disponible visible en el storefront descuenta las unidades reservadas
- **Expiración:** un cron de Vercel (`/api/cron/expire-reservations`) corre cada hora. Para cada pedido en `PENDING_PAYMENT` cuya reserva ya expiró:
  1. Inserta `InventoryMovement` tipo `RESERVATION_EXPIRED` para liberar el stock
  2. Transiciona el pedido a `CANCELLED`
  3. Registra en `OrderStatusHistory` y `AuditLog`
  4. Notifica al cliente que su reserva expiró
- **Race condition:** la reserva inicial usa un `SELECT ... FOR UPDATE` en la misma transacción que verifica el stock — no hay window entre el check y el write

---

## 6. Máquina de estados del pedido

Las transiciones son explícitas en `orders/service.ts`. No hay switch case suelto — hay una tabla de transiciones válidas que el servicio verifica antes de ejecutar cualquier cambio de estado.

```
PENDING_PAYMENT
  ├─► CANCELLED         (expiración de reserva por cron, o cancelación manual por admin)
  └─► PAYMENT_UNDER_REVIEW  (cliente sube comprobante)

PAYMENT_UNDER_REVIEW
  ├─► PAID              (admin aprueba — acción de alto riesgo con reautenticación)
  └─► PAYMENT_REJECTED  (admin rechaza — motivo obligatorio)

PAYMENT_REJECTED
  └─► PENDING_PAYMENT   (cliente corrige y reintenta — sube nuevo comprobante)

PAID
  ├─► PREPARING         (admin marca el pedido en preparación)
  └─► REFUNDED          (excepcional — acción de alto riesgo con reautenticación y motivo)

PREPARING
  └─► SHIPPED           (admin registra envío con datos de seguimiento)

SHIPPED
  └─► DELIVERED         (admin o cliente confirman entrega)

DELIVERED  [estado terminal]
CANCELLED  [estado terminal]
REFUNDED   [estado terminal]
```

### Transiciones inválidas (rechazadas con error explícito)

Estas transiciones son técnicamente posibles si se llama la API directamente pero deben ser rechazadas por el servicio:

| Intento inválido | Error |
|---|---|
| `PAID` → `PENDING_PAYMENT` | "Un pedido pagado no puede volver a pendiente" |
| `DELIVERED` → cualquier estado anterior | "Un pedido entregado no puede revertirse" |
| `CANCELLED` → cualquier estado activo | "Un pedido cancelado no puede reactivarse" |
| `REFUNDED` → cualquier estado activo | "Un pedido reembolsado no puede reactivarse" |
| `PENDING_PAYMENT` → `PAID` | "Un pedido pendiente no puede aprobarse directamente — debe revisarse el comprobante primero" |

```ts
// Tabla de transiciones en orders/service.ts
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAYMENT_UNDER_REVIEW', 'CANCELLED'],
  PAYMENT_UNDER_REVIEW: ['PAID', 'PAYMENT_REJECTED'],
  PAYMENT_REJECTED: ['PENDING_PAYMENT'],
  PAID: ['PREPARING', 'REFUNDED'],
  PREPARING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}
```

---

## 7. AuditLog en transiciones de pago

Cada transición de `PAYMENT_UNDER_REVIEW` hacia `PAID` o `PAYMENT_REJECTED` se registra en `AuditLog` con:

| Campo | Valor |
|---|---|
| `actor_id` | ID del admin que ejecutó la acción |
| `actor_email` | Email del admin (denormalizado) |
| `action` | `orders:approve_payment` o `orders:reject_payment` |
| `entity_type` | `Order` |
| `entity_id` | ID del pedido |
| `before` | `{ status: 'PAYMENT_UNDER_REVIEW', payment_proof_id: '...' }` |
| `after` | `{ status: 'PAID' }` o `{ status: 'PAYMENT_REJECTED', rejection_reason: '...' }` |
| `ip_address` | IP del admin al momento de la acción |
| `created_at` | Timestamp con timezone |

El motivo de rechazo es **obligatorio** — el sistema no permite ejecutar `rejectPayment()` sin un campo `reason` no vacío.

---

## 8. Comprobante de pago — seguridad

Ver `docs/SECURITY.md` sección 7 para el detalle completo. Resumen:

- Carpeta privada Cloudinary `savaya/private/payment-proofs`
- Upload firmado con expiración de 5 minutos
- Nombre de archivo no predecible: `proof-{orderId}-{uuid}`
- URL firmada temporal de 15 minutos para visualización en el admin
- Solo admins con permiso `orders:view_payment_proof` pueden solicitar la URL firmada

---

## 9. Idempotencia del checkout

Si el cliente hace doble submit (doble clic en "Confirmar pedido"), el sistema no debe crear dos pedidos idénticos.

Implementación:
1. Al cargar el paso de confirmación, el servidor genera un `idempotency_key` único para esa sesión de checkout
2. La key se guarda en la tabla `Cart` del usuario como campo `idempotency_key`
3. Al llamar `createOrder()`, el server action verifica si ya existe un pedido con esa key
4. Si existe → devuelve el pedido existente (idempotente)
5. Si no existe → crea el pedido y asocia la key
6. La key expira o se limpia una vez que el pedido se confirma exitosamente

---

## 10. Crons de Vercel relacionados con pagos

| Cron | Ruta | Frecuencia | Protección |
|---|---|---|---|
| Expiración de reservas de inventario | `/api/cron/expire-reservations` | Cada hora | Header `x-cron-secret: {CRON_SECRET}` |
| Limpieza de comprobantes sin pedido (Cloudinary) | `/api/cron/cleanup-proofs` | Cada 24 horas | Header `x-cron-secret: {CRON_SECRET}` |

Los crons están protegidos por el header `x-cron-secret` cuyo valor viene de la env var `CRON_SECRET`. Vercel Cron Jobs puede configurarse para enviar este header automáticamente.
