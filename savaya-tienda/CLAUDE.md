# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Este proyecto

**Savaya Tienda** — tienda online de calzado femenino en Venezuela. Duplicada y adaptada desde **Tuluoshop** (mismo stack, misma arquitectura). Leer el CLAUDE.md de Tuluoshop para la arquitectura completa — este archivo solo documenta los **delta** respecto a Tuluoshop.

### Repositorio

- **GitHub:** `https://github.com/aandreskss/SAVAYA.git` (monorepo)
- **Estructura del monorepo:**
  ```
  SAVAYA/
  ├── savaya-tienda/   ← este proyecto (tienda Next.js)
  └── Campañas/        ← landings de conversión (HTML + serverless)
  ```
- **Rama principal:** `main`

### Vercel

- **Estado:** pendiente de vincular. Correr una vez `vercel --prod` desde `savaya-tienda/` para crear el proyecto en Vercel.
- **Dominio previsto:** `www.savayavzla.com` (actualmente apuntado al proyecto de Campañas — reasignar cuando la tienda esté lista).

---

## Comandos

```bash
npm run dev          # localhost:3000
npm run build        # build producción (type-check + lint incluidos)
npm run type-check   # TypeScript sin compilar
npm run lint         # ESLint
```

---

## Diferencias clave respecto a Tuluoshop

### Catálogo — solo calzado femenino
Tuluoshop vendía ropa/zapatos/accesorios para mujer/hombre/niños. Savaya es **100% calzado femenino**.

- `Gender` efectivo: solo `'women'`
- `ProductType` efectivo: solo `'shoes'`
- Categorías de navegación: `casuales` · `deportivos` · `de-vestir` · `nuevas-colecciones` · `descuentos` · `mas-vendidos`
- Las rutas `/hombre`, `/ninos`, `/accesorios`, `/ropa` **no aplican** — si existen en el código, ignorarlas o eliminarlas gradualmente
- Tallas: solo `SHOE_SIZES_WOMEN = ['35','36','37','38','39','40']`

### Branding
| Campo | Tuluoshop | Savaya |
|-------|-----------|--------|
| Fuente display | Playfair Display | **Bebas Neue** |
| Fuente body/heading | Inter + Montserrat | **Rubik** |
| Color accent | `#1A1A2E` (azul noche) | `#1A1A1A` (negro) |
| Color gold | `#C9A84C` | **`#CA8C31`** |
| Tagline | — | **"Marca tu moda"** |
| CSS variables | `--font-playfair`, `--font-montserrat` | `--font-bebas`, `--font-rubik` |
| Class `.font-display` | Playfair | Bebas Neue |
| Class `.font-heading` | Montserrat | Rubik |

Paleta dorada completa en `src/app/globals.css`:
- `--color-gold: #CA8C31` — dorado principal
- `--color-gold-light: #E5BB5B`
- `--color-gold-pale: #FFEA84`
- `--color-gold-warm: #E2A44F`
- `--color-gold-dark: #AA6E0B` — hover

### Datos de marca
```
Nombre:      Savaya
Tagline:     Marca tu moda
WhatsApp:    +58 414-1100100  →  584141100100
Email:       Savayarrss@gmail.com
Instagram:   @Savaya / @Savayavzla
Dirección:   Calle 73, CC Multi Tienda God is Good, planta baja local A-4, Valencia, Carabobo
Historia:    +4 años en el mercado, nace en Valencia, Carabobo
```

### Meta Pixel
Pixel ID: **`27355395054120748`** — el **mismo** que usan las campañas en `/cp/*`. Toda la data (campañas + tienda) alimenta la misma cuenta de anuncios y audiencias de Meta.

En `.env.local`:
```
NEXT_PUBLIC_META_PIXEL_ID=27355395054120748
META_PIXEL_ID=27355395054120748
META_CAPI_ACCESS_TOKEN=<token del backend>
```

