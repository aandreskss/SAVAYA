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
- **`revalidatePath`**: toda mutación de CMS (secciones, banners, popups) debe llamar `revalidatePath('/')` Y `revalidatePath('/admin/contenido')`. Sin el primero la Home no se refresca.
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

### 8.7 Base de datos — guardas defensivas

- Toda función del storefront repository que haga queries debe tener:
  1. `if (!process.env.DATABASE_URL) return <fallback>`
  2. `try/catch` con `console.error('[dominio/repo] función failed:', error)` y return del fallback.
- El admin repository no necesita ese patrón (si el admin no tiene DB, que falle explícitamente).
