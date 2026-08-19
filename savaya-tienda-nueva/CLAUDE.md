# CLAUDE.md — Reglas persistentes del repo SAVAYA

> Este archivo lo lee Claude Code automáticamente al abrir este repo. Contiene las reglas que **aplican siempre**, en toda fase y todo prompt, para no tener que repetirlas cada vez. Los prompts de `/docs/PROJECT-PLAN.md` asumen que este archivo ya existe y solo agregan el alcance específico de cada paso.

## 0. Identidad del proyecto

SAVAYA es una marca venezolana de calzado (Carabobo) migrando de venta mayorista/redes sociales a un canal B2C propio de alto nivel. Este repo (`savaya-tienda-nueva`) es una reconstrucción **desde cero**, en paralelo al repo `savaya-tienda` (versión anterior, en producción). **Nunca borres, sobrescribas ni toques `savaya-tienda`.** Este repo no depende de él para nada; a lo sumo se audita para decidir qué reutilizar (ver Fase 0).

## 1. No negociables (rechaza cualquier atajo que los viole)

- Cero código duplicado, funciones/componentes duplicados, CSS duplicado, lógica de negocio duplicada.
- Cero componentes "para salir del paso". Cero código muerto, imports sin usar, archivos abandonados.
- Cero `any` salvo justificación explícita en comentario.
- Cero lógica crítica (precio, stock, descuento, total, rol, permisos) resuelta únicamente en frontend. El servidor **siempre** recalcula y es la única fuente de verdad.
- Cero secretos hardcodeados. Todo va en `.env.local` / variables de entorno del hosting, nunca en Git. Mantén `.env.example` actualizado sin valores reales.
- Cero dependencia nueva sin justificar: ¿hace falta?, ¿está mantenida?, ¿tamaño?, ¿vulnerabilidades conocidas?, ¿se puede resolver limpio sin paquete? Si la respuesta no es clara, no la instales.
- No sobrearquitectuar: nada de microservicios, event sourcing, ni 40 abstracciones para un CRUD. Arquitectura limpia y comprensible > arquitectura "impresionante".
- No repitas una solución a un problema ya resuelto: reutiliza o refactoriza, no clones.

## 2. Stack (decidido — no lo cambies sin ADR nuevo)

- **Next.js 16** (App Router) + **React 19.2** + **TypeScript strict** (`strict: true`, sin `any` implícito).
- **Tailwind CSS v4**, todo el diseño vía **design tokens** (ver `docs/UX-UI.md` / Fase 2), nunca valores mágicos sueltos.
- **PostgreSQL vía Neon** — migrado de Supabase en 2026-08-17. Driver: `@neondatabase/serverless` + `drizzle-orm/neon-http`. Usa HTTP por request (stateless), sin pool de conexiones TCP — ideal para serverless/Vercel sin los límites de PgBouncer. `DATABASE_URL` en `.env.local` y en Vercel apunta a Neon. No hay `DIRECT_URL` — una sola variable. Decisión documentada en `docs/adr/002-database.md`.
- **Drizzle ORM** (TypeScript-first, SQL explícito, mejor rendimiento en serverless/edge que Prisma, migraciones con `drizzle-kit`). `db` exportado desde `src/shared/lib/db.ts`; helper `rawQuery<T>(sql)` wrappea `db.execute()` devolviendo `rows as T[]` (el driver neon-http devuelve `{ rows, command, fields }` — no un array directo). Todas las queries raw usan `rawQuery<T>` en vez de `db.execute()` directamente. Justificación completa en `docs/adr/002-orm.md`.
  - **⚠️ CRÍTICO — neon-http NO soporta transacciones**: `db.transaction()` lanza "No transactions support in neon-http driver" en runtime. `SELECT ... FOR UPDATE` tampoco funciona. **Nunca uses estas construcciones.** El patrón correcto es: operaciones secuenciales `await` + `UPDATE ... WHERE condición_atómica` para concurrencia (ej.: `UPDATE inventory SET reserved = reserved + N WHERE (quantity - reserved) >= N`). Si el UPDATE no afecta filas → deshacer manualmente las operaciones anteriores. Este patrón reemplaza `db.transaction()` + `FOR UPDATE` en TODO el codebase.
- **Auth.js (NextAuth v5)** con credentials + verificación por email; sesiones en cookies `HttpOnly`, `Secure`, `SameSite=Lax`; reautenticación obligatoria para acciones admin sensibles; **2FA (TOTP)** obligatorio para roles Admin/Super Admin. Los usuarios de `savaya-tienda` (Supabase Auth) no se migran — se descartan. La nueva tienda arranca con tablas de Auth.js limpias y un admin nuevo.
- **Zod** para toda validación de entrada, compartido entre client y server donde aplique.
- **Zustand** solo para estado de UI efímero (drawer del carrito abierto/cerrado, etc.) — nunca para precios/stock/totales, eso vive en servidor.
- **Cloudinary** como sistema de media: carpetas públicas (`savaya/products`, `savaya/categories`, `savaya/banners`, `savaya/editorial`, `savaya/cms`) vs. carpeta privada (`savaya/private/payment-proofs`) con upload firmado, tipo `private`/`authenticated`, URLs firmadas temporales.
- **Búsqueda**: Postgres full-text (`tsvector`) + `pg_trgm` para tolerancia a typos, detrás de una interfaz `SearchProvider` (permite migrar a Meilisearch/Algolia después sin tocar el resto del código, sin instalarlo ahora).
- **Upstash Redis + @upstash/ratelimit** para rate limiting (login, registro, checkout, upload, búsqueda, APIs públicas).
- **Tasas BCV**: abstracción `ExchangeRateProvider` (ver Fase 5.2) — nunca llamar a una API externa directamente desde un componente o ruta suelta.
- **Vitest** + Testing Library (unit/integration), **Playwright** (E2E).
- **Sentry** (errores) + Vercel Analytics/Speed Insights (performance real).
- Hosting: **Vercel** (monorepo `aandreskss/SAVAYA`, rama `main`, root directory `savaya-tienda-nueva/`). Media: **Cloudinary** (cuenta Savaya — cloud name distinto al `dckobjcbj` de Tuluoshop/savaya-tienda). DB: **Neon PostgreSQL** — endpoint `ep-round-cherry-ay3dqlqz.c-5.us-east-2.aws.neon.tech`, base `neondb`.

No uses versiones beta salvo que el estable no cubra un requisito crítico; si lo haces, documenta el motivo en un ADR.

## 3. Arquitectura por dominios

Prohibido organizar todo bajo `/components`. Estructura real:

```
src/
  app/                      # Solo rutas (App Router) — capa fina, sin lógica de negocio
  domains/
    auth/
    users/
    roles-permissions/
    catalog/                # products, variants, categories, collections
    inventory/
    cart/
    checkout/
    orders/
    payment-methods/
    payment-proofs/
    shipping/
    customers/               # + crm/
    discounts-promotions/
    cms/                      # page builder, banners, popups
    media/
    exchange-rates/
    analytics/
    seo/
    notifications/
    audit-log/
    settings/
  domains/<dominio>/
    schema.ts               # tablas Drizzle del dominio
    repository.ts            # queries puras
    service.ts               # lógica de negocio, reglas, invariantes
    actions.ts                # server actions / route handlers expuestos
    validators.ts             # esquemas Zod
    types.ts
    components/               # UI específica del dominio (si aplica)
  shared/
    ui/                        # design system: Button, Input, Badge, Card, etc.
    lib/
    config/
```

Cada dominio debe poder testearse y mantenerse sin conocer el detalle interno de otro. La lógica de negocio (`service.ts`) no debe importar nada de `app/`.

## 4. Definition of Done (aplica a toda feature, sin excepción)

Una feature está terminada solo si:

1. Funciona en el happy path **y** en los estados alternativos relevantes (loading, error, vacío, sin stock, sesión expirada, etc. — ver `docs/UX-UI.md`).
2. Es responsive validada en 390px, 768px, 1024px, 1440px.
3. Tiene validación server-side (Zod) además de cualquier validación de UI.
4. Tiene autorización verificada en servidor (nunca solo "ocultar un botón").
5. Tiene tests cuando corresponde (cálculos, permisos, transiciones de estado, stock).
6. Cero errores de TypeScript, cero errores de lint.
7. No duplica código existente.
8. No rompe accesibilidad (contraste, foco visible, labels, teclado).
9. No empeora Core Web Vitals de forma medible (LCP/INP/CLS).
10. Está documentada si introduce una decisión relevante (ADR) o cambia el modelo de datos (migración + `docs/DATABASE.md`).

Si una feature no cumple todo esto, no se marca como terminada — se dice explícitamente qué falta.

## 5. Flujo de trabajo esperado en cada prompt

```
ANALYZE → PLAN → IMPLEMENT → VALIDATE → TEST → OPTIMIZE → DOCUMENT
```

No implementes 10 cosas a la vez. Cada prompt de `docs/PROJECT-PLAN.md` tiene un alcance acotado a propósito — respétalo. Si durante el trabajo detectas que algo de una fase anterior quedó mal, no lo parches por encima: dilo, explica la causa raíz, y propone el fix antes de seguir.

## 6. Seguridad — recordatorios permanentes

