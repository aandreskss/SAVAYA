# ANALYTICS.md — Analytics de SAVAYA

> Última actualización: 2026-08-15
> La implementación es la Fase 5.3 (GA4) y 5.4 (Meta Pixel + CAPI).

---

## 1. AnalyticsService — capa única de abstracción

**Ningún componente llama a `gtag()` ni a `fbq()` directamente.** Toda interacción con proveedores de analytics pasa por `domains/analytics/service.ts`.

```
Componente / Server Action
  └─► analytics/service.ts → trackEvent(eventName, payload)
        ├─► ga4/adapter.ts → mapea a evento GA4 y llama gtag()
        └─► meta/adapter.ts → mapea a evento Meta y llama fbq() + Conversions API
```

El resto del código de la app nunca sabe si hay GA4, Meta, o ambos. Si se agrega un nuevo proveedor en el futuro (TikTok Pixel, etc.), se crea un nuevo adaptador sin tocar ningún componente.

### Interfaz pública del AnalyticsService

```ts
// domains/analytics/service.ts
trackEvent(event: SavayaAnalyticsEvent): void
trackServerEvent(event: SavayaAnalyticsEvent, context: ServerContext): Promise<void>
```

`SavayaAnalyticsEvent` es un discriminated union de todos los eventos definidos — type-safe, sin strings arbitrarios.

---

## 2. Eventos de ecommerce

### Eventos del storefront (browser)

| Evento interno | Equivalente GA4 | Equivalente Meta | Cuándo se dispara |
|---|---|---|---|
| `view_item_list` | `view_item_list` | `ViewContent` (lista) | Al cargar un PLP con productos visibles |
| `select_item` | `select_item` | — | Al hacer clic en un ProductCard |
| `view_item` | `view_item` | `ViewContent` (producto) | Al cargar un PDP |
| `add_to_wishlist` | `add_to_wishlist` | `AddToWishlist` | Al guardar en favoritos |
| `add_to_cart` | `add_to_cart` | `AddToCart` | Al agregar variante al carrito |
| `view_cart` | `view_cart` | — | Al abrir el drawer del carrito o la página /carrito |
| `remove_from_cart` | `remove_from_cart` | — | Al quitar un item del carrito |
| `begin_checkout` | `begin_checkout` | `InitiateCheckout` | Al ir al paso 1 del checkout |
| `add_shipping_info` | `add_shipping_info` | — | Al confirmar el paso de entrega (paso 2) |
| `add_payment_info` | `add_payment_info` | — | Al confirmar el método de pago (paso 3) |

### Evento `purchase` — regla crítica

`purchase` (GA4) y `Purchase` (Meta) **se disparan cuando el pedido pasa al estado `PAID`**, que ocurre cuando un admin aprueba el comprobante de pago.

**NUNCA se dispara:**
- Cuando el cliente sube el comprobante (`PAYMENT_UNDER_REVIEW`)
- Cuando el cliente crea el pedido (`PENDING_PAYMENT`)
- Al llegar a la pantalla de confirmación del checkout

Este evento se dispara desde el servidor (server action de aprobación de pago), no desde el browser — para garantizar que representa una venta real, no una intención.

```ts
// En orders/actions.ts → approvePayment()
await orders/service.approvePayment(orderId, actorId)
// Después de la transición exitosa a PAID:
await analyticsService.trackServerEvent({
  type: 'purchase',
  orderId,
  orderNumber,
  total,
  currency: 'USD',
  items: orderItems,
  paymentMethod,
}, serverContext)
```

---

## 3. GA4

- **ID:** configurado en `NEXT_PUBLIC_GA4_ID` (env var) — el ID específico de SAVAYA se configura en Vercel, no en el código
- **Script:** inyectado en `app/layout.tsx` via `next/script` con `strategy="afterInteractive"`
- **Parámetros de ecommerce estándar:** todos los eventos de lista/producto incluyen los parámetros GA4 estándar (`item_id`, `item_name`, `item_category`, `item_variant`, `price`, `currency`, `quantity`, `item_list_name`)
- **Currency:** siempre `USD` (el precio de referencia de SAVAYA)
- **User ID:** si el usuario está autenticado, se manda `user_id` anonimizado (hash del customer_id) — nunca email ni datos PII

