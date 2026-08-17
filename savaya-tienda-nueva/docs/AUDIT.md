# AUDIT.md — Auditoría de `savaya-tienda`

> Generado: 2026-08-15  
> Auditor: Claude Code (Sonnet 4.6)  
> Fuente auditada: `savaya-tienda` (solo lectura)  
> Destino: `savaya-tienda-nueva/docs/AUDIT.md`

---

## 1. Stack real

| Campo | Valor |
|---|---|
| Framework | Next.js **16.2.6** (App Router) |
| Lenguaje | TypeScript 5.x |
| React | 19.2.4 |
| CSS | Tailwind CSS v4 (PostCSS plugin vía `@tailwindcss/postcss`) |
| Base de datos / BaaS | Supabase (`@supabase/supabase-js` 2.106.0 + `@supabase/ssr` 0.10.3) |
| ORM | Ninguno — queries escritas directamente sobre el cliente Supabase JS |
| Estado del cliente | Zustand 5.0.13 (solo carrito) |
| Formularios | react-hook-form 7.76 + Zod 4.4.3 + @hookform/resolvers |
| Email transaccional | Resend 6.12.3 + `@react-email/components` |
| Media | Cloudinary (subida firmada vía API route `/api/upload`) |
| Gráficos (dashboard) | Recharts 3.8.1 |
| Excel (dashboard) | xlsx 0.18.5 |
| Hosting configurado | Vercel (proyecto `savaya-tienda`, monorepo con root directory `savaya-tienda/`) |
| Exchange rate | `ve.dolarapi.com` (BCV oficial, caché 1 hora vía `fetch` con `next.revalidate`) |

El proyecto **no tiene ORM**: toda interacción con Postgres se hace mediante el SDK de Supabase con queries en cadena (`.select().eq().in()`). No existe una capa de schema tipado de DB ni migraciones en este repo.

---

## 2. Arquitectura y estructura de carpetas

```
src/
  app/
    (auth)/                    # login, registro, recuperar-contrasena
    (shop)/                    # layout público con Navbar + Footer
      [páginas de catálogo]    # casuales, deportivos, de-vestir, zapatos, mujer, buscar, marcas…
      [rutas heredadas]        # hombre/, ninos/, remates/, ropa/ — solo contienen redirect()
      accesorios/              # ruta de Tuluoshop, aún existe
      coleccion/[slug]/        # colecciones curadas
      producto/[slug]/         # PDP (catch-all: [...productPath])
      cuenta/                  # área autenticada del cliente
    dashboard/                 # área admin (productos, pedidos, inventario, etc.)
    api/
      checkout/                # POST — lógica principal de orden
      discount/                # POST — validación de código
      upload/                  # POST — proxy firmado a Cloudinary
      cleanup/proofs/          # GET — cron Vercel (limpieza Cloudinary 72h)
      emails/                  # POST — envíos transaccionales (Resend)
      webhooks/pagos/          # POST — stub vacío (Mercado Pago no implementado)
      revalidate/              # POST — ISR on-demand
      seed/                    # ruta de seeding (existe en producción)
      search/                  # búsqueda
      auth/migrate-cart/       # migración de carrito anón → autenticado
      account/delete/          # DELETE cuenta
      patch-images/            # utilidad admin de migración

  components/                  # organizado por contexto (auth, cart, catalog, checkout,
                               # cuenta, dashboard/*, home, layout, product, providers, ui)
  emails/                      # plantillas react-email (OrderConfirmation, OrderShipped, WelcomeEmail)
  hooks/                       # useAuth, etc.
  lib/
    supabase/                  # client.ts, server.ts, middleware.ts
    bcvRate.ts                 # fetch BCV rate
    catalog.ts                 # fetchCatalogProducts, parseSearchParams, mock data helpers
    cloudinary.ts              # loaders para next/image
    constants.ts               # constantes de negocio (tallas, ciudades, shipping costs, colores)
    email.ts                   # wrappers de Resend
    getCurrency.ts             # getCurrency() con React cache
    mock-data.ts               # datos placeholder para desarrollo sin Supabase
    rateLimit.ts               # in-memory rate limiter (Map global)
    types.ts                   # interfaces de dominio
    utils.ts                   # formatPrice, slugify, generateOrderNumber, etc.
    wholesale.ts               # lógica de precio mayorista
  store/
    cartStore.ts               # Zustand store del carrito
  styles/                      # estilos globales / tokens
```