- Nunca confíes en precio, total, descuento, stock, rol, `userId`, moneda o estado de pago enviados por el cliente.
- CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` configurados a nivel de `next.config` / middleware — nunca `Access-Control-Allow-Origin: *`.
- Todo query a la base de datos vía Drizzle parametrizado (nunca SQL concatenado a mano).
- Toda acción sensible de admin (aprobar pago, cambiar rol, cambiar datos bancarios, cambiar tasa) se registra en `AuditLog` con actor, acción, entidad, antes/después, fecha, IP.
- Comprobantes de pago jamás en bucket público ni con URL permanente.

## 7. Idioma y copy

Todo el copy de cara al usuario en español venezolano natural y profesional (no caricaturizado). Nombres de variables, funciones y comentarios de código en inglés (estándar de la industria), salvo términos de dominio venezolano sin traducción natural (p. ej. `pagoMovil`).

---

## 8. Credenciales de infraestructura conocidas

> Solo referencias/IDs públicos — nunca secrets aquí. Los valores reales van en `.env.local` y en Vercel.

| Servicio | Referencia |
|---|---|
| **Neon** | Endpoint `ep-round-cherry-ay3dqlqz.c-5.us-east-2.aws.neon.tech` · base `neondb` · usuario `neondb_owner` · una sola var `DATABASE_URL` (sin `DIRECT_URL`) · **cuenta:** `aandreskss@gmail.com` (Google login) |
| **Supabase** (inactivo) | Proyecto `fytegzrfsirbtyekncrn` — ya no se usa como DB principal; migrado a Neon en 2026-08-17 |
| **Cloudinary** | Cloud name `jjtrnxe0` · carpetas bajo `savaya/` · **cuenta:** `arnaldocursosautomaticos` |
| **Upstash Redis** | DB `savaya-tienda` · región `us-east-1` · `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` en `.env.local` · **cuenta:** `aandreskss@gmail.com` |
| **Meta Pixel** | `27355395054120748` (mismo que campanas) |
| **WhatsApp tienda** | `584141100100` |
| **Vercel monorepo** | `aandreskss/SAVAYA` · root `savaya-tienda-nueva/` · **cuenta:** `aandreskss` |
| **Dominio** | `www.savayavzla.com` → actualmente apunta a `campanas`; se mueve en el corte |
| **Resend** | Pendiente verificar dominio `savayavzla.com` para enviar desde `noreply@savayavzla.com` |
| **Sentry** | Pendiente crear proyecto `savaya-tienda-nueva` |

---

## 9. Estado del proyecto (actualizado 2026-08-19)

**Estado: Fases 0–9 completas + mejoras post-lanzamiento activas. Módulo de métodos de pago admin completo con Pago Móvil QR y upload Cloudinary.**

| Fase | Estado |
|---|---|
| Fase 0 — Auditoría | ✅ `docs/AUDIT.md` |
| Fase 1.1 — Scaffold | ✅ Next.js 16, Tailwind v4, Vitest, Playwright, Husky |
| Fase 1.2 — Documentación | ✅ 8 docs + 6 ADRs en `docs/` |
| Fase 1.3 — Schema | ✅ 49 tablas Drizzle, 91 índices, migraciones en `drizzle/migrations/`, seed en `src/shared/lib/seed.ts` |
| Fase 1.4 — Auth | ✅ Auth.js v5 + RBAC + 2FA TOTP + Upstash rate limiting |
| Fase 2.1 — Tokens | ✅ `@theme` en globals.css, Inter+Archivo via next/font |
| Fase 2.2 — Átomos | ✅ 23 componentes en `src/shared/ui/` |
| Fase 2.3 — Comercio | ✅ 11 componentes de comercio en `src/shared/ui/` |
| Fase 3.1 — Home/CMS | ✅ Bloques CMS en `src/domains/cms/blocks/`, renderer, fallback dev sin DB |
| Fase 3.2 — Header/Nav | ✅ Navbar SC + NavDesktop/Mobile/Actions/MobileToggle + SearchOverlay + Footer placeholder |
| Fase 3.3 — PLP | ✅ `/categoria/[slug]` + filtros + sort + paginación |
| Fase 3.4 — PDP | ✅ `/producto/[slug]` SC + galería + variantes + precio Bs. + carrito placeholder + vistos recientemente |
| Fase 3.5 — Wishlist/Carrito | ✅ CartDrawer + CartPage + CartProvider + WishlistButton |
| Fase 3.6 — Checkout venezolano | ✅ 4 pasos + reserva inventario + comprobante Cloudinary privado + cron expiry |
| Fase 3.7 — Cuenta del cliente | ✅ `/mi-cuenta` con 6 secciones + login + registro |
| Fase 3.8 — Páginas adicionales + Mayorista | ✅ 10 páginas informativas + wholesale domain + Footer + sitemap |
| Fase 3.9 — Estados de interfaz | ✅ 5 loading.tsx + shop error.tsx + middleware auth + publishedAt filter |
| Fase 4.1 — Shell del admin | ✅ AdminShell + RBAC middleware + 12 secciones + login reskinned |
| Fase 4.2 — Dashboard admin | ✅ KPIs + gráfico SVG + pagos pendientes + stock bajo + top productos + ventas por método |
| Fase 4.3 — Catálogo admin | ✅ Lista productos + editor tabs (General/Media/Variantes/SEO) + CRUD categorías + CRUD colecciones |
| Fase 4.4 — Inventario admin | ✅ Tabla inventario + MovementModal (purchase/adjustment/correction) + historial por variante + trazabilidad auditLog |
| Fase 4.5 — Pedidos admin | ✅ Tabla de pedidos + filtros + detalle completo + verificación de pagos + máquina de estados + AuditLog |
| Fase 4.6 — CRM | ✅ Lista clientes + búsqueda/filtro por tag + ficha completa (KPIs, pedidos, notas, tags, direcciones) + AuditLog |
| Fase 4.7 — CMS / Page builder | ✅ Editor de bloques home (reordenar ↑↓, toggle activo/inactivo, editar contenido por tipo) + CRUD Banners (programación por fecha) + CRUD Popups (delay, páginas, frecuencia) |
| Fase 4.8 — Promociones y descuentos | ✅ CRUD cupones admin + validación server-side en createOrder + CouponInput en carrito + checkout store coupon |
| Fase 4.9 — Delivery y zonas de envío | ✅ `src/domains/shipping/` + `DeliveryManager` (CRUD zonas/ciudades/tarifas/métodos) + `/admin/delivery` |
| Fase 4.10 — Tasas de cambio (BCV) | ✅ `ExchangeRatesManager` + override manual con AuditLog + historial 30 días + permiso `exchange_rates:override` |
| Fase 4.11 — Usuarios, roles y configuración | ✅ `UsersManager` (asignar/revocar roles) + `SettingsManager` (datos empresa, métodos de pago, SEO global) |
| **Fase 5 — Design Sync (Figma → Código)** | ✅ **5.1–5.8 completas** |
| **Fase 6 — Integraciones de producción** | ✅ **6.1–6.6 completas** |
| **Fase 7 — Hardening** | ✅ **7.1–7.4 completas** |
| **Fase 8 — QA final + Playwright E2E** | ✅ **completa** |
| **Fase 9 — Migración / Corte a producción** | ✅ **completa** |

**Tests:** 237 pasando (26 archivos de test). +53 tests en Fase 8: calculateDiscount, validateCoupon, slugify, cloudinary helpers, buildWhatsAppOrderLink, 5 suites E2E Playwright.

---

---

**Notas Fase 4.5:**
- `src/domains/admin/orders/` — repository, service, validators, actions, types + 4 componentes
- `/admin/pedidos` — tabla con filtros estado/búsqueda + paginación (Server Component + Client filters)
- `/admin/pedidos/[orderNumber]` — detalle: cliente, items, shipping, comprobante, timeline, acciones de transición
- `/admin/pagos` — cola de pagos pendientes con panel izquierdo datos + panel derecho comprobante ampliable
- `GET /api/admin/orders/proof-url?proofId=xxx` — proxy server-side de comprobantes privados de Cloudinary (nunca expone credenciales al browser)
- `approvePayment` / `rejectPayment` usan `SELECT FOR UPDATE` dentro de `db.transaction()` — imposible aprobar lo ya rechazado y viceversa
- `PaymentProofViewer`: imageUrl derivado directo de props (sin useEffect) — evita cascading setState
- `BlockSkeleton` vive en `src/app/admin/_components/DashboardSkeletons.tsx`

**Notas de implementación importantes:**
- `PermissionSlug` (no `Permission`) es el tipo string de permisos — `Permission` ya lo usa Drizzle
- Rate limiters son lazy-initialized — no crashean sin vars de Upstash en dev
- Home tiene fallback dev: si no hay `DATABASE_URL`, carga 4 bloques mock automáticamente
- `inventoryMovements.orderId` no tiene FK formal (evita dependencia circular entre dominios inventory y orders) — deuda menor documentada
- `ProductCarouselSchema`: validación cruzada `source=collection → collectionSlug requerido` no está en Zod, solo en runtime del repositorio
- Navbar es Server Component puro — `NavDesktop`, `NavMobile`, `NavActions`, `NavMobileToggle`, `SearchOverlay` son Client Components
- `useNavStore` (Zustand) gestiona estado de UI: `isMobileMenuOpen` + `isSearchOpen`
- SearchOverlay: debounce 300ms → `/api/search?q=...`; fallback mock si no hay `DATABASE_URL`
- `AnnouncementBar` sigue siendo un bloque CMS independiente — el Navbar NO lo reimplementa
- PDP: `ProductClientShell` (Client) gestiona `selectedVariantId` y conecta `ProductGallery` ↔ `ProductInfo`. La página `/producto/[slug]` es Server Component puro.
- `ExchangeRateProvider` en `src/domains/exchange-rates/service.ts` — implementado en Fase 4.10 con override manual + AuditLog (tasa fija solo en dev sin DB)
- Galería: patrón `manualIndex | variantImageIndex | 0` evita setState síncrono en effects (regla `react-hooks/set-state-in-effect`)
- `RecentlyViewed` usa cancelación con `cancelled` flag en el efecto para evitar setState en componentes desmontados
- `GET /api/products/recently-viewed?ids=...` acepta máx 8 IDs, retorna `ProductListItem[]`
- **Checkout (Fase 3.6):**
  - `useCheckoutStore` (Zustand) gestiona estado de 4 pasos — nunca precios como fuente de verdad
  - `cartId` es cookie HttpOnly — server action lo lee del cookie, el cliente nunca lo toca
  - `createOrder()` usa `SELECT ... FOR UPDATE` dentro de `db.transaction()` para evitar race conditions de stock
  - Comprobante de pago: upload firmado directo a Cloudinary privado vía `GET /api/checkout/upload-signature`
  - Si hay comprobante → orden crea en `payment_under_review`; si no (efectivo) → `pending_payment`
  - Migración `0002_checkout_order_fields.sql`: agrega `shipping_snapshot`, `reserved_until`, `payment_method_id` a orders; `metadata` + campos nullable a payment_proofs
  - Cron `GET /api/cron/expire-reservations` expira reservas de inventario — protegido por `x-cron-secret`
  - `ZodError.issues` (no `.errors`) — versión actual de Zod
  - `next.config.ts` actualizado: `images.remotePatterns` para Cloudinary + `connect-src https://api.cloudinary.com` en CSP
