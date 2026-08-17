# ARCHITECTURE.md — Arquitectura de SAVAYA Tienda

> Última actualización: 2026-08-15
> Aplica a: `savaya-tienda-nueva`

---

## 1. Flujos principales (request → response)

### 1.1 Página de producto (PDP)

```
Browser GET /producto/[slug]
  │
  ├─► Next.js App Router (app/producto/[slug]/page.tsx)
  │     └─► Server Component (no hay "use client" en la página raíz)
  │
  ├─► catalog/actions.ts → getProductBySlug(slug)
  │     └─► catalog/service.ts → valida slug, chequea publicado/activo
  │           └─► catalog/repository.ts → query Drizzle: productos + variantes + media + categoría
  │                 └─► Supabase Postgres (conexión directa, DATABASE_URL)
  │
  ├─► exchange-rates/actions.ts → getCurrentRate()
  │     └─► exchange-rates/service.ts → lee caché en DB, fallback a última tasa válida
  │
  ├─► cms/actions.ts → getRelatedProducts(productId, categoryId)
  │
  └─► Renderizado HTML completo en servidor
        │
        ├─► ProductGallery → "use client" (swipe, zoom, thumbnails interactivos)
        ├─► ColorSelector → "use client" (selección actualiza UI de variante)
        ├─► SizeSelector → "use client" (selección, estado agotado)
        ├─► AddToCartButton → "use client" (llama server action al hacer clic)
        └─► PriceDisplay → Server Component (precio USD + equivalente Bs. calculado)

Response: HTML + streaming de partes interactivas (React 19 Suspense)
```

### 1.2 Checkout (flujo completo)

```
Browser POST (Server Action) → checkout/actions.ts → createOrder()
  │
  ├─► checkout/validators.ts → Zod: valida payload del cliente
  │     (descarta precio, total, descuento enviados por cliente — se recalculan)
  │
  ├─► checkout/service.ts → buildOrder()
  │     ├─► cart/repository.ts → lee carrito desde DB (no del cliente)
  │     ├─► catalog/repository.ts → revalida precio y stock de cada variante
  │     ├─► discounts-promotions/service.ts → valida cupón si existe
  │     ├─► shipping/service.ts → calcula costo real desde ShippingZone/ShippingRate
  │     └─► exchange-rates/service.ts → congela tasa BCV vigente (exchange_rate_snapshot)
  │
  ├─► orders/service.ts → createOrder() en transacción DB:
  │     ├─► LOCK variantes en tabla inventory (evita race condition)
  │     ├─► inventory/service.ts → reserva stock (InventoryMovement tipo RESERVED)
  │     ├─► orders/repository.ts → INSERT Order (estado: PENDING_PAYMENT)
  │     ├─► orders/repository.ts → INSERT OrderItems
  │     ├─► orders/repository.ts → INSERT OrderStatusHistory (entry inicial)
  │     └─► cart/repository.ts → limpia carrito del usuario
  │
  ├─► audit-log/service.ts → registra creación de pedido
  │
  └─► Response: { orderId, orderNumber: 'SAV-XXXXXX', status: 'PENDING_PAYMENT' }

Browser → upload comprobante (directo a Cloudinary con firma de servidor)
  └─► payment-proofs/actions.ts → getUploadSignature()
        └─► Cloudinary signed upload (carpeta savaya/private/payment-proofs, tipo private)

Browser POST → payment-proofs/actions.ts → attachProof()
  └─► payment-proofs/repository.ts → INSERT PaymentProof, asocia a Order
        └─► orders/service.ts → transición PENDING_PAYMENT → PAYMENT_UNDER_REVIEW
```

---

## 2. Dominios y responsabilidades

Cada dominio tiene una única responsabilidad. No importa el detalle interno de otro dominio — solo sus exports públicos (`actions.ts`, `service.ts`).