**Patrones usados:**
- Next.js App Router con Route Groups `(auth)` y `(shop)`.
- Server Components para las páginas del catálogo y el dashboard; Client Components donde hay estado interactivo (`'use client'`).
- Server Actions (`'use server'`) en `dashboard/**/actions.ts`.
- ISR con `export const revalidate = 60` en páginas de catálogo.
- Mock mode: cuando `NEXT_PUBLIC_SUPABASE_URL` no está definido, cae a datos estáticos de `mock-data.ts`. Permite desarrollo sin Supabase.

---

## 3. Deuda técnica evidente

### 3.1 Componentes gigantes (>300 líneas)

Los componentes de dashboard en particular no tienen separación de responsabilidades. Lista completa de archivos sobre 300 líneas:

| Archivo | Líneas | Problema |
|---|---|---|
| `dashboard/productos/ProductForm.tsx` | **790** | Formulario monolítico: variantes, imágenes, precios, colores, tags — todo en un componente |
| `dashboard/configuracion/ConfigForm.tsx` | **722** | Configuración de tienda + métodos de pago + precios de envío en un solo componente |
| `dashboard/pedidos/OrdersTable.tsx` | **636** | Tabla + filtros + modals + acciones en un bloque |
| `dashboard/pedidos/OrderWhatsAppActions.tsx` | **450** | Generación de mensajes WA con lógica de negocio inline |
| `dashboard/marketing/MarketingDashboard.tsx` | **559** | Múltiples tabs sin separación real de componentes |
| `dashboard/hero/HeroSlidesEditor.tsx` | **542** | Editor con estado complejo sin extraer subcomponentes |
| `dashboard/inventario/InventoryTable.tsx` | **507** | Tabla inline editable con estado mezclado |
| `dashboard/productos/VariantsManager.tsx` | **422** | Gestión de variantes como isla dentro de ProductForm |
| `dashboard/colecciones/CollectionEditor.tsx` | **398** | Editor con drag-and-drop implícito |
| `checkout/PaymentForm.tsx` | **661** | Presenta métodos de pago + sube comprobante + calcula reserva — tres responsabilidades |
| `dashboard/clientes/ClientesTable.tsx` | **438** | Tabla con lógica de export Excel inline |
| `product/ProductCard.tsx` | **504** | Card con hover, favoritos, variantes, fallback — demasiado para un card |
| `product/ProductInfo.tsx` | **443** | PDP lateral: galería, tallas, colores, carrito, wishlist, acordeón |
| `layout/NavDesktop.tsx` | **428** | Mega menú completo inline |
| `layout/SearchBar.tsx` | **409** | Barra de búsqueda con debounce, resultados, navegación — un solo componente |
| `cart/CartPageClient.tsx` | **393** | Página de carrito completa en cliente |
| `layout/MobileMenu.tsx` | **385** | Menú mobile completo |
| `checkout/ShippingForm.tsx` | **380** | Formulario complejo con condicionales por delivery_type |
| `dashboard/descuentos/DiscountForm.tsx` | **322** | Formulario con lógica de validación inline |
| `dashboard/categorias/CustomSectionsEditor.tsx` | **343** | Editor de secciones custom con estado complejo |
| `auth/RegisterForm.tsx` | **283** | Registro con validaciones Zod |
| `dashboard/popup/PopupForm.tsx` | **300** | Formulario + preview inline |
| `catalog/FilterSidebar.tsx` | **338** | Filtros + price slider + estado de URL — todo junto |
| `home/HeroBanner.tsx` | **279** | Carrusel con animaciones y estado |