### Cloudinary — carpetas
Tuluoshop usaba `tulujoshop/`. Savaya usa **`savaya/`**:
- `savaya/productos` — imágenes de producto (600×800 px, 3:4)
- `savaya/banners` — banners homepage y mega menú
- `savaya/hero` — slides del carrusel (desktop 1920×900, mobile 750×1100)
- `savaya/popup` — imagen del popup promocional
- `savaya/comprobantes` — comprobantes de pago de clientes (TTL 72h, limpieza automática)
- `savaya/envios` — comprobantes de envío del admin

### localStorage keys
- `savaya-recently-viewed` (en lugar de `tulujoshop-recently-viewed`)
- `savaya-custom-colors` (en lugar de `tulujoshop-custom-colors`)

### Métodos de pago
Todos activos: Zelle, Binance Pay, USDT (TRC20), Transferencia VE, Pago móvil, Efectivo.
Configurar datos reales en `src/components/checkout/PaymentForm.tsx → PAYMENT_CONFIG`.

### Roles de admin
Solo `admin` por ahora (Andre). No hay sub_admin, editor ni gestor_pedidos configurados inicialmente.

---

## Variables de entorno requeridas

Ver `.env.local.example`. Mínimo para desarrollo:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=           # Proyecto Supabase NUEVO para Savaya
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_WHATSAPP_NUMBER=584141100100
NEXT_PUBLIC_META_PIXEL_ID=27355395054120748
RESEND_API_KEY=
```

---

## Infraestructura nueva (no compartir con Tuluoshop)

- **Supabase**: proyecto separado. Ejecutar el mismo schema SQL de Tuluoshop con las categorías adaptadas (solo `shoes`/`women`).
- **Vercel**: proyecto separado. Dominio: `savayavzla.com`.
- **Cloudinary**: misma cuenta, pero carpeta raíz `savaya/` (no `tulujoshop/`).

---

## Completado en sesiones anteriores

- [x] Branding: Bebas Neue + Rubik, paleta dorada `#CA8C31`, logo/favicon copiados
- [x] `globals.css`: `@theme {}` con tokens Savaya
- [x] `layout.tsx`: metadata, Schema.org, fonts, Meta Pixel `27355395054120748`
- [x] `constants.ts`: `MAIN_NAV`, `GENDERS`, `SHOE_SIZES_WOMEN`, `BRAND`, `SAVAYA_CITIES`
- [x] `package.json`: nombre `savaya-tienda`
- [x] `.env.local.example`: variables con Pixel ID pre-rellenado
- [x] Todas las referencias `tulujoshop` limpiadas (localStorage, Cloudinary folders, CSV filenames, Instagram)
- [x] Navegación: `SIMPLE_NAV` / `ALL_SIMPLE_LINKS` / `AccordionKey` → categorías Savaya
- [x] `NavDesktop.tsx`: solo `MenuKey = 'mujer'`, GENDER_EDITORIAL/PROMO_FALLBACK simplificados
- [x] `MobileMenu.tsx`: `ALL_SIMPLE_LINKS` Savaya, `AccordionKey` sin hombre/ninos
- [x] `MobileBottomNav.tsx`: `isExplore` paths actualizados
- [x] `Footer.tsx`: categorías, social links, tagline Savaya
- [x] `HeroBanner.tsx`: slides default con copy Savaya
- [x] `PromoBanners.tsx`: prop `dualCasual` (en lugar de `dualHombre`), copy Savaya
- [x] `CategoryGrid.tsx`: `TYPE_ROUTES` usa slug para zapatos (no override `/zapatos`)
- [x] `page.tsx` (homepage): metadata, banners default, banners fetch Savaya
- [x] `sobre-nosotros/page.tsx`: historia Valencia/Carabobo, +4 años, solo calzado femenino
- [x] `contacto/page.tsx`: dirección física CC Multi Tienda God is Good añadida
- [x] `faq/page.tsx`: descripción de marca actualizada
- [x] `layout.tsx` (shop): `getNavBanners` solo `nav_mujer`, `getNavCategories` solo `women`, `GENDER_META` simplificado a `[{ key: 'mujer', href: '/casuales' }]`
- [x] Páginas `/hombre`, `/ninos`, `/remates`, `/ropa`: convertidas en redirects — `/hombre`→`/casuales`, `/ninos`→`/casuales`, `/remates`→`/descuentos`, `/ropa`→`/casuales`
- [x] Metadata en 8 páginas de catálogo actualizada (descuentos, mas-vendidos, nuevas-colecciones, zapatos, buscar, marcas, accesorios, faq)
- [x] `marcas/[slug]/page.tsx`: description actualizada a calzado femenino
- [x] `producto/[slug]/page.tsx` + `[...productPath]/page.tsx`: gender breadcrumb mapping → todos a `/casuales`
- [x] `buscar/page.tsx`: quick links Hombre/Niños reemplazados por De vestir/Más vendidos

