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
- **PostgreSQL** (Neon recomendado por branching serverless; Vercel Postgres o Supabase Postgres son alternativas válidas — decisión final documentada en `docs/adr/002-database.md`).
- **Drizzle ORM** (TypeScript-first, SQL explícito, mejor rendimiento en serverless/edge que Prisma, migraciones con `drizzle-kit`). Justificación completa en `docs/adr/002-orm.md`.
- **Auth.js (NextAuth v5)** con credentials + verificación por email; sesiones en cookies `HttpOnly`, `Secure`, `SameSite=Lax`; reautenticación obligatoria para acciones admin sensibles; **2FA (TOTP)** obligatorio para roles Admin/Super Admin.
- **Zod** para toda validación de entrada, compartido entre client y server donde aplique.
- **Zustand** solo para estado de UI efímero (drawer del carrito abierto/cerrado, etc.) — nunca para precios/stock/totales, eso vive en servidor.
- **Cloudinary** como sistema de media: carpetas públicas (`savaya/products`, `savaya/categories`, `savaya/banners`, `savaya/editorial`, `savaya/cms`) vs. carpeta privada (`savaya/private/payment-proofs`) con upload firmado, tipo `private`/`authenticated`, URLs firmadas temporales.
- **Búsqueda**: Postgres full-text (`tsvector`) + `pg_trgm` para tolerancia a typos, detrás de una interfaz `SearchProvider` (permite migrar a Meilisearch/Algolia después sin tocar el resto del código, sin instalarlo ahora).
- **Upstash Redis + @upstash/ratelimit** para rate limiting (login, registro, checkout, upload, búsqueda, APIs públicas).
- **Tasas BCV**: abstracción `ExchangeRateProvider` (ver Fase 5.2) — nunca llamar a una API externa directamente desde un componente o ruta suelta.
- **Odoo (ERP del cliente)**: fuente de verdad del stock físico y la contabilidad de la operación al detal (almacén "Detal" separado del de mayoreo); la tienda es fuente de verdad del catálogo enriquecido. Toda comunicación pasa por `domains/integrations/odoo` — ver ADR 007. No implementar sin haber cerrado la Fase 0B (auditoría real de la instancia de Odoo del cliente).
- **Vitest** + Testing Library (unit/integration), **Playwright** (E2E).
- **Sentry** (errores) + Vercel Analytics/Speed Insights (performance real).
- Hosting: **Vercel**. Media: **Cloudinary**. DB: **Neon**.

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
    integrations/
      odoo/                 # única capa que habla con el Odoo del cliente (ver ADR 007)
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

## 8. Convenciones implementadas (patrones establecidos en desarrollo — no los redefinas)

Esta sección documenta decisiones que ya se tomaron y están en el código. No las reimplementes ni crees alternativas sin revisar lo que hay primero.

### 8.1 Sistema CMS de bloques

- **`BLOCK_SCHEMAS`** en `src/domains/cms/block-schemas.ts` es el registro central. Todo tipo de bloque nuevo debe registrarse ahí.
- **`banner_row` es especial**: su schema es `z.object({})` (sin contenido almacenado). El `BlockRenderer` lo maneja aparte llamando a `getBanners(new Date())` en tiempo de render — nunca guarda datos en `page_sections.content` para ese tipo.
- **`BlockRenderer`** (`src/domains/cms/BlockRenderer.tsx`) es el único lugar donde un tipo de bloque se mapea a un componente. Si agregas un tipo nuevo, es el único archivo que cambia (más el schema y el componente propio).
- **Guards obligatorios en `BlockRenderer`**: cualquier bloque que use `<Image src={url}>` con URL requerida (hero, split_block, editorial_block) o que haga `.map()` sobre un array requerido (shop_by_category, benefits_block, social_proof_grid) **debe** verificar que esos campos existan antes de renderizar, o retornar `null`. Sin el guard, un bloque recién creado con contenido vacío crashea la página entera.
- **`parseSections` en `service.ts` — validación en dos etapas**: primero intenta `schema.safeParse()` estricto; si falla, hace fallback con `schema.partial().safeParse()` para bloques en proceso de configuración (contenido `{}`). Si la validación parcial también falla, el bloque se omite. Esto permite que bloques recién agregados (aún sin configurar) pasen al `BlockRenderer`, que decide si renderizar o retornar `null` según los guards.
- **`revalidatePath`**: toda mutación de CMS (secciones, banners, popups) debe llamar `revalidatePath('/')` Y `revalidatePath('/admin/contenido')`. Sin el primero la Home no se refresca.
- **Contenido por defecto al crear un bloque**: en `createSectionAction` (y cualquier lugar que construya contenido inicial) usa SIEMPRE `schema.safeParse({}).data ?? {}`. **Nunca uses `schema.parse({})`** — `parse` lanza `ZodError` si el schema tiene campos requeridos sin default (ej. `HtmlBlockSchema`, `HeroSchema`) y eso convierte la acción en un HTTP 500 no manejado.
- **Contenido de bloque tipado con Zod**: nunca uses `as any` para el contenido de un bloque. El cast correcto es `block.content as BlockContent<'tipo'>`.