### 3.2 Código muerto y heredado de Tuluoshop no limpiado

Estos archivos/fragmentos contienen referencias al proyecto original **Tuluoshop** que nunca fueron actualizadas:

- `src/emails/WelcomeEmail.tsx` línea 29: `<Text style={logoText}>TULUJOSHOP</Text>` — el email de bienvenida llega a clientes con la marca equivocada.
- `src/emails/OrderShipped.tsx` línea 33: `<Text style={logoText}>TULUJOSHOP</Text>` — ídem, el email de envío.
- `src/emails/OrderConfirmation.tsx` línea 90: `<Text style={logoText}>TULUJOSHOP</Text>` — el email de confirmación de pedido muestra TULUJOSHOP.
- `src/app/dashboard/pedidos/actions.ts` línea 177: HTML hardcodeado con `TULUJOSHOP` en el cuerpo del email de WhatsApp HTML.
- `src/components/home/Newsletter.tsx` línea 53: `Comunidad Tululú` — texto de marca equivocada en la sección de newsletter.
- `src/lib/utils.ts` línea 47: `generateOrderNumber()` genera `TUL-{year}-{seq}` (prefijo de Tuluoshop).
- `src/app/api/checkout/route.ts` línea 46: `generateOrderNumber()` local también genera `TUL-`.
- Múltiples páginas de contenido estático (`faq`, `terminos-y-condiciones`, `politica-de-devoluciones`) tienen el número de WhatsApp `+58 424-4426241` que no coincide con el dato en `constants.ts` (`584141100100`).

**Datos mock con identidad de Tuluoshop:**
- `src/app/(shop)/cuenta/page.tsx` líneas 37-39: órdenes mock con `TUL-2026-00123` etc. — visibles al usuario sin Supabase.
- `src/app/(shop)/cuenta/pedidos/page.tsx` líneas 71-120: ídem.
- `src/lib/mock-data.ts`: slides y categorías con copy de Tuluoshop ("Moda para hombre", "Remates de temporada", hrefs a `/hombre` y `/remates`).

### 3.3 Falta de tipado / uso de `unknown` como sustituto de `any`

No hay `any` explícito significativo (ESLint lo bloquea), pero hay patrones de `unknown as` y castings repetidos que enmascarán errores en runtime:

- `src/app/api/checkout/route.ts` línea 99: `as unknown as VariantRow[]` — cast sin validación real de shape.
- `src/app/dashboard/page.tsx` línea 169: `as unknown as LowStockVariant[]`.
- `src/app/(shop)/coleccion/[slug]/page.tsx` línea 47: `as unknown as CollectionProductItem[]`.
- `src/lib/getCurrency.ts` línea 11: `as { store_currency: string | null } | null`.

En todos los casos la raíz del problema es la misma: Supabase JS no genera tipos de la DB, por lo que el equipo está casteando manualmente. Sin un ORM o una capa de tipos generados (Supabase CLI `gen types`), este patrón se repite en toda la base de código.

### 3.4 Lógica crítica resuelta solo (o principalmente) en frontend

**Bueno en este proyecto:** el checkout server-side (`/api/checkout/route.ts`) sí recalcula precios, descuentos y total desde la DB antes de insertar la orden. Este es el caso crítico y está bien resuelto.

**Problemas residuales:**