- **Cuenta del cliente (Fase 3.7):**
  - Auth session → `user.email` → lookup `customers` por email (sin FK directa entre `users` y `customers`)
  - Si usuario nunca ordenó, `customer` es `null` — crear lazily al primera acción (guardar dirección)
  - `getSessionCustomer()` en `src/domains/customers/service.ts` — único punto de entrada para auth en acciones de cuenta
  - Ownership de pedidos verificado en `getOrderByNumberForCustomer(orderNumber, customerId)` — `AND customerId` en la query, no solo en UI
  - Wishlist actions (`wishlist-actions.ts`) ahora usan auth real: `auth()` → customer por email
  - `loginCustomer` añadido a `src/domains/auth/actions.ts` (sin 2FA — solo clientes storefront)
  - toast store: usar `toast.success()` / `toast.error()` (no `useToast()` — no existe ese export)
  - Button: `isLoading` (no `loading`), Modal: `isOpen` (no `open`)
- **Estados de interfaz (Fase 3.9):**
  - `src/middleware.ts` protege `/admin/*` y `/mi-cuenta/*` — usa `authConfig` (Edge-safe, sin DB)
  - `/mi-cuenta` redirige a `/iniciar-sesion?redirect=<pathname>` cuando no hay sesión (middleware, no solo layout)
  - `/admin` redirige a `/admin/login` (authConfig `pages.signIn`)
  - `src/proxy.ts` es código muerto — el middleware real es `src/middleware.ts`
  - `loading.tsx` creados: `/categoria/[slug]`, `/producto/[slug]`, `/mi-cuenta`, `/mi-cuenta/pedidos`, `/checkout`
  - `src/app/(shop)/error.tsx` — error boundary del shop (más específico que el global)
  - `getProducts` y `getProductBySlug` en catalog/repository.ts filtran `publishedAt IS NULL OR publishedAt <= NOW()`
  - El array `conditions` en `getProducts` usa tipo `import('drizzle-orm').SQL[]` (acepta tanto `eq()` como `sql\`\``)
  - PLP ya tenía EmptyState para 0 resultados; SizeSelector ya tenía variantes agotadas con strikethrough
- **Admin shell (Fase 4.1):**
  - `src/types/next-auth.d.ts` — type augmentation para `session.user.roles` + `session.user.permissions`
  - `AdminShell` (Client) en `src/domains/admin/components/AdminShell.tsx` — usePathname + mobile toggle + logout
  - `AdminSidebar` (ya existía en Fase 2.3) — añadida prop `visible` para mobile overlay
  - `src/domains/admin/lib/nav.tsx` — `ADMIN_NAV` con `AdminNavItem` (extends NavItem, permission?: PermissionSlug)
  - `src/domains/admin/lib/require-permission.ts` — `requireAdminPermission(permission)` + `requireAdmin()`
  - `requireAdminPermission` redirige a `/admin?forbidden=1` si no tiene permiso (no 404 — sí está autenticado)
  - `AdminNavItem.permission` es `PermissionSlug | undefined` (no null) — `undefined` = visible a todos los admins
  - 12 layouts de sección bajo `/admin/{slug}/layout.tsx` — cada uno llama `requireAdminPermission`
  - Login page reskinned con Tailwind (misma lógica funcional de Fase 1.4)
  - `src/proxy.ts` es código muerto — el middleware real es `src/middleware.ts`
- **Dashboard admin (Fase 4.2):**
  - `src/domains/admin/dashboard/repository.ts` — 6 queries SQL via `rawQuery<Row>(sql\`...\`)`, helper `num()`/`str()` para coerciones
  - `getDashboardKPIs(start, end)` — un solo SQL con subquery para nuevos clientes
  - `getSalesChartData(start, end)` — agrupado por día en `America/Caracas`
  - `getPendingPayments()` — join paymentProofs + orders + customers + paymentMethods
  - `getLowStockItems()` — umbral 5, `quantity - reserved <= 5`
  - `getTopProducts(start, end)` — desde `order_items.product_snapshot->>'name'`
  - `getSalesByMethod(start, end)` — join orders + paymentMethods
  - `SalesLineChart` — SVG personalizado sin librería externa, tooltip via `foreignObject`
  - `DashboardSkeletons` — `KPIsSkeleton`, `ChartSkeleton`, `BlockSkeleton`
  - `PeriodSelector` — Client Component, 4 botones, `router.push('/admin?period=...')`
  - `period.ts` — `parsePeriod()`, `getPeriodBounds()`, `getPeriodLabel()`, `DashboardPeriod` union type
  - `src/app/admin/page.tsx` — Server Component, `searchParams.period` → `parsePeriod()` → bounds, `Promise.all` con los 6 queries en paralelo, bloques de presentación puros (sin Suspense individual), `forbidden=1` muestra banner de error
- **Catálogo admin (Fase 4.3):**
  - `src/shared/lib/slugify.ts` — `slugify(text)` normaliza NFD, minúsculas, solo `[a-z0-9-]`
  - `src/domains/admin/catalog/repository.ts` — `listAdminProducts` usa `db.execute(sql`...`)` con subqueries (primary image, variant count, total stock); CRUD completo products/categories/collections + AuditLog
  - `src/domains/admin/catalog/actions.ts` — 'use server', permiso desde `session.user.permissions`, Zod validate, AuditLog, revalidatePath
  - `src/app/api/admin/catalog/upload-signature/route.ts` — firma Cloudinary pública (`savaya/products`), requiere `catalog:write`
  - `ProductEditor` — Client Component, 4 tabs: General/Media/Variantes/SEO; `useTransition` para save; llama `saveProductAction` con payload completo
  - SKU autogenerado: `{3 iniciales producto}-{3 letras color}-{talla}`, editable por el usuario
  - Variantes soft-delete: variantes con ID que no están en el payload → `isActive=false`; nuevas variantes → `inventory` record con `initialStock`
  - `MediaTab`: upload firmado directo a Cloudinary → URL local mientras está nuevo, URL Cloudinary al guardar; `deleteProductMediaAction` elimina DB + llama destroy API Cloudinary
  - `BlockSkeleton` ahora acepta `title?: string` (bug pre-existente Fase 4.2 corregido)
  - `BadgeVariant` no tiene `'neutral'` — usar `'default'`
  - Sub-nav en `/admin/productos` actúa como "Productos | Categorías | Colecciones"