### 8.2 Teléfonos y WhatsApp

- **Siempre normaliza** números venezolanos con `toWaPhone()` de `src/shared/lib/phone.ts` antes de construir enlaces `wa.me/`.
- Formatos manejados: `04XX...` → `584XX...`, `+584XX...` → `584XX...`, `584XX...` → sin cambio.
- No uses `+` en la URL de wa.me (el prefijo `58` sin `+` es el formato correcto).

### 8.3 URL Picker (campos de URL en el CMS)

- El componente `UrlPicker` (`src/shared/ui/UrlPicker.tsx`) reemplaza todos los `<input type="text">` de URLs en el CMS admin.
- Usa `createPortal(dropdown, document.body)` para escapar padres con `overflow:hidden` — es la solución ya implementada, no inventes otra.
- Las opciones (categorías, colecciones, productos) se cargan lazy desde `getSiteUrlOptionsAction()` en el primer open. No precargues en el render del formulario.

### 8.4 Popups

- **SessionStorage key incluye `updatedAt`**: `popup_shown_${id}_${new Date(updatedAt).getTime()}`. Esto permite que cada edición desde el admin resetee el contador del navegador. No cambies esto a solo `popup_shown_${id}` — eso fue el bug original.
- `getActivePopup` en el storefront repository tiene `try/catch` con `console.error` — si el popup no aparece, revisa los logs del servidor, no solo el cliente.

### 8.5 Variantes de producto

- **Soft delete vs hard delete**: una variante con historial en `inventory_movements` se desactiva (`isActive: false`), nunca se borra — la tabla de movimientos es audit trail append-only. Solo se borra físicamente si no tiene ningún movimiento. Esta lógica vive en `updateProduct` de `src/domains/admin/catalog/repository.ts`.
- **Variantes inactivas en storefront**: no se muestran (desaparecen del selector, no aparecen tachadas). Solo las activas sin stock se muestran tachadas con línea diagonal. Esta distinción está en `ProductVariantSelector.tsx`.

### 8.6 Importación masiva de productos (CSV)

Ruta: `POST /api/admin/catalog/import` → `src/app/api/admin/catalog/import/route.ts`  
Helpers: `src/domains/admin/catalog/import-helpers.ts`  
UI: `src/domains/admin/catalog/components/ImportProductsForm.tsx`  
Página admin: `/admin/productos/importar` → `src/app/admin/productos/importar/page.tsx`  
Plantilla: `public/samples/savaya-productos-ejemplo.csv`

**Formato CSV — dos niveles con columna `tipo`:**
- `tipo=producto`: nombre, categoria, genero, precio_base, precio_comparacion, descripcion
- `tipo=variante`: color, hex_color, talla, sku_ref, precio, cantidad
- Filas variante pertenecen al último producto declarado arriba

**Lógica de SKU (`resolveVariantSkus` en import-helpers.ts):**
- `sku_ref` compartido por múltiples colores → SKU = `{sku_ref}-{COLOR_ABBR}-{talla}` (ej. `SAN-001-ROJ-36`)
- `sku_ref` exclusivo de un color → SKU = `{sku_ref}-{talla}` (ej. `SAN-002-36`)
- `COLOR_ABBR` = primeras 3 letras del color sin tildes en mayúsculas
- Colisiones de abreviatura → sufijo `-2`, `-3`…
- Si `sku_ref` está vacío → usa `slugify(nombre)` como prefijo

