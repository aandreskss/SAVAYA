# SEO.md — Estrategia SEO de SAVAYA

> Última actualización: 2026-08-15
> La implementación técnica es la Fase 5.5.

---

## 1. Metadata dinámica

Toda la metadata de SEO (title, description, canonical, OG, Twitter cards) se genera desde campos editables en el admin — **nunca hardcodeada en el componente**.

### Flujo de metadata

```
Admin edita campos SEO de producto/categoría/página
  └─► Guardado en DB (campo seo_title, seo_description, og_image, etc.)

Next.js generateMetadata() en la página de ruta
  └─► catalog/actions.ts → getProductSeoData(slug)
        └─► Devuelve campos SEO del registro o hace fallback a campos de negocio (nombre, descripción)
              └─► Metadata inyectada en el <head> del HTML del servidor
```

### Regla de fallback

Si el admin no ha llenado el campo SEO específico, se hace fallback automático:
- `seo_title` vacío → `{nombre del producto} | SAVAYA`
- `seo_description` vacío → primeros 160 caracteres de la descripción del producto
- `og_image` vacío → primera imagen del producto

El fallback funciona para todos los tipos de página — nunca se sirve metadata vacía.

### Estructura por tipo de página

| Página | title | description | canonical |
|---|---|---|---|
| Home | `SAVAYA — Calzado de autor venezolano` | Editable en admin (AboutPage settings) | `https://www.savayavzla.com/` |
| PLP categoría | `{nombre categoría} — SAVAYA` | Editable en admin (Category.seo_description) | `https://www.savayavzla.com/categoria/{slug}` |
| PDP producto | `{nombre} — {categoría} \| SAVAYA` | Editable en admin (Product.seo_description) | `https://www.savayavzla.com/producto/{slug}` |
| Nosotros | Editable | Editable | `https://www.savayavzla.com/nosotros` |
| Páginas legales | Editable | Editable | URL canónica propia |

---

## 2. Sitemap dinámico

- **Ruta:** `/sitemap.xml` generada por Next.js `sitemap.ts` en `app/`
- **Frecuencia de regeneración:** ISR con `revalidate = 3600` (1 hora)
- **Incluye:**
  - Home
  - Páginas de categoría publicadas (`/categoria/{slug}`) — solo categorías con `status = 'published'`
  - Productos publicados (`/producto/{slug}`) — solo productos con `status = 'published'`
  - Colecciones publicadas (`/coleccion/{slug}`)
  - Páginas de contenido publicadas (Nosotros, FAQ, etc.)
- **Excluye:**
  - `/admin/*` — panel de administración
  - `/api/*` — endpoints de API
  - `/dev/*` — páginas de desarrollo
  - Productos archivados o en borrador
  - URLs con parámetros de query (filtros, ordenamiento, paginación con `?page=N`)
  - Cualquier URL marcada con `noindex`
  - `/carrito`, `/checkout`, `/mi-cuenta` — páginas de usuario

---

## 3. Regla de indexación de filtros del PLP

El PLP tiene filtros combinables via query params (`?talla=38&color=negro&precio_min=50`). La mayoría de estas combinaciones no tienen valor SEO y no deben ser indexadas.

### Lo que SÍ es indexable

- La categoría base sin filtros: `/categoria/mujer`, `/categoria/running`
- La categoría con **exactamente 1 filtro de valor SEO real**, y solo si esa combinación tiene suficiente volumen de productos (mínimo 4):
  - `/categoria/mujer?color=negro` — solo si hay >4 productos negros de mujer
  - `/categoria/running?coleccion=nuevos`

### Lo que va con `noindex`

Se agrega `<meta name="robots" content="noindex, follow">` y se excluye del sitemap cuando:

- 2 o más filtros están activos simultáneamente: `?talla=38&color=negro`
- Filtros de precio (rangos no tienen valor SEO predictable): `?precio_min=50&precio_max=100`
- Filtros de disponibilidad: `?disponible=true`
- Cualquier filtro de paginación: `?pagina=2`, `?pagina=3` (la paginación clásica sí puede ser indexable si la decide el equipo — [PENDIENTE: confirmar estrategia de paginación])
- Ordenamiento explícito: `?orden=precio_asc`

### Implementación

La lógica de `noindex` se evalúa en `generateMetadata()` de cada ruta PLP, leyendo los `searchParams` activos. El middleware no hace nada especial — la metadata es suficiente.