- `src/components/checkout/ShippingForm.tsx`: la lista de empresas de envío (`COMPANIES`) y municipios de Carabobo (`CARABOBO_MUNICIPALITIES`) están hardcodeadas en el componente cliente, no vienen de `store_settings`. Si el negocio agrega o quita una empresa, requiere un deploy.
- `src/lib/rateLimit.ts`: el rate limiter es un `Map` global en memoria del proceso Node. En Vercel (serverless) cada invocación puede tener su propia instancia — el rate limit no funciona correctamente en producción. No hay Upstash ni Redis.
- `src/app/api/discount/route.ts`: el formato de error para `min_purchase` usa `formatCOP` (pesos colombianos), no el formato venezolano/USD que usa el resto del proyecto — bug visible al usuario.
- `src/app/(shop)/zapatos/page.tsx`: muestra filtro de género (`showGenderFilter`) aunque Savaya solo vende calzado femenino. La CLAUDE.md lo nota como pendiente, pero no está corregido.
- `src/lib/supabase/middleware.ts`: el middleware de visibilidad de categorías consulta `CATEGORY_KEYS` que incluye `/hombre`, `/ninos`, `/remates` (ya redirects) pero también `/mujer` y `/zapatos` que siguen activas — no es un bug pero es código muerto parcial.

### 3.5 Secretos hardcodeados en código fuente

- `src/vercel.json` línea 19: `"https://res.cloudinary.com/dckobjcbj/image/upload/:path*"` — el Cloud Name de Cloudinary (`dckobjcbj`) está hardcodeado en el archivo de configuración de Vercel. Esto no es un secreto en sí mismo (el cloud name es público por naturaleza), pero es inconsistente con la variable de entorno `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- No se encontraron claves de API, tokens o secretos reales hardcodeados en el código fuente. Las credenciales van en `.env.local`. **Este aspecto está bien.**

### 3.6 Falta de validación server-side

- `src/app/api/checkout/route.ts`: el campo `shippingCost` se acepta del cliente como `Number(shippingCost) || 0` (línea 154) sin validar que corresponda al costo real configurado en `store_settings.shipping_prices`. Un cliente podría enviar `shippingCost: 0` y pagar envío gratis. El precio del producto sí se revalida; el precio de envío no.
- `src/app/api/webhooks/pagos/route.ts`: el webhook de Mercado Pago es un stub vacío que siempre devuelve `{ received: true }` sin verificar la firma del payload. Hay un comentario `// TODO: verify Mercado Pago webhook signature`. Si se activa Mercado Pago, esto es una vulnerabilidad de inyección de eventos.
- `src/app/api/seed/`: existe una ruta de seeding en producción (no auditada en detalle). Rutas de seeding no deben existir en producción sin autenticación estricta.

### 3.7 Problemas de seguridad visibles

- **Rate limiter en memoria (no funciona en serverless):** `src/lib/rateLimit.ts` usa un `Map` global. En Vercel con funciones serverless, cada request puede correr en una instancia diferente, invalidando el límite. Los endpoints de `/api/checkout`, `/api/discount` y `/api/upload` creen tener rate limiting pero no lo tienen en producción real.
- **Ruta `/api/seed` expuesta:** existe la carpeta `src/app/api/seed/` en producción. Sin ver su contenido exacto, la existencia de rutas de seed en prod es una superficie de ataque potencial.
- **Webhook sin verificación de firma:** descrito en 3.6.
- **CSP con `'unsafe-inline'` en scripts:** `next.config.ts` incluye `"script-src 'self' 'unsafe-inline'"` — necesario para el hidratado de Next.js y Meta Pixel, pero debilita la protección XSS. Esto es una limitación del stack elegido con Meta Pixel inyectado vía layout, no un error de implementación propiamente dicho.

### 3.8 Deuda de dependencias

- **`xlsx` 0.18.5**: esta versión (0.18.x) es de 2023 y hay reportes de vulnerabilidades en versiones antiguas de SheetJS. La versión actual del paquete en npm es 0.20.x. Adicionalmente, SheetJS Community Edition cambió de licencia — revisar compatibilidad.
- **`recharts` 3.8.1**: versión actual, sin problema inmediato.
- **`@react-email/components` 1.0.12**: versión razonablemente reciente.
- **Ausencia de tests**: el proyecto no tiene ningún test unitario, de integración ni E2E. Dependencias de testing (`vitest`, `playwright`) no están instaladas. Cualquier refactor es ciego.
- **No hay Husky / pre-commit**: no hay hooks que bloqueen commits con TypeScript errors o lint failures.

---

## 4. Qué NO tiene calidad para reutilizar