- **Inventario admin (Fase 4.4):**
  - `src/domains/admin/inventory/repository.ts` — `listInventory(search?)` JOIN products/colors/sizes/inventory; `getVariantDetail(variantId)`; `getVariantInventoryHistory(variantId)` (últimos 100, LEFT JOIN users para email); `applyManualMovement()` — UPDATE inventory + insert `inventory_movements` + AuditLog en operaciones secuenciales (sin transaction — neon-http no la soporta)
  - `applyManualMovement`: si no existe registro en `inventory` para esa variante, lo crea; si `newQty < 0` o `reserved > newQty` → lanza error con mensaje descriptivo (capturado en action)
  - Constraint clave: **nunca UPDATE directo de `inventory.quantity` desde admin UI** — todo pasa por `inventory_movements` con actor, tipo y motivo
  - `src/domains/admin/inventory/actions.ts` — `applyManualMovementAction()` requiere permiso `inventory:write`
  - `InventoryTable` — filas con fondo amarillo tenue (`bg-warning/5`) cuando `isLow=true`; badge OK/Stock bajo/Sin stock; swatch de color inline con `backgroundColor: row.colorHex`
  - `MovementModal` — preview de "stock resultante" en tiempo real; tipo `purchase` solo puede ser positivo (descripción en UI), `adjustment`/`correction` pueden ser negativos
  - `VariantHistory` — resumen 3 columnas (stock/reservado/disponible) + lista append-only de movimientos con tipo, delta coloreado (+verde / -rojo), motivo, email actor, timestamp
  - `LOW_STOCK_THRESHOLD = 5` definido en `src/domains/admin/inventory/types.ts` (mismo umbral que el dashboard)
  - Layout `/admin/inventario` ya existía con `requireAdminPermission('inventory:read')`
  - Ruta de detalle: `/admin/inventario/[variantId]` — Server Component con `Promise<params>`
- **Promociones y descuentos (Fase 4.8):**
  - `src/domains/discounts-promotions/` — types, validators, repository, service, actions (domain completo)
  - `src/domains/admin/discounts/` — types (re-export), repository (re-export), validators (re-export), actions (CRUD con `promotions:write`), DiscountsManager component
  - `validateCoupon(code, subtotalUsd, customerId?)` en `service.ts` — reglas: isActive, startsAt/endsAt, maxUsesTotal, minOrderUsd, maxUsesPerCustomer, isFirstOrderOnly
  - `recordCouponUsage({ discountId, customerId, orderId })` — llamado secuencialmente en `checkout/service.ts` usando `db` directamente (no toma `tx` — neon-http no soporta transacciones)
  - `validateCouponAction` en `discounts-promotions/actions.ts` — server action para storefront (sin auth, guests pueden aplicar cupones); dev fallback: código `SAVAYA10` = 10%
  - `CouponInput` en `domains/cart/components/CouponInput.tsx` — state local + `useTransition`; muestra badge verde con monto al aplicar; botón "Quitar" para remover
  - `CartPageClient` actualizado: importa `useCheckoutStore` para `appliedCoupon` + `setAppliedCoupon`; muestra línea "Descuento −$X.XX" en breakdown; total refleja descuento
  - `checkout-store` gana campo `appliedCoupon: AppliedCoupon | null` + `setAppliedCoupon`
  - `StepPayment` pasa `couponCode: appliedCoupon?.code` a `submitOrder`
  - `createOrder` en `service.ts`: valida cupón server-side antes de la transacción; calcula `couponDiscountUsd` con `calculateDiscount(type, value, subtotalUsd)`; aplica a `discountUsd` en la orden; llama `recordCouponUsage` dentro de la transacción
  - `DiscountsManager`: CRUD table + modals create/edit/delete; campos: code, type, value, minOrderUsd, maxUsesTotal, maxUsesPerCustomer, appliesToType, appliesToId (UUID), isFirstOrderOnly, isActive, startsAt/endsAt
  - Descuento aplica solo a `subtotalUsd` (no al envío) — comportamiento estándar e-commerce
  - `appliesToType`: `all` fully validated at cart page; `category/product/collection/customer` se validan en createOrder

- **CMS / Page builder (Fase 4.7):**
  - `src/domains/admin/cms/` — types, repository, validators, actions + 4 componentes
  - `/admin/contenido` — página con 3 tabs: "Página home" / "Banners" / "Popups"
  - `HomeSectionsEditor` — lista de bloques con flechas ↑↓ (reordenar sin DnD), Toggle activo/inactivo, panel derecho con form por tipo
  - `BlockContentForm` — switch por `section.type` → 8 sub-forms (AnnouncementBar, Hero, ShopByCategory, ProductCarousel, EditorialBlock, SplitBlock, BenefitsBlock, Newsletter); `banner_row` muestra mensaje informativo
  - Content update: el action re-valida el JSON contra el `BLOCK_SCHEMAS[type]` específico en servidor antes de guardar
  - `BannersManager` — tabla + modal create/edit/delete; scheduling vía `datetime-local` inputs → `Date | null` en DB
  - `PopupsManager` — tabla + modal create/edit/delete; `showOnPages` array editado como textarea (una ruta por línea)
  - Reorder: optimistic update local + rollback si action falla
  - Toggle: optimistic update + rollback en error
  - Zod v4 en este proyecto: `z.record()` requiere 2 args → `z.record(z.string(), z.unknown())`
  - No hay librería de DnD instalada — reordenar con botones ↑↓ (swap de sortOrder)

- **Delivery y zonas de envío (Fase 4.9):**
  - `src/domains/shipping/` — schema (shippingZones, shippingMethods, shippingRates, shippingCities), repository, types, validators
  - `src/domains/admin/shipping/` — actions (CRUD con `shipping:write`), `DeliveryManager` component
  - `DeliveryManager` — tabs: Zonas / Métodos / Configuración; CRUD inline, toggle activo/inactivo por zona y método
  - Checkout Paso 2 consume `listActiveShippingMethods()` del dominio shipping — agregar zona desde admin aparece en checkout sin tocar código

- **Tasas de cambio admin (Fase 4.10):**
  - `src/domains/admin/exchange-rates/` — repository (`listRateHistory(days)`), actions, `ExchangeRatesManager` component
  - `ExchangeRatesManager` — muestra tasa actual (fuente, timestamp), historial tabla 30 días, botón "Actualizar", modal "Override manual"
  - Override manual: requiere permiso `exchange_rates:override` + motivo obligatorio → AuditLog (actor, tasa anterior, tasa nueva, motivo, IP)
  - `src/domains/exchange-rates/service.ts` — `ExchangeRateProvider` con tasa fija en dev; override manual persiste en tabla `exchange_rates` y es la fuente de verdad para el storefront