```ts
// Regla en generateMetadata del PLP
const activeFilters = parseActiveFilters(searchParams)
const shouldNoIndex =
  activeFilters.count >= 2 ||
  activeFilters.hasPriceFilter ||
  activeFilters.hasAvailabilityFilter ||
  activeFilters.hasSortParam

if (shouldNoIndex) {
  return { robots: { index: false, follow: true } }
}
```

---

## 4. Structured data (JSON-LD)

Inyectado como `<script type="application/ld+json">` en el `<head>` desde Server Components — sin librería externa para generarlo.

### Product (en cada PDP)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{nombre del producto}",
  "description": "{descripción}",
  "sku": "{SKU de la variante seleccionada o primera disponible}",
  "image": ["{url de cada imagen del producto}"],
  "brand": {
    "@type": "Brand",
    "name": "SAVAYA"
  },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "{precio mínimo entre variantes}",
    "highPrice": "{precio máximo entre variantes}",
    "priceCurrency": "USD",
    "availability": "{InStock / OutOfStock según stock real}",
    "seller": {
      "@type": "Organization",
      "name": "SAVAYA"
    }
  }
}
```

### Organization (en Home y páginas estáticas)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SAVAYA",
  "url": "https://www.savayavzla.com",
  "logo": "{URL del logo en Cloudinary}",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+58-414-1100100",
    "contactType": "customer service"
  },
  "sameAs": [
    "https://www.instagram.com/Savayavzla"
  ]
}
```

### BreadcrumbList (en PDP y PLP)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.savayavzla.com" },
    { "@type": "ListItem", "position": 2, "name": "{Categoría}", "item": "https://www.savayavzla.com/categoria/{slug}" },
    { "@type": "ListItem", "position": 3, "name": "{Nombre del producto}" }
  ]
}
```

---

## 5. Robots.txt

```
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /dev/
Disallow: /carrito
Disallow: /checkout
Disallow: /mi-cuenta

Sitemap: https://www.savayavzla.com/sitemap.xml
```

---

## 6. URLs canónicas

La URL canónica de cada página elimina los parámetros de query. Se inyecta como `<link rel="canonical">` en el `<head>`.

| Tipo | URL canónica |
|---|---|
| PDP producto | `/producto/{slug}` — sin parámetros |
| PLP categoría | `/categoria/{slug}` — sin parámetros de filtro |
| PLP categoría + 1 filtro indexable | `/categoria/{slug}?{param}={valor}` — solo en el caso permitido |
| Home | `https://www.savayavzla.com/` — con trailing slash |

Regla general: la canonical apunta siempre a la versión limpia de la URL, independientemente de los filtros activos en la URL del usuario.

---

## 7. Core Web Vitals — objetivos

| Métrica | Objetivo | Estrategia principal |
|---|---|---|
| LCP | < 2.5s | `next/image` con `priority` en hero y primera imagen del PDP; imágenes servidas desde Cloudinary con tamaño adecuado al viewport; sin recursos bloqueantes antes del hero |
| INP | < 200ms | Minimizar "use client" innecesario; sin hidratación de componentes que no la necesitan; code splitting por ruta |
| CLS | < 0.1 | `aspect-ratio` fijo en todas las imágenes de producto (3:4); reservar espacio para fuentes con `font-display: swap`; sin layout shifts en la carga del header |

---

## 8. Imágenes y Cloudinary

- **`next/image` siempre** para imágenes de contenido — nunca `<img>` suelto para imágenes de producto, categorías o banners
- **`priority={true}`** en:
  - La imagen hero de la Home (LCP candidate)
  - La primera imagen en el PDP (LCP candidate)
  - La primera imagen visible en el PLP (arriba del fold)
- **srcset via Cloudinary:** el custom loader de Cloudinary genera la URL con transformaciones de tamaño. Next.js genera el `srcset` automáticamente a partir de los `sizes` configurados. El browser descarga solo el tamaño necesario para el viewport
- **Formato moderno:** Cloudinary sirve `webp` o `avif` automáticamente via transformación `f_auto`
- **Compresión:** `q_auto` en Cloudinary — calidad adaptativa sin sacrificar percepción visual
- **Lazy loading por defecto:** todo `next/image` sin `priority` tiene `loading="lazy"` por defecto

### Tamaños declarados para srcset por contexto

| Contexto | `sizes` |
|---|---|
| ProductCard en PLP | `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw` |
| Imagen hero PDP | `(max-width: 768px) 100vw, 55vw` |
| Hero de Home | `100vw` |
| CategoryCard | `(max-width: 640px) 40vw, 20vw` |
