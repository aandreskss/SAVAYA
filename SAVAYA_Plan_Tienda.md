# Plan: Tienda online SAVAYA (duplicar y adaptar Tuluoshop)

> Documento de referencia, sin ejecutar todavía. Cuando Andre decida arrancar, se retoma este plan como punto de partida — no hace falta volver a explicar nada de esto, solo decir "vamos a hacer la tienda de Savaya, sigamos el plan".

## Objetivo
Tener una tienda online funcional para SAVAYA en `www.savayavzla.com` (dominio raíz), duplicando el proyecto **Tuluoshop** (tienda ya terminada para otra marca) y adaptándolo a la identidad y catálogo de SAVAYA, en vez de construir una tienda desde cero.

## Proyecto fuente a duplicar
- **Ruta:** `C:\Users\Andre\OneDrive\Documentos\Claude\Projects\tulujoshop`
- **Stack:** Next.js 16 (App Router) + TypeScript, Tailwind CSS 4, Supabase (Postgres + Auth + Storage, con RLS), Cloudinary (imágenes de producto), Resend + React Email (correos transaccionales), Mercado Pago + pagos manuales (Zelle, Binance, USDT, transferencia VE, pago móvil, efectivo), GA4 + Meta Pixel, deploy en Vercel.
- **Qué incluye:** catálogo público (por género/categoría), buscador, PDP, carrito, checkout, cuenta de usuario (pedidos, favoritos, perfil), y un dashboard de administración completo (productos, pedidos, clientes, marcas, categorías, colecciones, descuentos, configuración).
- **Documentación interna:** el archivo `CLAUDE.md` de ese proyecto (74KB) describe toda la arquitectura, estructura de carpetas y convenciones — léelo primero cuando se vaya a ejecutar este plan, ahí está el detalle fino que este documento no repite.

## Qué hay que adaptar para SAVAYA

### 1. Catálogo — simplificar, no es multi-categoría
Tuluoshop vende ropa/zapatos/accesorios para mujer, hombre y niños. SAVAYA es **solo calzado femenino** (casual, deportivo y de vestir, según el brochure de marca). Hay que:
- Quitar o dejar ocultas las secciones de hombre/niños/accesorios/ropa.
- Simplificar la navegación a algo como: Casual · Deportivo · De vestir · Nuevas colecciones · Descuentos · Más vendidos.
- Las páginas de catálogo por marca probablemente no aplican (SAVAYA es una sola marca) — evaluar si esa sección se elimina o se deja para posibles colaboraciones futuras.

### 2. Identidad visual (branding) — ya extraída y lista para reutilizar
Todo esto ya existe en `Projects\Savaya\Campañas\cp\colegiales\assets\` (proyecto de campañas) y se puede copiar directo:
- **Logo real:** `logo.png` / `logo.webp` (el imagotipo mariposa + wordmark oficial).
- **Favicon:** `favicon.png`.
- **Paleta dorada institucional:** `#CA8C31` (marrón dorado, color principal), `#E5BB5B`, `#FFEA84`, `#FFF2BC`, `#E2A44F`, `#EFE177`; secundarios más oscuros `#AA6E0B`, `#FEBE10`, `#FFE100`.
- **Tipografías:** Rubik (cuerpo de texto/subtítulos — Google Fonts, ya usada en la landing) y Bebas Neue (títulos/tagline). El manual de marca menciona una fuente propia "SAVAYA.OTF/TTF" para el logotipo, pero no la tenemos como archivo — de momento Rubik/Bebas Neue son el reemplazo funcional ya validado.
- **Tagline:** "Marca tu moda".
- Reemplazar el theme de Tailwind (colores, tipografías) de Tuluoshop por estos valores.