```
domains/
  auth/              → Autenticación: login, logout, registro, reset password, 2FA TOTP, sesiones
  users/             → Usuarios internos del sistema (admins, staff)
  roles-permissions/ → RBAC: roles, permisos granulares, asignación, verificación en servidor
  catalog/           → Productos, variantes, categorías, colecciones, media de producto
  inventory/         → Stock por variante (SKU), movimientos inmutables, reservas, alertas de stock bajo
  cart/              → Carrito persistido en DB (por usuario autenticado o por sesión de invitado)
  checkout/          → Orquesta el proceso de compra: valida, congela precios, crea pedido
  orders/            → Ciclo de vida del pedido: estados, historial, transiciones válidas/inválidas
  payment-methods/   → Métodos de pago activos: datos bancarios, instrucciones, moneda
  payment-proofs/    → Comprobantes subidos por el cliente: upload firmado Cloudinary, URL temporal
  shipping/          → Zonas, métodos, tarifas de envío; cálculo del costo por destino
  customers/         → Perfil del cliente, direcciones, historial, tags, notas (CRM)
  discounts-promotions/ → Cupones, descuentos, promociones, validación de reglas de negocio
  cms/               → Page builder: bloques de Home, banners, popups, páginas estáticas
  media/             → Integración Cloudinary: uploads firmados, transformaciones, URLs temporales
  exchange-rates/    → Abstracción ExchangeRateProvider: tasa BCV, caché, fallback, override manual
  analytics/         → AnalyticsService: GA4 y Meta Pixel/CAPI, sin llamadas directas desde componentes
  seo/               → Metadata dinámica, sitemap, robots.txt, structured data
  notifications/     → Canal de comunicación saliente: WhatsApp helpers, emails transaccionales
  audit-log/         → Registro append-only de acciones sensibles de admin
  settings/          → ApplicationSetting: configuración de la tienda editable desde admin sin deploy
```

### Regla de comunicación entre dominios

Un dominio solo puede importar de otro dominio a través de sus exports públicos (`actions.ts` o funciones exportadas de `service.ts`). Nunca importar directamente desde `repository.ts` de otro dominio. El `service.ts` de un dominio no importa nada de `app/`.

Ejemplo correcto:
```ts
// En checkout/service.ts
import { getCurrentRate } from '@/domains/exchange-rates/service'
import { validateCoupon } from '@/domains/discounts-promotions/service'
```

Ejemplo incorrecto:
```ts
// PROHIBIDO — viola el encapsulamiento del dominio
import { exchangeRatesRepository } from '@/domains/exchange-rates/repository'
```

---

## 3. Capas de la aplicación

```
app/[ruta]/page.tsx          → Capa de routing. Composición de Server Components.
                                Sin lógica de negocio. Llama a actions.ts del dominio.
        │
        ▼
domains/*/actions.ts         → Entry point del dominio hacia el exterior.
                                Server Actions o Route Handlers. Valida con Zod.
                                Verifica autenticación y permisos (nunca ocultar en cliente).
                                Llama al service.
        │
        ▼
domains/*/service.ts         → Lógica de negocio y reglas de dominio.
                                Orquesta llamadas a repositories.
                                Nunca importa de app/ ni de UI.
                                Aquí viven invariantes: máquina de estados, reglas de stock, etc.
        │
        ▼
domains/*/repository.ts      → Queries Drizzle. Solo acceso a DB.
                                Sin lógica de negocio.
                                Parametrizado — nunca SQL concatenado.
        │
        ▼
Supabase PostgreSQL           → Fuente de verdad. Integridad referencial en DB.
```

---

## 4. Decisiones de rendering

### Server Components (por defecto)

Todo lo que no necesite interactividad del lado del cliente es un Server Component. En SAVAYA esto incluye:

- Páginas de catálogo (`app/(shop)/[categoria]/page.tsx`) — leer productos, filtrar en servidor, SSR con `revalidate`
- PDP — precio, variantes, descripción, metadata SEO
- PriceDisplay — precio en USD + equivalente en Bs. (la tasa viene del servidor)
- Breadcrumb, Footer, AnnouncementBar
- Todo el layout del admin donde no hay estado interactivo
- Dashboard de admin (KPI cards, tablas de pedidos) — datos del servidor, sin estado en cliente