| Ítem | Razón |
|---|---|
| **Todo el código de componentes** | Arquitectura plana en `/components` sin separación de dominios. Los componentes mezclan lógica de negocio con UI. No hay tests. Componentes de hasta 790 líneas. |
| **`src/lib/rateLimit.ts`** | Rate limiter in-memory que no funciona en entorno serverless. `savaya-tienda-nueva` debe usar Upstash (ya especificado en CLAUDE.md). |
| **`src/lib/types.ts` completo** | Tipos escritos a mano sin generar desde el schema de DB. La nueva arquitectura usará Drizzle con tipos inferidos + Zod, eliminando estos tipos manuales. |
| **`src/lib/mock-data.ts`** | Copy de Tuluoshop sin limpiar: slides con "moda para hombre", categorías con `/hombre`, `/remates`. No sirve como base. |
| **Los tres templates de email** (`OrderConfirmation`, `WelcomeEmail`, `OrderShipped`) | Llevan `TULUJOSHOP` hardcodeado en el header. Son funcionales estructuralmente pero el branding está equivocado. No reutilizables sin reescritura. |
| **`src/store/cartStore.ts`** | La estructura del store es aceptable, pero la clave de persistencia es `savaya-cart` y los tipos dependen de `CartItem` que en la nueva arquitectura vendrá de Drizzle/Zod. Reescribir limpio es más rápido que adaptar. |
| **`generateOrderNumber()` en `utils.ts` y `checkout/route.ts`** | Genera el prefijo `TUL-` (Tuluoshop). Bug de marca crítico. No reutilizar. |
| **`src/app/api/webhooks/pagos/route.ts`** | Stub vacío sin implementación. No hay nada que reutilizar. |
| **`src/components/home/Newsletter.tsx`** | Dice "Comunidad Tululú" — nombre de otra marca. No reutilizar sin reescribir el copy. |
| **Schema de DB / migraciones** | No existe en este repo. Las tablas están en Supabase remoto sin versionado local. La nueva tienda usará Drizzle con migraciones versionadas en Git. |

---

## 5. Qué SÍ podría reutilizarse

### 5.1 Datos de negocio reales (en `src/lib/constants.ts`)

Estos datos están validados con el negocio y deben trasladarse directamente a la configuración de `savaya-tienda-nueva`:

```ts
// Marca
nombre: 'Savaya'
tagline: 'Marca tu moda'
whatsapp: '584141100100'
email: 'Savayarrss@gmail.com'
instagram: '@Savayavzla'
address: 'Calle 73, CC Multi Tienda God is Good, local A-4, Valencia, Carabobo'
metaPixelId: '27355395054120748'

// Tallas activas
SHOE_SIZES_WOMEN = ['35','36','37','38','39','40']

// Costos de envío base (USD)
SHIPPING_COST = 5
EXPRESS_SHIPPING_COST = 10
FREE_SHIPPING_THRESHOLD = 80

// Ciudades con cobertura
SAVAYA_CITIES = ['Caracas', 'Valencia', 'Maracay', 'Barquisimeto', 'Puerto La Cruz',
  'Puerto Ordaz', 'Barinas', 'San Cristóbal', 'Mérida', 'Maracaibo',
  'Acarigua', 'San Félix', 'Guanare', 'El Tigre', 'Cantaura',
  'Puerto Cabello', 'Valera', 'Trujillo', 'Maturín', 'Upata', 'Valle la Pascua']

// Paleta de colores de producto (19 colores con hex validados)
COLORS = [{ name: 'Negro', hex: '#111111' }, { name: 'Blanco', hex: '#FFFFFF' }, ...]

// Empresas de envío activas
Zoom, Tealca, MRW

// Municipios Carabobo con delivery a domicilio
Valencia, Naguanagua, San Diego, Libertador, Los Guayos, Guacara,
San Joaquín, Bejuma, Montalbán, Miranda, Puerto Cabello, Carlos Arvelo,
Diego Ibarra, Juan José Mora
```