---

## 4. Meta Pixel + Conversions API

### Pixel

- **ID:** `27355395054120748` — Pixel propio de Savaya, activo actualmente en el proyecto `campanas/`
- **Script:** inyectado en `app/layout.tsx` con `nonce` (no `'unsafe-inline'` genérico en CSP)
- **Eventos browser:** `fbq()` llamado solo desde `meta/adapter.ts`, nunca directamente desde componentes
- **fbclid y fbp:** capturados en la URL al llegar desde un anuncio de Meta, guardados en el pedido para atribución post-compra

### Conversions API (CAPI) — servidor

- **Token:** `META_CAPI_ACCESS_TOKEN` — solo disponible en servidor, nunca expuesto al cliente
- **Deduplicación:** cada evento tiene un `event_id` único generado por el servidor antes de que el browser lo dispare. El mismo `event_id` se usa tanto en el evento de browser (`fbq('track', ..., { eventID: id })`) como en el evento de CAPI. Meta usa el `event_id` para deduplicar y no contar el mismo evento dos veces
- **Eventos que van por CAPI además del browser:** `Purchase`, `AddToCart`, `ViewContent` — los de más valor para la optimización de campañas
- **Datos del evento CAPI:** IP del cliente (hasheada), User Agent, fbp, fbc, email del cliente (hasheado con SHA256 si existe) — nunca en texto plano

```ts
// Ejemplo de deduplicación en meta/adapter.ts
const eventId = generateUUID() // Generado en servidor antes del response

// Se manda al browser (en el response para que el cliente lo use):
res.headers.set('X-Meta-Event-Id', eventId)

// Se manda a CAPI directamente (server → Meta):
await sendToConversionsAPI({ eventId, ... })

// El browser usa el eventId del header para fbq():
fbq('track', 'AddToCart', payload, { eventID: eventId })
```

---

## 5. UTM y fbclid — atribución post-compra

Al llegar a la tienda con parámetros de campaña, se capturan y se guardan en el pedido:

| Parámetro | Guardado en |
|---|---|
| `utm_source` | `Order.attribution_source` |
| `utm_medium` | `Order.attribution_medium` |
| `utm_campaign` | `Order.attribution_campaign` |
| `fbclid` | `Order.fbclid` (para CAPI post-compra) |

La captura se hace en el primer paso del checkout (Datos), donde se lee de `sessionStorage` o de la URL actual si viene directo. No se requiere cuenta — se guarda en la sesión del carrito hasta que se crea el pedido.

Estos datos permiten al equipo de marketing ver en el admin qué campaña generó cada pedido real (estado PAID), no solo cada intento de checkout.

---

## 6. Vercel Analytics y Speed Insights

- **Vercel Analytics:** activado para tráfico real de usuarios (page views, unique visitors) — complementa GA4 sin duplicar la función
- **Vercel Speed Insights:** activado para monitoreo de Core Web Vitals en usuarios reales de producción — complementa los tests de Lighthouse que son laboratorio

Ambos se configuran con los componentes de `@vercel/analytics` y `@vercel/speed-insights` en `app/layout.tsx`. No requieren configuración adicional una vez vinculado el proyecto en Vercel.

---

## 7. Privacidad y consentimiento

[PENDIENTE: el negocio debe definir si implementa un banner de cookies/consentimiento. Venezuela no tiene una ley de protección de datos equivalente a GDPR, pero si hay clientes de la UE (poco probable dado el mercado) aplicaría. Por defecto se implementa analytics sin bloqueo de consentimiento previo, con aviso en la política de privacidad. Si el equipo decide agregar consentimiento explícito, el AnalyticsService tiene un método `setConsent(granted: boolean)` que puede activarse después sin refactoring.]