- **Usuarios, roles y configuración (Fase 4.11):**
  - `src/domains/admin/users/` — repository (`listAdminUsers`, `listRoles`), actions (assign/revoke role, `users:write`), `UsersManager` component
  - `UsersManager` — tabla usuarios internos + modal de roles, badge de permisos efectivos, protección para no auto-revocar último Super Admin
  - `src/domains/admin/settings/` — repository, actions, `SettingsManager` component
  - `SettingsManager` — tabs: Empresa / Métodos de pago / Tienda / SEO global; cambios persistidos en tabla `application_settings` — nunca requieren tocar `.env` ni código

- **Hardening (Fase 7):**
  - **7.1 Seguridad**: CSP con nonce por request en `src/proxy.ts` — elimina `'unsafe-inline'` e `'unsafe-eval'` de script-src; nonce generado con `btoa(crypto.randomUUID())` en Edge runtime, propagado via header `x-nonce`; CSP estático removido de `next.config.ts`; se añaden `base-uri 'self'`, `form-action 'self'`, `media-src`; `X-DNS-Prefetch-Control: on` nuevo; robots.ts con Disallow para /admin/, /api/, /mi-cuenta/, /checkout/, /dev/; rate limiting añadido a `recently-viewed` y `analytics/purchase` con `publicApi` limiter; matcher del middleware expandido a todas las rutas HTML
  - **7.2 Performance**: ISR en Home (`revalidate = 3600`) y PDP (`revalidate = 300`); PLP excluida porque searchParams la hace dinámica; `'use client'` audit — uso apropiado, sin Client Components innecesarios
  - **7.3 Accesibilidad**: Skip-to-content link (`<a href="#main-content">`) en root layout.tsx — primer elemento focusable, visible solo al recibir foco (`.sr-only.focus:not-sr-only`); `id="main-content"` en `<main>` del shop layout; `aria-label` en FilterSidebar y ProductGrid; `lang="es"` ya existía; `:focus-visible` con ring dorado ya existía en globals.css
  - **7.4 SEO técnico**: `metadataBase` en root layout (resuelve URLs relativas de OG images); Organization/ClothingStore JSON-LD en root layout (aparece en todas las páginas); BreadcrumbList JSON-LD en PDP y PLP; canonical URL en PDP metadata; Twitter card defaults en root metadata; `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` en .env.example; `itemCondition`, `seller` y URL fija en Product schema de PDP; PDP usa `BASE_URL` env var (no URL hardcodeada)

- **Integraciones de producción (Fase 6):**
  - **6.1 Notificaciones**: `src/domains/notifications/` — types, repository (logNotification silente), service (getResend lazy-init), emails/ (OrderConfirmation, PaymentApproved, PaymentRejected React templates); `buildWhatsAppOrderLink()` genera wa.me URL con mensaje pre-rellenado; todas las notificaciones son fire-and-forget fuera de la transacción DB para no rollbackear pedidos por fallo de email
  - **6.2 Tasas BCV**: `src/domains/exchange-rates/service.ts` reescrito — `fetchBcvRate()` con dual fallback (pydolarve.org primario, ve.dolarapi.com secundario); `getCurrentRate()` lee DB primero; `GET /api/cron/update-exchange-rate` protegido por `x-cron-secret`
  - **6.3 Analytics**: `src/domains/analytics/service.ts` (client) — 12 eventos GA4 ecommerce + fbq; `AnalyticsProvider.tsx` con `<Script>` gtag + Meta Pixel + `PageViewTracker` en pathname; `src/app/api/analytics/purchase/route.ts` — Meta CAPI server-side con deduplicación por eventId; `analytics/repository.ts` — `saveOrderAttribution` / `getOrderAttribution` para UTM + fbclid
  - **6.4 Observabilidad**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (producción only, tracesSampleRate: 0.1, replay); `@vercel/analytics` + `@vercel/speed-insights` en `app/layout.tsx`
  - **6.5 Búsqueda**: `drizzle/migrations/0004_fts_search.sql` — pg_trgm extension, search_vector tsvector, GIN indexes, trigger auto-update; `PostgresSearchProvider` — tsvector + trigram combinado con rank = `ts_rank*2 + similarity`, fallback ILIKE si extensión no disponible
  - **6.6 Cloudinary**: `src/shared/lib/cloudinary.ts` — `cloudinaryUrl()`, `cloudinaryBlurPlaceholder()`, `cloudinaryPresets` (productCard/productGallery/thumbnail/heroBanner/categoryCard), `getUploadSignature(folder)`; `next.config.ts` actualizado con CSP para todos los servicios externos (GA4, Meta Pixel, BCV APIs, Cloudinary, Unsplash)

- **Design Sync Figma → Código (Fase 5):**
  - **5.1 Tokens**: `globals.css` full rewrite — dark base `#0C0C08`, superficies `#131310/1C1C19/252521`, gold `#CA8C31`, Bebas Neue (`--font-display`) + Rubik (`--font-sans`), radius sm/md/lg/xl/pill, `[data-theme="light"]` + `[data-gender="hombre"]`
  - **5.2 Marca**: `src/domains/layout/ThemeSync.tsx` (sincroniza `data-theme`/`data-gender` desde localStorage sin flash), `theme-store.ts` (Zustand), `GenderSelector.tsx` (pills SAVAYA/SVY FOR MEN en navbar); logo mariposa SVG con gradiente dorado en `ButterflyMark`
  - **5.3 Átomos**: Button `rounded-full` primary dorado, ProductCard `rounded-3xl` + hover segunda imagen, SizeSelector pills gold-border, ColorSelector ring dorado, Modal/Drawer overlay `rgba(0,0,0,0.82)` + `rounded-t-3xl`/`rounded-l-2xl`
  - **5.4–5.7 Storefront**: Hero Bebas Neue uppercase + CTA dorado, PLP chips `rounded-full`, PDP sticky CTA mobile + trust pills, CartDrawer Bebas header, Checkout stepper pills gold, `/mi-cuenta` cards `rounded-2xl`
  - **5.8 Admin**: topbar logo mariposa + SAVAYA Bebas Neue, KPI cards `rounded-2xl`, status pills tokenizados, CTA `rounded-full` dorado