### 5.2 Copy de páginas estáticas legales y de soporte

Las siguientes páginas tienen contenido real, revisado y coherente con el negocio venezolano (no placeholder). El copy puede reutilizarse textualmente en las páginas equivalentes de `savaya-tienda-nueva`:

- `(shop)/politica-de-devoluciones/page.tsx` — política de 7 días, proceso claro.
- `(shop)/politica-de-envios/page.tsx` — cobertura, agencias, tiempos.
- `(shop)/terminos-y-condiciones/page.tsx` — términos con jurisdicción venezolana.
- `(shop)/sobre-nosotros/page.tsx` — historia de Valencia, +4 años, relato validado.
- `(shop)/faq/page.tsx` — preguntas frecuentes completas (con la salvedad del número de WA incorrecto en algunas instancias y el formato de número de pedido `TUL-` que debe corregirse a `SAV-`).

**Importante:** estos archivos mezclan copy correcto con copy de Tuluoshop (número de pedido `TUL-`, número de WA `+58 424-4426241`). El copy debe extraerse y corregirse antes de usarlo.

### 5.3 Configuración de integraciones

> **IMPORTANTE:** `savaya-tienda` es un fork de Tuluoshop. El cloud de Cloudinary (`dckobjcbj`) y el Meta Pixel ID (`27355395054120748`) pertenecen a Tuluoshop/otra cuenta — **no son de Savaya y no deben trasladarse**. Savaya necesita crear su propio cloud de Cloudinary y su propio Pixel de Meta antes de la Fase 5.

- **Estructura de carpetas Cloudinary (patrón, no la cuenta):** `savaya/productos`, `savaya/banners`, `savaya/hero`, `savaya/comprobantes`, `savaya/envios`, `savaya/popup`, `savaya/cms`. El patrón es correcto — crear estas carpetas en el cloud nuevo de Savaya.
- **Cloudinary custom loaders** (`src/lib/cloudinary.ts`): la lógica de los loaders (`cloudinaryCoverLoader` con AI focal point 3:4, `cloudinaryContainLoader` para galería PDP) es correcta y reutilizable como patrón.
- **`vercel.json` rewrites:** la lógica de proxy `/cp/*` → `savaya-landing.vercel.app` y el cron de limpieza de comprobantes tienen sentido. Reutilizar la estructura.
- **Meta Pixel ID `27355395054120748`:** confirmado como Pixel propio de Savaya (usado activamente en `campanas/`). Reutilizar en la tienda.
- **Pendiente crear:** cuenta/cloud Cloudinary propia de Savaya (ver Fase 5.1).

### 5.4 Variables de entorno necesarias (nombres, sin valores)

| Variable | Origen | Nota |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | nueva | URL de producción de savaya-tienda-nueva |
| `DATABASE_URL` | **reutilizar de savaya-tienda** | Connection string Postgres directo de Supabase (no el SDK JS) |
| `DIRECT_URL` | **reutilizar de savaya-tienda** | URL directa para migraciones de Drizzle (pooler no funciona con drizzle-kit) |
| `AUTH_SECRET` | nueva | Secret de Auth.js v5 — generar con `openssl rand -base64 32` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | **crear cuenta nueva Savaya** | Cloud name del nuevo Cloudinary de Savaya |
| `CLOUDINARY_API_KEY` | **crear cuenta nueva Savaya** | — |
| `CLOUDINARY_API_SECRET` | **crear cuenta nueva Savaya** | — |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | dato real | `584141100100` |
| `UPSTASH_REDIS_REST_URL` | nueva | Upstash para rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | nueva | — |
| `RESEND_API_KEY` | nueva o reutilizar | Verificar si la cuenta es de Tuluoshop o de Savaya |
| `CRON_SECRET` | nueva | Para proteger los endpoints de cron |
| `NEXT_PUBLIC_GA4_ID` | **crear cuenta nueva Savaya** | GA4 propio de Savaya |
| `NEXT_PUBLIC_META_PIXEL_ID` | **reutilizar** | `27355395054120748` — Pixel propio de Savaya, activo en campanas |
| `META_CAPI_ACCESS_TOKEN` | nueva | Generar token de acceso en Meta Business para la tienda |
| `SENTRY_DSN` | nueva | Proyecto Sentry para savaya-tienda-nueva |
| `EXCHANGE_RATE_API_KEY` | nueva | Si el proveedor BCV elegido lo requiere |