**Flujo del route handler:**
1. Auth (`catalog:write`)
2. Parseo CSV → `parseImportCsv()` → grupos producto+variantes
3. Por grupo: check duplicado por nombre (ilike) → lookup categoría → upsert colores y tallas (ilike, crea si no existe) → genera SKUs → slug único
4. Transacción: INSERT products (isActive=false, publishedAt=null) + productVariants + inventory + inventoryMovements(purchase) + auditLog
5. Retorna `{ total, created, skipped, errors, variantsCreated, results }`

**Iconos:** este proyecto NO tiene `lucide-react`. Usar caracteres Unicode (↑ ↓ ✓ ✕ ⚠ ↺) o SVG inline — nunca importar lucide.

### 8.8 Edición de colores en el tab de variantes

- `updateColor(id, name, hex, hex2)` en `src/domains/admin/catalog/repository.ts` y `updateColorAction` en `actions.ts` son las únicas vías para modificar un color existente.
- Al guardar una edición de color, `VariantsTab` actualiza **dos cosas en el mismo callback**: la lista `colors` vía `onColorsChange` y todos los `VariantRow` que referencian ese `colorId` (campos `colorName`, `colorHex`, `colorHex2`). Nunca actualices solo uno de los dos o el UI queda inconsistente.
- El formulario de edición se muestra **sobre** los pills de color (no debajo de la tabla de variantes). El botón lápiz aparece en hover por cada pill; clic de nuevo cancela.
- Cuando `editingColorId` está activo, abrir el formulario de "Nuevo color" lo cancela automáticamente (`setShowColorForm(false)` dentro de `openEditColor`), y viceversa.

### 8.9 Registro de visitas propio (page_views)

- **Tabla `page_views`** en `src/domains/analytics/schema.ts`: registra path, referrer (solo hostname), sessionId, country, city, deviceType, browser, os. Append-only — sin updatedAt.
- **API route `POST /api/track/pv`** (`src/app/api/track/pv/route.ts`): filtra bots por user-agent, extrae geo desde headers de Vercel (`x-vercel-ip-country`, `x-vercel-ip-city`) sin servicio externo, parsea UA con regex simples sin librería. Nunca lanza error — el tracking no puede romper la tienda.
- **`SiteTracker`** (`src/domains/analytics/SiteTracker.tsx`): componente cliente montado en el shop layout (no en el admin). Usa `usePathname` para detectar cambios de ruta y `fetch` con `keepalive: true`. Genera `sessionId` con `crypto.randomUUID()` en `sessionStorage` (clave `sva_sid`) — se renueva cuando el usuario cierra la pestaña.
- **Referrer**: se normaliza a hostname (`instagram.com`, no la URL completa) en el route handler con `new URL(referrer).hostname`.
- **Queries**: `getTrafficSummary(days)` en `src/domains/analytics/repository.ts` lanza 7 queries en paralelo (`Promise.all`): totales, top páginas, países, referrers, dispositivos, browsers, visitas por día agrupadas en zona horaria `America/Caracas`.
- **Panel admin** (`/admin/analytics`): server component con `searchParams` para filtro de 7/30/90 días. Muestra KPIs, gráfica SVG de barras por día, top páginas, países, dispositivos, browsers, referrers. No usa librería de gráficas — SVG inline.
- **No trackear el admin**: `SiteTracker` está SOLO en `src/app/(shop)/layout.tsx`, nunca en el admin layout.

### 8.7 Base de datos — guardas defensivas

- Toda función del storefront repository que haga queries debe tener:
  1. `if (!process.env.DATABASE_URL) return <fallback>`
  2. `try/catch` con `console.error('[dominio/repo] función failed:', error)` y return del fallback.
- El admin repository no necesita ese patrón (si el admin no tiene DB, que falle explícitamente).

### 8.10 Productos VIP