---

## Notas técnicas Savaya

### Rutas heredadas de Tuluoshop
Las rutas `/hombre`, `/ninos`, `/remates`, `/ropa` existen como archivos pero solo contienen un `redirect()`. No borrarlas — Next.js App Router necesita el archivo para que la redirección funcione correctamente.

### getNavCategories en layout.tsx
Solo hace query con `.in('gender', ['women'])`. El `GENDER_META` tiene un solo entry `{ key: 'mujer', label: 'Calzado', href: '/casuales' }`. El mega menú desktop/mobile mostrará las subcategorías que existan en DB para género `women` (casuales, deportivos, de-vestir una vez insertadas).

### PromoBanners — prop dualCasual
El componente `PromoBanners.tsx` ahora recibe `dualCasual` en vez de `dualHombre`. En `page.tsx` el fetch de `banner_config` busca `home_dual_casual` (no `home_dual_hombre`). Si se quiere usar este banner desde el dashboard, crear la fila con `id = 'home_dual_casual'` en la tabla `banner_config`.

### CategoryGrid
Los zapatos (shoes) no tienen override de ruta en `TYPE_ROUTES` — usan su slug directamente. Si la DB tiene una categoría con `slug = 'casuales'`, la href será `/casuales`. Esto es intencional para Savaya.

### FilterSidebar — filtro género
`FilterSidebar.tsx` aún tiene el mapeo `men: 'hombre'` en una parte interna. Para Savaya el filtro de género no debería mostrarse (solo hay `women`) — verificar que `showGenderFilter` esté en `false` para todos los catálogos de Savaya o actualizar el mapeo.

---

## Pendiente antes de lanzar

- [ ] **Supabase**: crear proyecto nuevo y ejecutar migraciones SQL (ver CLAUDE.md de Tuluoshop)
- [ ] **Categorías DB**: insertar `casuales`, `deportivos`, `de-vestir` (`gender='women'`, `product_type='shoes'`)
- [ ] **Vercel**: crear proyecto separado, configurar variables de entorno
- [ ] **`PAYMENT_CONFIG`** en `PaymentForm.tsx`: completar con datos reales (Zelle email, Binance ID, banco VE, etc.)
- [ ] **`og-default.jpg`** (1200×630): crear y subir a `/public/`
- [ ] **Hero y banners**: reemplazar imágenes Unsplash placeholder con fotos reales de producto Savaya
- [ ] **Cloudinary**: subir productos bajo `savaya/productos/` (600×800 px, relación 3:4)
- [ ] **Google OAuth**: configurar en Supabase (opcional para launch)
- [ ] **Dominio**: decidir Opción A o B (ver `SAVAYA_Plan_Tienda.md`) y ejecutar rewrites en Vercel
- [ ] **SQL pendiente de Tuluoshop**: migraciones G-22 (guía tallas), G-23 (marcas), G-24 (precio divisa)
- [ ] **Dashboard admin**: verificar que `CategoriasForm.tsx` y `ProductForm.tsx` funcionen bien con solo shoes/women
- [ ] **FilterSidebar.tsx**: actualizar quick-links de géneros si se muestra el filtro género