Ventaja: cero bundle de JS para estas partes → LCP y INP mejoran.

### Client Components (`use client`)

Solo cuando hay interactividad que requiere estado local o APIs de browser:

| Componente | Razón |
|---|---|
| `ProductGallery` | Swipe, zoom, thumbnails — eventos de touch/mouse |
| `ColorSelector` / `SizeSelector` | Estado de selección que actualiza la variante activa en UI |
| `AddToCartButton` | Llama server action + feedback inmediato (toast, animación) |
| `CartDrawer` | Estado abierto/cerrado (Zustand), animaciones |
| `SearchBar` | Debounce, autocompletado, historial en localStorage |
| `FilterSidebar` / `FilterBottomSheet` | Estado de filtros activos, URL sync |
| `CheckoutStepper` | Navegación multi-paso, estado del paso actual |
| `PaymentMethodSelector` | Estado de selección, campos dinámicos por método |
| `UploadProof` | File input, drag/drop, progress |
| `Toast` / `BottomSheet` / `Modal` | Estado de visibilidad |
| `AdminDataTable` | Ordenamiento, paginación local, selección de filas |

### Regla de `use client`

Antes de agregar `use client`, responder: ¿este componente necesita estado de browser o eventos del usuario? Si la respuesta es "no, solo muestra datos", debe ser Server Component. Si necesita interactividad pero sus datos pueden cargarse en el servidor, usar el patrón Server Component padre → Client Component hijo con props.

---

## 5. Flujo de estado

### Estado efímero en cliente (Zustand)

Solo para estado de UI que no tiene consecuencias de negocio:

```ts
// store/ui.ts — lo que puede vivir en Zustand
{
  cartDrawerOpen: boolean,
  searchOpen: boolean,
  mobileMenuOpen: boolean,
  activeFilters: FilterState,  // mientras el usuario manipula — se sincroniza a URL al aplicar
}
```

**No va en Zustand:** precio, stock, total, descuento, estado del pedido, datos del usuario, permisos. Todo eso viene del servidor y se pasa como props o se lee con Server Components.

### Estado crítico en servidor

El carrito no vive en `localStorage`. Vive en la tabla `Cart` / `CartItem` de la DB, asociado al `userId` (usuario autenticado) o a una `sessionId` de invitado. Cada vez que se agrega/modifica/quita un item, el servidor recalcula el total y revalida el stock.

El estado del pedido (`Order.status`) solo puede cambiar vía transiciones validadas en `orders/service.ts`. Ningún componente cliente puede escribir directamente el estado de un pedido.

---

## 6. Manejo de errores

### error.tsx por segmento de ruta

```
app/
  error.tsx                  → Error global del storefront (fallback)
  (shop)/
    error.tsx                → Errores en páginas públicas de la tienda
    producto/[slug]/
      error.tsx              → Error específico de PDP (producto no encontrado, etc.)
  admin/
    error.tsx                → Error del panel admin
    pedidos/
      error.tsx              → Error en la sección de pedidos
```

Cada `error.tsx` recibe el error y lo reporta a Sentry (`captureException`). Muestra un estado de error diseñado (componente `ErrorState` del design system), no un stack trace.

### Errores de Server Actions tipados con Zod

Las server actions no lanzan excepciones arbitrarias hacia el cliente. Devuelven un discriminated union tipado:

```ts
// Patrón estándar para todas las actions de SAVAYA
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// Uso en action
export async function createOrder(input: unknown): Promise<ActionResult<Order>> {
  const parsed = CreateOrderSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }
  // ...
}
```

El cliente solo necesita chequear `result.success` — nunca hay que parsear strings de error arbitrarios.

### Errores de negocio vs. errores técnicos

- **Errores de negocio** (stock insuficiente, cupón inválido, variante no disponible): se devuelven como `{ success: false, error: '...' }` con mensaje legible para el usuario.
- **Errores técnicos** (falla de DB, timeout de API externa): se capturan en el service, se reportan a Sentry, y se devuelve un mensaje genérico al usuario. El detalle técnico nunca se expone al cliente.