- **Columna `is_vip` boolean** en la tabla `products` (migración `0008_vip_smart_collections.sql`). Default `false`.
- **`ProductCard`**: cuando `isVip=true` muestra ring dorado (`ring-2 ring-[#CA8C31] ring-offset-2`) sobre la imagen + pill "★ VIP" en esquina superior izquierda. Badges normales (`new`, `sale`, etc.) se suprimen cuando `isVip=true` — nunca los muestres juntos.
- **`VipProductsSection`** (`src/domains/catalog/components/VipProductsSection.tsx`): server component que consulta `{ onlyVip: true, limit: 6, sortBy: 'featured' }`. Se inserta en la home inmediatamente después del bloque `hero` junto con `CategoryPillsRow`. Si no hay productos VIP, devuelve `null` silenciosamente.
- **Storefront**: todo `<ProductCard>` en todas las PLPs debe recibir `isVip={product.isVip}` y calcular badges como `badges={product.isVip ? undefined : [...]}`.
- **Filtro en repositorio**: `getProducts` acepta `onlyVip?: boolean` que agrega `WHERE is_vip = true`. El storefront `/catalogo` acepta `?vip=1` como searchParam para filtrar VIP.

### 8.11 Smart Collections (colecciones con filtros automáticos)

- **Columna `filter_rules` JSONB** en la tabla `collections`. Null = colección manual; cuando tiene valor, los productos se generan dinámicamente.
- **Tipo `CollectionFilterRules`** (`src/domains/catalog/repository.ts`): `{ onlyNew?, onlyFeatured?, onlyVip?, colorIds?, sizeIds?, priceMin?, priceMax? } | null | undefined`.
- **Storefront** (`src/app/(shop)/coleccion/[slug]/page.tsx`): si `collection.filterRules` tiene valor, construye `ProductFilters` desde las reglas (sin `collectionSlug`) y pasa a `getProducts`. Si no tiene valor, usa `{ collectionSlug: slug }` normal. Los filtros de URL pueden refinar encima de las reglas (sort, etc.).
- **Admin `CollectionEditor`**: contiene `FilterRulesPanel` que permite activar filtros automáticos con toggles (onlyNew/Featured/Vip), pills de color/talla, rango de precio. Cuando `filterState.enabled = true`, el `ProductsPanel` manual se oculta automáticamente. `filterStateToRules()` convierte el estado local al JSONB que se guarda.
- **`listAdminCollections`** devuelve `hasFilterRules: boolean` para que la lista de colecciones pueda mostrar un indicador.

### 8.12 Cloudinary — upload de imágenes de colección

- **Ruta de firma**: `GET /api/admin/catalog/upload-collection-signature` — misma estructura que `/api/admin/catalog/upload-signature` (productos) pero usa carpeta `savaya/categories` y `publicId = collection-{uuid}`. Requiere permiso `catalog:write`.
- **Componente `CollectionImageUpload`** (inline en `CollectionEditor.tsx`): zona drag-and-drop + click. Al montar sin imagen muestra un área punteada de 112px. Con imagen muestra preview `h-32 object-cover` con overlay hover de "Cambiar" y botón ✕. Hint de tamaño recomendado: **1600 × 600 px · ratio 8:3**.
- **Flujo de upload**: `GET signature` → si `isDev` usa `URL.createObjectURL` localmente → si prod hace `POST FormData` a `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` → extrae `secure_url`.
- **Patrón de firma (SHA-1)**: `folder={folder}&public_id={publicId}&timestamp={timestamp}` + apiSecret. Los parámetros deben ir **ordenados alfabéticamente** antes de concatenar el secret.
- **Carpetas Cloudinary por entidad**: products → `savaya/products`, collections → `savaya/categories`, banners/cms → `savaya/banners` / `savaya/cms`. No mezcles carpetas entre entidades.

### 8.13 Inventario — selección y exportación CSV

- **Selección múltiple**: `InventoryTable` mantiene `selectedIds: Set<string>` (por `variantId`). Checkbox en cada fila + checkbox de cabecera con estado indeterminate (via `ref callback`: `el.indeterminate = someDisplaySelected`). El estado indeterminate no es controlable por React attr, debe setearse directo en el DOM.
- **Exportación CSV**: `downloadCsv(selected: InventoryRow[])` — crea Blob `text/csv`, genera URL con `URL.createObjectURL`, dispara descarga vía `<a>.click()`, revoca con `URL.revokeObjectURL`. Sin dependencias externas. Columnas: `sku, producto, color, talla, stock_actual, cantidad` (cantidad pre-rellena con stock actual para facilitar edición).
- **Formato compatible**: el CSV exportado usa el mismo formato que acepta `InventoryImportModal` (`sku` + `cantidad`), de modo que el flujo es: exportar → editar cantidad → reimportar.
- **Barra de selección**: aparece solo cuando `selectedIds.size > 0`. Muestra conteo, botón "Deseleccionar ×" y botón dorado "Descargar CSV (N)".