- **Reconexión DB + correcciones post-lanzamiento (2026-08-17):**
  - Supabase original `ujgupdrkdpebodwxrcii` se perdió → nuevo proyecto `fytegzrfsirbtyekncrn`
  - Migraciones y seed aplicados manualmente vía Supabase SQL Editor (IPv6 bloqueó `drizzle-kit migrate`)
  - `src/app/page.tsx` eliminado — era placeholder "Próximamente" que tapaba `(shop)/page.tsx`
  - `src/domains/catalog/nav-config.ts` corregido: `/sandalias` → `/categoria/sandalias`, etc.; se agregó entrada `Hombre` → `/hombre`
  - **Dual branding implementado:** `src/domains/layout/SavayaLogo.tsx` — Client Component, lee `gender` del theme-store; `variant='full'` mujer usa `savaya-logo.webp` con `mix-blend-mode:screen`; `variant='mark'` usa `savaya-mark.png`; modo hombre pendiente de integrar logo real
  - **Logos en `public/images/`:** `savaya-logo.webp` + `savaya-logo.png` (SAVAYA mujer, alas doradas + wordmark), `savaya-mark.png` (solo alas, para favicon/mark), `svy-logo-black.png` + `svy-logo-white.png` (SVY FOR MEN, mariposa geométrica negra)
  - **Pendiente:** Navbar.tsx aún usa `<span>SAVAYA</span>` texto — debe actualizarse a `<SavayaLogo>` cuando se implemente diseño desde claude_design
  - **MCP claude_design instalado:** `claude mcp add claude_design --transport http https://api.anthropic.com/v1/design/mcp` — disponible en próximas sesiones para implementar diseño desde `https://claude.ai/design/p/22724c72-d570-4fc4-ab5b-301c4a13fc65`

- **Migración Supabase → Neon (2026-08-17):**
  - Causa: Supabase PgBouncer (15 conexiones en free tier) saturaba el pool con tráfico concurrente en Vercel Lambda
  - Driver cambiado: `postgres.js` + `drizzle-orm/postgres-js` → `@neondatabase/serverless` + `drizzle-orm/neon-http`
  - `src/shared/lib/db.ts` reescrito: usa `neon(DATABASE_URL)` + `drizzle(sql, { schema })` + helper `rawQuery<T>`
  - `rawQuery<T>(query: SQL): Promise<T[]>` — wrappea `db.execute()` extrayendo `.rows`; usar en vez de `db.execute()` directo
  - 9 archivos actualizados: `dashboard/repository`, `catalog/repository`, `catalog/search`, `customers/repository`, `inventory/repository`, `orders/repository`, `orders/service`, `checkout/service`, `discounts-promotions/repository`
  - ⚠️ **Nota retroactiva**: neon-http NO soporta `db.transaction()` ni `FOR UPDATE` — los archivos de la sección "Migración Supabase → Neon" que mencionaban `AnyTx` / `tx.execute()` fueron corregidos posteriormente (ver sección "Correcciones post-lanzamiento 2026-08-18")
  - `admin/page.tsx` optimizado: 6 Suspense separados → un solo `Promise.all` con todos los bloques del dashboard como componentes de presentación puros
  - Schema aplicado en Neon con `drizzle-kit push`; usuarios admin recreados con script temporal
  - `.env.local` actualizado: solo `DATABASE_URL` (sin `DIRECT_URL`); apunta a `ep-round-cherry-ay3dqlqz.c-5.us-east-2.aws.neon.tech`
  - Script de migración de datos: `scripts/migrate-supabase-to-neon.mjs` (archivado, ya no se necesita)

- **Correcciones admin dark theme (2026-08-17):**
  - Causa raíz: `body` computa `color: var(--color-text-primary)` como `#111111` (light); ese valor computado se hereda por CSS, no la variable. Hijos sin clase de color explícita mostraban texto negro sobre fondo oscuro.
  - Fix: `AdminShell` root div agrega `text-text-primary` — fuerza re-evaluación de la variable dentro del contexto `[data-theme="dark"]` → todos los hijos heredan `#F1EFEA`
  - `BlockContentForm.tsx` inputs/textareas: `bg-transparent` → `bg-surface text-text-primary`
  - `globals.css`: agrega `color-scheme: dark` a `select`, `input`, `textarea` dentro de `[data-theme="dark"]` — el OS usa colores del sistema dark para el dropdown nativo de `<select>`
  - `src/app/admin/analytics/page.tsx`: reemplazó placeholder "Disponible en Fase 4.2" con página real de estado de integraciones (GA4, Meta Pixel, CAPI)

- **18 productos de ejemplo (2026-08-17):**
  - Script: `scripts/seed-sample-products.mjs` (ESM, usa `@neondatabase/serverless` directo)
  - Categorías cubiertas: Sandalias (3), Tacones (4), Plataformas (2), Flats (3), Botas (2), Sneakers (2), Mules (2)
  - Imágenes: Unsplash (whitelisted en `next.config.ts`); `cloudinary_public_id` = `samples/<slug>-N` (placeholder)
  - Stock: 5–15 unidades por variante; 2–4 colores × tallas 35–40; mezcla `isFeatured`, `isNew`, `compare_at_price`
  - Correr con: `node --env-file=.env.local scripts/seed-sample-products.mjs`