### 5.5 Flujo de compra venezolano — preservar y mejorar

Este es el activo más valioso de `savaya-tienda`. El checkout está adaptado a la realidad del e-commerce venezolano y debe trasladarse a `savaya-tienda-nueva` con mejoras, no reemplazarse por un flujo genérico.

**Lo que funciona bien y debe mantenerse:**

- **Múltiples métodos de pago manual:** Zelle (USD), Pago Móvil (Bs.), Transferencia bancaria (Bs.), USDT TRC20, Binance Pay, Efectivo (retiro). Cada método tiene instrucciones y campos específicos — no un formulario genérico que no aplica a todos.
- **Reservas parciales:** el cliente puede pagar 20%, 35% o 50% como adelanto y saldo contra entrega. Lógica implementada en `PaymentForm.tsx` — trasladar al dominio `checkout/` con validación server-side.
- **Precio en USD + equivalente en Bs.:** el precio de referencia es USD, con la conversión a Bs. mostrada en tiempo real usando la tasa BCV. El monto a pagar en Bs. se congela al momento del checkout (no se recalcula silenciosamente después).
- **Upload de comprobante:** drag/drop en desktop, tap en mobile, enviado directamente a Cloudinary (carpeta privada), con nombre no predecible. El admin lo ve en la pantalla de verificación de pago.
- **Tres tipos de entrega:** delivery a domicilio (solo Carabobo, precio por municipio), envío nacional por agencia (Zoom, Tealca, MRW), retiro en tienda.
- **Confirmación vía WhatsApp:** al final del checkout, el cliente puede abrir un mensaje pre-llenado en WhatsApp con número de pedido, productos, total y método de pago. No es automático — el cliente lo decide.
- **Pedido en estado PENDING_PAYMENT:** el pedido se crea antes de que el pago sea verificado. El admin lo aprueba manualmente al confirmar el comprobante. Este flujo es correcto para Venezuela donde no hay pasarela automática dominante.

**Lo que debe mejorar en `savaya-tienda-nueva`:**

| Problema actual | Mejora propuesta |
|---|---|
| `shippingCost` aceptado del cliente sin revalidar | Calcular y congelar en servidor al confirmar el paso de entrega |
| Métodos de pago hardcodeados en el componente | Sacarlos de la DB (tabla `PaymentMethod`), editables desde el admin sin deploy |
| Reservas parciales hardcodeadas (20/35/50%) | Porcentajes configurables en `store_settings` |
| Sin idempotencia explícita en doble submit | Idempotency key en la creación del pedido |
| Rate limiter roto en checkout | Upstash con límite real por IP y por usuario |
| Cuentas bancarias hardcodeadas en el código | Editables desde admin (4.11), nunca en código |
| Mensaje WhatsApp generado con string concatenado | Helper centralizado en dominio `notifications` |
| UI de selección de método sin estados de error claros | Estados de error, vacío y carga por método |

---

## 6. Datos de negocio reales

### Métodos de pago activos (todos habilitados, datos a completar en settings)

| Método | Tipo |
|---|---|
| Zelle | USD — titular + email/teléfono |
| Binance Pay | Cripto — Pay ID |
| USDT | TRC20 — dirección de wallet |
| Transferencia bancaria venezolana | Bs. — banco, tipo, número, titular, CI/RIF |
| Pago móvil | Bs. — banco, teléfono, CI/RIF |
| Efectivo | Retiro en tienda |