### 8.14 Imagen de portada en página de colección (storefront)

- `getCollectionBySlug` devuelve `imageUrl: string | null` — ya incluido en el SELECT y en el tipo `CollectionDetail`.
- La página `/coleccion/[slug]` renderiza la imagen como banner **entre el breadcrumb y el título** (`h-40 md:h-60 object-cover`, `rounded-xl`). Si `imageUrl` es null, el banner no se renderiza y el margen superior del título ajusta automáticamente.
- No uses `<Image>` de Next.js para este banner (la URL viene de Cloudinary y ya está optimizada); usa `<img>` con el comentario `{/* eslint-disable-next-line @next/next/no-img-element */}`.

### 8.15 ProductCarousel — inicialización de estado de scroll

- `canScrollRight` se inicializa en `true` pero debe medirse desde el DOM real al montar. Sin `useEffect`, las flechas de navegación aparecen en desktop (donde el contenedor es un `md:grid` sin overflow) y no hacen nada al clic.
- **Siempre agrega `useEffect(() => { updateScrollState() }, [updateScrollState])`** junto al `onScroll` handler. Esto garantiza que las flechas solo aparezcan cuando realmente hay contenido fuera del viewport.

### 8.17 Navbar dinámico desde DB

- **Tabla `nav_items`** en `src/domains/cms/schema.ts`: campos `label`, `href`, `type` (`link` | `category_group`), `gender` (nullable, `mujer` | `hombre`), `sort_order`, `is_active`.
- **`buildNavCategories()`** en `src/domains/cms/repository.ts`: obtiene nav_items activos + subcategorías desde DB. Para `category_group`, las subcategorías son categorías con `gender = item.gender OR gender = 'unisex'`.
- **`Navbar.tsx`** es async server component — llama a `buildNavCategories()` directamente. No más `NAV_CATEGORIES` estático de `nav-config.ts`.
- **Admin:** pestaña "Navbar" en Contenido → `NavbarEditor.tsx` — CRUD completo de nav_items con reordenamiento (↑ ↓), toggle activo/inactivo, crear/editar/eliminar.
- **Categorías con género:** tabla `categories` tiene columna `gender` (`mujer` | `hombre` | `unisex`, default `unisex`). El admin de categorías muestra un select de género. Las categorías `unisex` aparecen en ambos dropdowns (Mujer y Hombre).
- **Revalidación:** toda mutación de nav_items llama `revalidatePath('/', 'layout')` para refrescar el navbar en todo el sitio.

### 8.18 UrlPicker — páginas estáticas completas

- El array `STATIC_PAGES` en `src/shared/ui/UrlPicker.tsx` incluye: `/`, `/mujer`, `/hombre`, `/nuevos`, `/ofertas`, y las páginas informativas. Agregar rutas nuevas del sitio aquí cuando se creen.

### 8.19 Custom Pages Builder (`/p/[slug]`)