- **Correcciones post-lanzamiento (2026-08-18):**
  - **Causa raíz global**: neon-http driver no soporta `db.transaction()` ni `SELECT ... FOR UPDATE` — todos los servicios heredados de la era Supabase/postgres.js que usaban estas construcciones fallaban en runtime.
  - **`src/domains/checkout/service.ts`** — reescrito completamente:
    - Eliminado `db.transaction()` + `FOR UPDATE`; reemplazado por operaciones `await` secuenciales
    - Reserva de inventario: `UPDATE inventory SET reserved = reserved + N WHERE (quantity - reserved) >= N` — atómico sin transaction; si afecta 0 filas → deshace reservas previas del loop y elimina la orden
    - Identidad del cliente: `const session = await auth(); const customerEmail = session?.user?.email ?? personalData.email` — si el comprador está logueado, su email de sesión es la identidad canónica, evitando crear cliente duplicado
    - Contadores denormalizados: `customers.totalOrders`, `totalSpentUsd`, `lastOrderAt` ahora se actualizan al crear el pedido (antes no se actualizaban)
  - **`src/domains/discounts-promotions/repository.ts`** — `recordCouponUsage` ya no recibe `tx`: firma cambiada de `recordCouponUsage(tx, payload)` a `recordCouponUsage(payload)` usando `db` directamente
  - **`src/domains/customers/service.ts`** — `setDefaultAddress` reescrito sin `db.transaction()`: dos `await db.update()` secuenciales (primero limpia `isDefault`, luego establece el nuevo)
  - **`src/domains/customers/wishlist-actions.ts`** — `getCustomerId()` ahora crea el registro de cliente lazily si el usuario está autenticado pero aún no tiene `customers` row (primer ingreso vía OAuth)
  - **`src/domains/catalog/components/ProductClientShell.tsx`** — rewiring completo de wishlist: importa `toggleWishlist` directamente, gestiona estado local con `Set<string>` de `wishlistVariantIds`, actualizaciones optimistas; ya no pasa props `isInWishlist`/`onWishlistToggle` desde el Server Component padre
  - **`src/domains/catalog/components/ProductInfo.tsx`** — `onWishlistToggle` ahora recibe `variantId: string` (antes recibía `productId`)
  - **`src/app/(shop)/producto/[slug]/page.tsx`** — fetch paralelo de `wishlistVariantIds` desde `getWishlistIds()`; pasa a `ProductClientShell`
  - **`src/domains/customers/components/WishlistButton.tsx`** — ruta corregida: `/login` → `/iniciar-sesion`
  - **`src/app/api/admin/orders/proof-url/route.ts`** — proxy de Cloudinary reescrito: la URL de delivery (`res.cloudinary.com`) no acepta Basic Auth; ahora usa Admin API download (`api.cloudinary.com/v1_1/{cloud}/image/download`) con firma SHA1 (`public_id + timestamp + type + apiSecret`); fallback a `raw/download` para PDFs
  - **`src/domains/admin/orders/repository.ts`**:
    - Query de comprobante: `JOIN payment_methods` → `LEFT JOIN payment_methods` (evita que el comprobante desaparezca si el método fue eliminado)
    - Nueva función `deleteOrder(orderId, actorId, actorEmail, ip)`: carga orden + items → libera inventory.reserved para estados pre-entrega → elimina `inventory_movements` (no tiene FK cascade) → elimina orden (cascade a items/history/proofs) → decrementa `customers.totalOrders`/`totalSpentUsd` con `GREATEST(0,...)` → inserta AuditLog
  - **`src/domains/admin/orders/actions.ts`** — nuevo `deleteOrderAction(orderId)` con permiso `orders:write`
  - **`src/domains/roles-permissions/permissions.ts`** — añadido `ORDERS_DELETE: 'orders:delete'` (constante de código; **pendiente agregar al seed DB y roles**)
  - **`src/domains/admin/orders/components/OrderDetailView.tsx`** — botón "Eliminar pedido" + modal de confirmación con `deleteOrderAction`; redirección a `/admin/pedidos` tras eliminar

  **Correcciones adicionales (2026-08-18 — misma sesión):**
  - `src/domains/admin/orders/service.ts` — `transitionOrderStatus`, `approvePayment`, `rejectPayment` reescritos con `rawQuery` + `await` secuenciales (eliminado `db.transaction()` + `FOR UPDATE`)
  - `src/domains/checkout/service.ts` — `productSnapshot` corregido: `productName→name`, `color→colorName`, `size→sizeName`; también añadidos `methodName` y `costUsd` al `shippingSnapshot`; query fire-and-forget actualizada de `ps->>'productName'` a `ps->>'name'`; import de `shippingMethods` para lookupear el nombre del método al crear el pedido
  - `src/domains/admin/orders/actions.ts` — permiso cambiado de `orders:delete` (inexistente en DB) a `orders:write`
  - `src/domains/customers/components/PedidoDetailView.tsx` — sección de entrega reescrita con `<dl>` estructurado que muestra `methodName`, `recipientName`, `address`, `municipality`, `city/state`, `reference`; maneja pickup sin dirección
  - `src/domains/admin/inventory/repository.ts` — `applyManualMovement` reescrito sin `db.transaction()` + `FOR UPDATE`
  - `src/domains/admin/cms/repository.ts` — `updateSectionsOrder` reescrito: loop con `await db.update()` (eliminado `db.transaction()`)
  - `src/domains/admin/catalog/repository.ts` — 7 funciones reescritas sin transacciones: `createProduct`, `updateProduct`, `archiveProduct`, `restoreProduct`, `publishProduct`, `unpublishProduct`, `duplicateProduct`; todas usan `await db.*` secuenciales
  - `src/app/api/cron/expire-reservations/route.ts` — reescrito con `await` secuenciales por orden (eliminado `db.transaction()`); response ahora incluye `failed` array si algún pedido falla
  - **Resultado**: `await db.transaction` = 0 ocurrencias en el codebase; `FOR UPDATE` = 0 en queries SQL

- **Módulo métodos de pago admin (2026-08-19):**
  - **Tipos soportados**: `zelle`, `pago_movil`, `pago_movil_qr`, `bank_transfer`, `usdt_trc20`, `binance_pay`, `cash` — enum en `src/domains/payment-methods/schema.ts`
  - **`drizzle/migrations/0005_pago_movil_qr_type.sql`** — `ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'pago_movil_qr'` — debe correrse manualmente en Neon console
  - **`src/domains/admin/payment-methods/`** — dominio completo: `types.ts`, `repository.ts` (CRUD + mapeo a `AdminPaymentMethod`), `actions.ts` (server actions con Zod por tipo + permiso `settings:write`), `components/PaymentMethodsManager.tsx`
  - **`src/app/admin/metodos-pago/`** — `layout.tsx` (requiere `settings:read`) + `page.tsx` (Server Component: `listPaymentMethods()` + `auth()`, pasa `canEdit`)
  - **`src/app/api/admin/payment-methods/upload-qr-signature/route.ts`** — firma Cloudinary para carpeta `savaya/payment-qr`; requiere `settings:write`; devuelve `isDev: true` sin credenciales en dev (client usa `URL.createObjectURL`)
  - **`BankSelector`** — dropdown con 22 bancos venezolanos preset + opción "Otro" que muestra input libre; `useEffect` resetea a 'select' cuando el padre limpia el valor (al cambiar tipo)
  - **`PagoMovilQrForm`** — componente propio (extracción obligatoria por Rules of Hooks); `useState(false)` para `uploading`; dropzone con preview de imagen; `handleQrFile` usa try/catch y no re-lanza (evita silenciar errores en `startTransition`)
  - **Validación Zod server-side por tipo**: `ZELLE_SCHEMA`, `PAGO_MOVIL_SCHEMA`, `PAGO_MOVIL_QR_SCHEMA`, `BANK_TRANSFER_SCHEMA`, `USDT_SCHEMA`, `BINANCE_SCHEMA` — `parseAccountDetails(type, raw)` en `actions.ts`
  - **Pattern correcto para `startTransition` async**: siempre envolver el cuerpo en `try-catch` — React 19 silencia rechazos no capturados dentro de transiciones y el usuario no ve ningún feedback
  - **Nav admin**: entrada "Métodos pago" con `WalletIcon` en `src/domains/admin/lib/nav.tsx`, permiso `settings:read`
  - **Pendiente**: mostrar imagen QR al cliente en checkout cuando selecciona tipo `pago_movil_qr`