### 3. Contenido / textos de marca
- **Historia de marca:** nace en Valencia, Carabobo; +4 años en el mercado; calzado pensado para la mujer venezolana (elegante, cómodo, versátil, accesible).
- **Contacto:** `Savayarrss@gmail.com`, WhatsApp `+58 414-1100100`, dirección Calle 73, CC Multi Tienda God is Good, planta baja local A-4, Valencia, Carabobo.
- **Redes:** Instagram `@Savaya` y `@Savayavzla`.
- **Cobertura/tiendas aliadas:** ya está la lista de +20 ciudades usada en la landing de campañas (Caracas, Valencia, Maracay, Barquisimeto, Puerto La Cruz, Puerto Ordaz, Barinas, San Cristóbal, Mérida, Maracaibo, Acarigua, San Felix, Guanare, El Tigre, Cantaura, Puerto Cabello, Valera, Trujillo, Maturín, Upata, Valle la Pascua) — reutilizable en una sección "dónde comprar" o en la política de envíos.

### 4. Infraestructura — todo nuevo, no compartir con Tuluoshop
Tuluoshop es de otro cliente/marca — **no reutilizar su base de datos ni sus credenciales**. Para SAVAYA hace falta:
- Proyecto Supabase nuevo (Postgres + Auth + Storage propios).
- Cuenta/config Cloudinary nueva (o carpeta separada dentro de la misma cuenta, a decidir).
- Proyecto Vercel nuevo para la tienda (separado del proyecto `savaya-landing` de campañas).
- Variables de entorno nuevas (mismo formato que `tulujoshop/.env.local.example`):
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  MERCADO_PAGO_ACCESS_TOKEN=          (si aplica para Savaya)
  NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
  MERCADO_PAGO_WEBHOOK_SECRET=
  RESEND_API_KEY=
  NEXT_PUBLIC_GA_MEASUREMENT_ID=      (si se quiere GA4 además de Meta)
  REVALIDATE_SECRET=
  ```
- Meta Pixel: reutilizar el mismo Pixel ID que ya usan las campañas (`27355395054120748`) para que toda la data (campañas + tienda) alimente la misma cuenta de anuncios y audiencias. Igual que en el proyecto de campañas, conviene wirear Pixel (cliente) + Conversions API (servidor) para eventos de tienda: `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`.

### 5. Dominio — decisión pendiente
Ahora mismo `www.savayavzla.com` está apuntando al proyecto de **campañas** (`savaya-landing`) como placeholder temporal (la raíz redirige a `/cp/colegiales`). Cuando la tienda esté lista, hay dos caminos (patrón "multi-zonas" de Vercel):

- **Opción A (recomendada, menos migración):** el dominio se queda en el proyecto de campañas, y ahí se agrega un rewrite para que todo lo que NO sea `/cp/*` ni `/api/lead` se mande al proyecto de la tienda.
- **Opción B:** mover el dominio al proyecto de la tienda, y que la tienda sea quien haga el rewrite de `/cp/*` y `/api/*` hacia el proyecto de campañas (este era el plan original, antes de que el dominio ya quedara conectado a campañas).

Se decide esto cuando se vaya a ejecutar — no bloquea nada del trabajo de adaptar Tuluoshop.

## Pasos para ejecutar (cuando Andre lo pida)
1. Duplicar la carpeta de `tulujoshop` dentro de `Projects\Savaya\Tienda` (o el nombre que se prefiera).
2. Crear proyecto Supabase nuevo + correr las migraciones/esquema de Tuluoshop adaptado (categorías simplificadas a solo calzado femenino).
3. Crear proyecto Vercel nuevo, configurar variables de entorno.
4. Reemplazar branding: colores Tailwind, tipografías, logo, favicon, textos de marca, contacto, redes.
5. Simplificar navegación/categorías al catálogo real de SAVAYA.
6. Conectar Meta Pixel + Conversions API (mismo Pixel ID que campañas) y, si aplica, GA4.
7. Decidir y ejecutar la opción de dominio (A o B, ver arriba).
8. QA de punta a punta: catálogo, carrito, checkout, métodos de pago manuales, dashboard admin, correos transaccionales, tracking.

## Preguntas abiertas para cuando se retome
- Catálogo de lanzamiento: ¿qué productos/precios reales se cargan primero? (¿hay fotos de producto adicionales a las ya usadas en la landing?)
- ¿Qué métodos de pago se activan realmente para Savaya (todos los de Tuluoshop o un subconjunto)?
- ¿Quién tiene acceso al dashboard de administración además de Andre?
- ¿Se necesita Mercado Pago o solo pagos manuales (Zelle/Binance/pago móvil/efectivo)?