- **Ruta storefront**: `src/app/(shop)/p/[slug]/page.tsx` — siempre `export const dynamic = 'force-dynamic'`, dentro del grupo `(shop)` para heredar navbar y footer automáticamente.
- **Prefijo en DB**: las custom pages se almacenan en la tabla `pages` con slug `p/[slug]` (ej. `p/ofertas-verano`). En el admin, el slug se muestra sin el prefijo. Nunca omitas el prefijo `p/` al hacer queries desde el storefront.
- **`getCustomPageSections(slug)`** en `src/domains/cms/repository.ts`: retorna `null` si la página no existe o no está activa (→ 404 en storefront), `[]` si existe pero no tiene secciones activas, o el array de secciones ordenado por `sortOrder`.
- **Admin**: pestaña "Páginas" en `/admin/contenido` → `PagesManager.tsx` (client component). Vista lista (crear/editar/eliminar páginas) + vista edición (usa `HomeSectionsEditor` con `pageSlug='p/slug'` y `pageLabel=title`).
- **Tipos de bloque disponibles**: todos los del CMS existente + `product_grid` + `html_block`. Enum `page_section_type` fue extendido con `ALTER TYPE ... ADD VALUE IF NOT EXISTS` en migración `scripts/run-migration-010.js`.
- **`product_grid`**: grilla de productos configurable — fuente por filtro (`source` enum) o slugs manuales (uno por línea), o ambos (se unen y deduplicados por `id`). Schema: `ProductGridSchema` — todos los campos opcionales o con default, por lo que aparece inmediatamente al agregarlo.
- **`getSiteUrlOptionsAction`** incluye `pages: SiteUrlOption[]` para que el UrlPicker muestre custom pages como destino en campos de URL del CMS.
- **`revalidatePath` y custom pages**: las mutaciones de secciones (crear, guardar, reordenar, toggle, eliminar) llaman `revalidatePath('/')` pero NO `revalidatePath('/p/slug')`. Esto es correcto porque la página usa `force-dynamic` y siempre sirve datos frescos desde DB. Si alguna vez se cambia a ISR/caching, habría que agregar la revalidación explícita del path `/p/[slug]`.

### 8.20 HtmlBlock — procesamiento de contenido

- **`processHtml(raw)`** en `src/domains/cms/blocks/HtmlBlock.tsx`: función pura server-side que prepara HTML crudo antes de renderizarlo dentro del layout de la tienda.
- **Qué elimina**: `<html>`, `<head>`, `<body>` wrappers; la sección `<header>…</header>` completa (el layout provee el navbar real); la sección `<footer>…</footer>` completa (el layout provee el footer real).
- **Qué preserva**: links de Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) extraídos del `<head>` y reinyectados fuera de él para que carguen correctamente en el body; todos los bloques `<style>` del HTML original (reinyectados como CSS con scope).
- **CSS scoping con `@scope`**: los estilos se envuelven en `@scope (.savaya-html-blk) { … }`. Dentro del scope, `:root` se reemplaza por `:scope` y `body { }` se reemplaza por `:scope { }` para que las custom properties y estilos de base apliquen solo dentro del bloque, sin derramarse al navbar o footer del sitio.
- **Wrapper**: el contenido queda dentro de `<div class="savaya-html-blk">`. No agregues padding ni max-width al wrapper externo — el HTML gestiona su propio layout.
- **Advertencia de seguridad**: `HtmlBlock` usa `dangerouslySetInnerHTML`. Solo admins con `cms:write` pueden subir HTML. No filtres ni escapes el HTML — se asume que el admin es de confianza.

### 8.16 SEO — structured data y metadatos

- **FAQPage JSON-LD** en `/preguntas-frecuentes/page.tsx`: se genera dinámicamente desde `FAQ_SECTIONS`. Al agregar una pregunta al array se refleja automáticamente en el schema. Habilita rich snippets de preguntas en la SERP de Google.
- **LocalBusiness (ClothingStore) JSON-LD** en `/tiendas/page.tsx`: incluye dirección, coordenadas geo, horario, teléfono y sameAs. Alimenta el Knowledge Panel y el map pack local para búsquedas en Valencia/Carabobo.
- **OpenGraph en PLPs**: las páginas `/categoria/[slug]` y `/coleccion/[slug]` tienen metadata OG completa (title, description, url, siteName, locale). La colección usa `collection.imageUrl` como OG image cuando existe (URL de Cloudinary, 1600×600).
- **Sitemap dinámico** (`src/app/sitemap.ts`): incluye products, categories y collections desde la DB. Páginas estáticas incluyen `/hombre` (priority 0.9). Si agregas una ruta nueva al sitio, agrégala al array `STATIC_PAGES`.
- **Nunca hardcodees BASE_URL en páginas nuevas** — usa `process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'` (patrón ya establecido en categoria/coleccion) o la constante local `const BASE_URL = 'https://www.savayavzla.com'` (patrón en páginas estáticas).
- **`revalidate`**: páginas de contenido editorial estático (FAQ, Tiendas, etc.) usan `export const revalidate = 86400`. La home usa `revalidate = 3600`. Las PLPs dinámicas no declaran revalidate (Next.js las trata como dinámicas por los searchParams).