El negocio admite además **reservas parciales** (20%, 35%, 50% del total) — lógica implementada en `PaymentForm.tsx` y que debe trasladarse a `savaya-tienda-nueva`.

### Zonas de delivery activas

- **Nacional por agencia:** Zoom, Tealca, MRW. Cobertura: las 21 ciudades de `SAVAYA_CITIES`.
- **Delivery a domicilio:** solo Carabobo (14 municipios). Precio dinámico por municipio, configurable en `store_settings.shipping_prices.delivery`.
- **Retiro en tienda:** CC Multi Tienda God is Good, local A-4, Valencia.

### Tarifas base

- Envío estándar: **$5 USD** (calculado por ciudad; este es el fallback).
- Envío express: **$10 USD**.
- Umbral envío gratis: **$80 USD** en subtotal.
- Retiro en tienda: **gratis**.
- Delivery domicilio (Carabobo): precio configurable por municipio en DB.

### Información de brand

- WhatsApp oficial: `584141100100` (el número `+58 424-4426241` que aparece en algunas páginas es incorrecto — pertenece a otro contexto).
- Meta Pixel: `27355395054120748` (compartido con el proyecto `campanas`).
- Cloudinary cloud: `dckobjcbj`.

---

## 7. Resumen final

**¿Algún hallazgo cambia la arquitectura ya decidida en `PROJECT-PLAN.md`?**

No. La arquitectura decidida en `PROJECT-PLAN.md` (Drizzle ORM + Neon + Auth.js v5 + Upstash + Zod + arquitectura por dominios) es la respuesta correcta exactamente a los problemas que tiene `savaya-tienda`:

1. **La ausencia de ORM** en el proyecto actual genera castings manuales con `unknown as` en decenas de lugares y hace imposible garantizar type-safety entre la DB y el código. Drizzle resuelve esto con tipos inferidos. **No cambiar la decisión.**

2. **El rate limiter in-memory** no funciona en serverless. Upstash Redis es la solución correcta y ya está en el plan. **No cambiar la decisión.**

3. **La arquitectura plana en `/components`** produce los componentes de 700+ líneas que se ven hoy. La estructura por dominios de `PROJECT-PLAN.md` previene exactamente esto. **No cambiar la decisión.**

4. **Una alerta de datos operacional:** el número de WhatsApp en páginas legales (`+58 424-4426241`) es diferente al número oficial en `constants.ts` (`584141100100`). Esto debe resolverse en Fase 1 al escribir el copy real de `savaya-tienda-nueva`, no es un problema de arquitectura.

5. **Los tres emails transaccionales** llevan el logo de Tuluoshop hardcodeado. En `savaya-tienda-nueva` los emails deben parametrizar el nombre de la marca desde `env` o constante central — nunca hardcodeado en la plantilla. Esto es un patrón a implementar correctamente desde el principio.

6. **El prefijo `TUL-` en números de pedido** es un bug de branding activo en producción. En `savaya-tienda-nueva` el prefijo debe ser `SAV-`. Definirlo en una constante centralizada del dominio `orders`, nunca inline.

En resumen: `savaya-tienda` cumplió su función de validar el modelo de negocio, pero fue construido como fork acelerado de Tuluoshop y acumula deuda desde el día 1. El valor reutilizable está en dos cosas: los **datos de negocio** (constantes de dominio, copy revisado) y el **flujo de compra venezolano** (múltiples métodos de pago manual, reservas parciales, verificación de comprobante, entrega por agencias) que ya fue validado con clientes reales. La decisión de reconstruir desde cero en `savaya-tienda-nueva` está justificada — el objetivo no es tirar ese aprendizaje sino llevarlo a una implementación limpia, sin los problemas de seguridad y mantenibilidad actuales.

**IMPORTANTE:** el cloud de Cloudinary encontrado en `savaya-tienda` pertenece a Tuluoshop — crear cuenta Cloudinary propia de Savaya antes de la Fase 5.1. El Pixel de Meta `27355395054120748` sí es de Savaya (activo en `campanas/`) y se reutiliza en la tienda.
