# SAVAYA — Plan Maestro de Implementación (prompts por fase para Claude Code)

Última actualización: 2026-08-15

## Cómo usar este documento

Este no es solo un plan — es una **secuencia de prompts listos para copiar y pegar** en sesiones de Claude Code, en orden. Cada prompt tiene un alcance acotado a propósito (regla del prompt maestro: "no empieces intentando construir 100 funcionalidades simultáneamente").

Reglas de uso:

1. Antes de la Fase 1, crea `CLAUDE.md` en la raíz del repo (contenido en el archivo separado que te entregué junto a este). Claude Code lo lee automáticamente en cada sesión — por eso los prompts de abajo no repiten las reglas de calidad/seguridad/arquitectura, solo el alcance específico.
2. Ejecuta las fases **en orden**. No saltes a Fase 3 sin haber cerrado Fase 1 y 2 — el prompt maestro es explícito en esto.
3. Cada prompt termina con lo que Claude Code debe entregarte para que tú (o él mismo en la siguiente sesión) verifiques que quedó bien. Revisa eso antes de avanzar a la siguiente fase.
4. Donde el prompt dice "confirma conmigo antes de continuar", es una decisión de negocio (no técnica) que debes tomar tú — Claude Code no debe adivinarla.
5. Los bloques marcados **PROMPT →** son literales para pegar. Todo lo demás es contexto para ti.

Al final del documento hay una sección "Decisiones ya tomadas" (stack, marca, arquitectura) que resume lo que ya decidí por ti en base al brochure y al prompt maestro, y por qué — para que no tengas que re-explicarlo a Claude Code en cada sesión.

---

## FASE 0 — Auditoría

**Objetivo:** entender qué existe hoy en `savaya-tienda` y confirmar que `savaya-tienda-nueva` arranca limpio, antes de decidir qué (si acaso algo) se reutiliza.

**Nota:** hoy `savaya-tienda-nueva` está vacío — arrancamos 100% desde cero ahí. Esta fase es sobre todo para inventariar `savaya-tienda` y decidir con datos, no por intuición, si hay algo reutilizable (assets, copy, listado de productos/tallas/colores reales, etc.) — nunca código.

**PROMPT → Fase 0**

```
Audita el repositorio C:\Users\Andre\OneDrive\Documentos\Claude\Projects\Savaya\savaya-tienda (tienda anterior) y confirma el estado de C:\Users\Andre\OneDrive\Documentos\Claude\Projects\Savaya\savaya-tienda-nueva (tienda nueva).

NO modifiques, borres ni sobrescribas nada en savaya-tienda. Es solo lectura.

Para savaya-tienda, reporta en /docs/AUDIT.md dentro de savaya-tienda-nueva:
1. Stack real usado (framework, versión, lenguaje, ORM/DB, hosting, dependencias principales) — lee package.json y archivos de config.
2. Arquitectura y estructura de carpetas actual.
3. Deuda técnica evidente: componentes gigantes, duplicación, código muerto, falta de tipado, lógica de negocio en frontend, problemas de seguridad visibles (secretos hardcodeados, falta de validación server-side, etc.).
4. Qué NO tiene calidad suficiente para reutilizar (sé específico y honesto, no generoso).
5. Qué SÍ podría reutilizarse tal cual o casi tal cual — pero solo si de verdad tiene calidad: piensa en datos (catálogo real de productos/tallas/colores/precios si existen en una DB o seed), copy ya validado con el negocio, activos de marca (logo en vectorial, fuentes, imágenes de producto), configuración de dominios/DNS, integraciones ya funcionando (Cloudinary, pasarela, etc.).
6. Cualquier dato de negocio real (zonas de delivery actuales, métodos de pago que ya usan, tarifas) que deba alimentar la configuración de la tienda nueva en vez de inventarse.

Para savaya-tienda-nueva, confirma que está vacío o casi vacío y no hay nada que auditar aún.

No escribas código en esta fase. Entrega solo /docs/AUDIT.md y un resumen corto (menos de 300 palabras) de cuáles de los hallazgos de savaya-tienda cambian algo del plan de arquitectura ya decidido en /docs/PROJECT-PLAN.md.
```

**Antes de correr esto:** en esta sesión de Claude Code necesitas tener conectadas ambas carpetas (`savaya-tienda` y `savaya-tienda-nueva`), no solo la nueva.

---

## FASE 1 — Fundaciones y arquitectura

### 1.1 — Scaffold del proyecto + CLAUDE.md

**PROMPT → Fase 1.1**

```
Inicializa savaya-tienda-nueva desde cero con: Next.js 16 (App Router), React 19.2, TypeScript en modo estricto, Tailwind CSS v4, ESLint + Prettier, Vitest, Playwright.

Crea el archivo CLAUDE.md en la raíz con el contenido que te adjunto en este mensaje (pégalo tal cual, no lo resumas ni lo reescribas).

Crea la estructura de carpetas por dominios descrita en CLAUDE.md sección 3 (src/app, src/domains/*, src/shared/ui, src/shared/lib, src/shared/config), con un README.md corto en cada dominio explicando su responsabilidad (una frase).

Configura:
- .env.example con todas las variables que ya sabemos que vamos a necesitar (DB, Cloudinary, Auth, Upstash, Sentry, GA4, Meta, exchange rate provider) sin valores reales.
- next.config con headers de seguridad base (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors) — pueden quedar en modo report-only si algo no está listo, pero deben existir.
- Scripts de package.json para lint, typecheck, test, test:e2e, build.
- Husky o equivalente ligero para pre-commit (lint + typecheck) solo si aporta valor real, no por moda.

No implementes ninguna feature de negocio todavía. Al terminar, el proyecto debe correr con `npm run dev` mostrando una página placeholder, pasar `npm run typecheck` y `npm run lint` sin errores, y tener un test de ejemplo pasando en Vitest y otro en Playwright.

Entrega un resumen de qué se instaló y por qué cada dependencia (según la regla de dependencias de CLAUDE.md).
```

### 1.2 — Documentación base + ADRs

**PROMPT → Fase 1.2**

```
Crea en /docs/ los siguientes documentos, con contenido real y específico a SAVAYA (no relleno genérico): ARCHITECTURE.md, DATABASE.md, SECURITY.md, UX-UI.md, SEO.md, ANALYTICS.md, PAYMENTS-VENEZUELA.md, DEPLOYMENT.md.

Usa como input: CLAUDE.md, el resumen de "Decisiones ya tomadas" en /docs/PROJECT-PLAN.md, y /docs/AUDIT.md si ya existe.

Crea /docs/adr/ con estas decisiones documentadas en formato ADR (contexto, decisión, alternativas consideradas, consecuencias):
- 001-authentication.md (Auth.js + 2FA admin)
- 002-database-and-orm.md (Postgres + Drizzle vs Prisma)
- 003-exchange-rates.md (ExchangeRateProvider, fuente primaria y fallback)
- 004-payment-workflow.md (estados del pedido, comprobantes)
- 005-cms-architecture.md (page builder con bloques controlados, no HTML libre)
- 006-search.md (Postgres FTS detrás de SearchProvider, no Meilisearch todavía)

Cada documento debe explicar decisiones reales tomadas para SAVAYA, no teoría genérica de ecommerce. Si algo depende de una decisión de negocio que no tenemos (por ejemplo la política de USDT o las zonas de delivery reales), dilo explícitamente como pendiente en vez de inventarlo.

No escribas código de aplicación en esta fase.
```

### 1.3 — Modelo de datos y migraciones iniciales

**PROMPT → Fase 1.3**

```
Basándote en /docs/DATABASE.md y en las entidades listadas en el prompt maestro (User, Role, Permission, Customer, Address, Product, ProductVariant, Category, Collection, Color, Size, ProductMedia, Inventory, InventoryMovement, Cart, CartItem, Order, OrderItem, OrderStatusHistory, PaymentMethod, Payment, PaymentProof, ShippingMethod, ShippingZone, ShippingRate, Discount, Coupon, Promotion, Page, PageSection, Banner, ExchangeRate, CustomerNote, CustomerTag, AuditLog, Integration, ApplicationSetting), diseña el schema completo en Drizzle (un archivo schema.ts por dominio, según CLAUDE.md).

Reglas específicas:
- El inventario vive a nivel de variante (producto + color + talla = SKU único), con InventoryMovement inmutable (entrada, venta, ajuste, devolución, cancelación, corrección) — nunca un UPDATE directo de stock sin movimiento asociado.
- OrderStatusHistory registra cada transición con actor y timestamp; define en código (no solo en docs) qué transiciones de estado son válidas y cuáles no (máquina de estados explícita, no un enum suelto que cualquiera puede mutar).
- AuditLog es de solo inserción (append-only).
- Nada de un campo JSON gigante para "guardar todo" — JSON solo donde de verdad no tiene sentido normalizar (por ejemplo contenido de un PageSection flexible del CMS).
- Todas las relaciones con integridad referencial correcta y los índices que las queries reales del ecommerce van a necesitar (búsqueda por SKU, listado por categoría, pedidos por cliente, etc.).

Genera las migraciones iniciales con drizzle-kit, un seed mínimo de desarrollo (2-3 productos con variantes reales, categorías básicas Mujer/Hombre, un método de pago de ejemplo) y actualiza /docs/DATABASE.md con el diagrama/resumen final del modelo.

Entrega: migraciones aplicadas contra una DB local o de desarrollo, seed corriendo sin error, y confirmación de que no hay ninguna tabla sin índice en las columnas usadas para filtrar/ordenar en el storefront.
```

### 1.4 — Autenticación y RBAC base

**PROMPT → Fase 1.4**

```
Implementa autenticación con Auth.js (NextAuth v5): registro, login, logout, verificación de email, reset de password, todo con rate limiting (Upstash) en los endpoints sensibles.

Implementa RBAC real (no isAdmin=true): roles Super Admin, Admin, Catálogo, Inventario, Ventas, Finanzas, Atención al Cliente, Marketing, Analista, con permisos granulares por acción (no solo por rol) según domains/roles-permissions. La autorización se verifica en servidor en cada server action / route handler que la necesite — nunca solo ocultando un botón en el cliente.

Implementa 2FA (TOTP) obligatorio para Super Admin y Admin: enrolamiento con QR, verificación en login, y reautenticación obligatoria (reingresar password o código) antes de acciones de alto riesgo (cambiar roles, aprobar pagos, cambiar cuentas bancarias, cambiar claves de integración) — define la lista completa de "acciones de alto riesgo" en código en un solo lugar, no dispersa.

Cookies de sesión HttpOnly, Secure, SameSite=Lax, expiración razonable, rotación en login. Protección contra session fixation.

Entrega tests de: un usuario sin permiso no puede ejecutar la acción aunque llame directo al endpoint; 2FA bloquea login sin código válido; rate limiting bloquea intentos de login por fuerza bruta.
```

---

## FASE 2 — Design System

### 2.1 — Tokens de marca

**PROMPT → Fase 2.1**

```
Implementa el design system SAVAYA en Tailwind v4 (tokens vía CSS variables + config de Tailwind, no valores sueltos en componentes) con exactamente estos tokens (ya decididos, no los cambies sin confirmarlo conmigo):

Color:
- color.brand.black: #0A0A0A (fondo/base, texto sobre claro)
- color.brand.offwhite: #F7F5F0 (fondo cálido alternativo al blanco puro)
- color.brand.white: #FFFFFF
- color.accent.gold: #C9A227 (acento — badges, iconografía, detalles, nunca fondos grandes)
- color.accent.gold-soft: #E8D9A8 (tinte claro del acento, para fondos sutiles de badge)
- color.text.primary: #0A0A0A sobre claro / #FFFFFF sobre oscuro
- color.text.secondary: #6B6B6B
- color.border: #E5E2DC
- color.surface: #FFFFFF (cards sobre fondo offwhite)
- color.success: #1E7F4F
- color.warning: #B8791A
- color.error: #C0362C

Radius: sm=8px, md=14px, lg=24px, xl=32px, pill=999px. Uso predominante de lg/xl/pill en cards, imágenes y botones — evitar radius=0 salvo casos muy puntuales (líneas divisorias, tablas admin).

Spacing: escala de 4px (4, 8, 12, 16, 24, 32, 48, 64, 96).

Typography: Inter (variable, next/font) para UI y body. Archivo (variable, next/font, Google Fonts, licencia OFL — carga rápida, geometría afín al wordmark SAVAYA) para headings/display. Máximo 2 familias, pesos limitados (400/500/600 para Inter, 500/700 para Archivo).

Shadow: define shadow.sm/md/lg sutiles (nada de sombras pesadas tipo Material antiguo).

Crea /shared/ui/tokens.ts (o css tokens) como única fuente de verdad, y un ejemplo visual (página /dev/design-system solo accesible en desarrollo) que muestre todos los tokens aplicados. Documenta los tokens en /docs/UX-UI.md.

Respeta prefers-reduced-motion desde ya en cualquier transición base que definas.
```

### 2.2 — Componentes base (átomos)

**PROMPT → Fase 2.2**

```
Construye en /shared/ui, usando los tokens de la Fase 2.1, los componentes: Button (variantes primary/secondary/ghost, tamaños, estados default/hover/focus/active/disabled/loading), IconButton, Input, Select, Checkbox, Radio, Toggle, Badge, Chip, Price (con soporte para precio anterior tachado + badge de descuento), Tabs, Accordion, Modal, Drawer, BottomSheet, Toast, Tooltip, Pagination, Skeleton, EmptyState, ErrorState.

Todos con bordes redondeados (usando los tokens de radius, predominando lg/xl/pill), accesibles (labels correctos, focus visible, tamaños táctiles mínimos 44px en mobile, roles ARIA solo donde sea necesario), y con Storybook o una página /dev/components si no quieres instalar Storybook (evalúa si Storybook se justifica para este proyecto o es sobre-ingeniería — decide y documenta por qué).

Ningún componente debe superar ~150-200 líneas; si crece más, sepáralo.

Entrega tests de accesibilidad básicos (que existan labels, que el modal atrape el foco, que el toast se anuncie) y confirma que BottomSheet funciona bien en mobile real (390px) y no solo en desktop redimensionado.
```

### 2.3 — Componentes de comercio (moléculas/organismos)

**PROMPT → Fase 2.3**

```
Construye, sobre los átomos de la Fase 2.2: ProductCard (foto, nombre, precio, precio anterior, badge Nuevo/Bestseller/Oferta/Últimas unidades/Exclusivo web, colores disponibles, wishlist, hover con segunda foto en desktop sin layout shift), CategoryCard (ovalada, foto + label), ColorSelector, SizeSelector (con estado agotado visualmente distinto, nunca seleccionable), Quantity stepper, Breadcrumb, SearchBar (con estado de autocomplete, aún sin datos reales — eso es Fase 3), KPICard y ChartContainer (para el admin, mismos tokens pero layout más denso), AdminSidebar, AdminHeader, DataTable (con filtros y estados de carga/vacío/error).

No conectes estos componentes a datos reales todavía — reciben props y se prueban con datos mock. El objetivo es que Storefront y Admin (Fases 3 y 4) solo ensamblen, no inventen UI nueva sobre la marcha.

Entrega capturas o un storybook/página de muestra de cada componente en sus estados principales, y confirma responsive en 390/768/1024/1440.
```

---

## FASE 3 — Storefront

Cada sub-fase asume que puede navegar a datos reales de la Fase 1.3 (schema + seed). Si algo de contenido (textos exactos de hero, banners) no está definido, usa placeholders claramente marcados como `[PENDIENTE CONTENIDO]` en vez de inventar copy final de marketing.

### 3.1 — Home + sistema de bloques CMS (versión mínima)

**PROMPT → Fase 3.1**

```
Implementa la Home (/) como una secuencia de bloques renderizados desde una tabla PageSection (dominio cms), no hardcodeada en el JSX de la página. Cada bloque tiene tipo, orden, estado (activo/inactivo) y contenido tipado (Zod) según su tipo — nada de HTML libre inyectable.

Implementa los tipos de bloque: AnnouncementBar, Hero, ShopByCategory (cards ovaladas), ProductCarousel (parametrizable: nuevos / más vendidos / tendencias), EditorialBlock (imagen + storytelling), SplitBlock (Mujer/Hombre lado a lado), BenefitsBlock, Newsletter.

Por ahora el CMS admin para editar esto es de Fase 4.7 — en esta fase solo necesitas que el bloque se pueda crear/activar vía seed o script, y que la Home los renderice en el orden correcto respetando activo/inactivo.

Usa Server Components para todo lo que no necesite interactividad (la mayoría de la Home); solo los carruseles/drawers necesitan "use client".

Cumple con LCP objetivo: el Hero debe usar next/image con priority y tamaños responsive vía Cloudinary, sin cargar ningún widget externo pesado (nada de embeds de Instagram con su JS completo — si se pide ese bloque más adelante, usa una galería propia con imágenes traídas por API, no el widget).

Entrega Home funcionando en 390/768/1024/1440, Lighthouse de la página (reporta LCP/INP/CLS reales) y confirma que apagar un bloque desde la data lo oculta sin romper el layout de los demás.
```

### 3.2 — Header, navegación y buscador

**PROMPT → Fase 3.2**

```
Implementa Header con: announcement bar configurable (reutiliza el bloque de 3.1), logo, menú (Mujer, Hombre, Nuevos, Running, Casual, Lifestyle, Ofertas) con mega menú visual en desktop, buscador, cuenta, wishlist, carrito con contador. En mobile: menú lateral, buscador accesible, mismo carrito/cuenta.

El buscador NO es solo frontend: implementa el dominio de búsqueda usando Postgres full-text (tsvector) + pg_trgm sobre nombre, SKU, categoría, colección, género, color, estilo, palabras clave — detrás de una interfaz SearchProvider (ver ADR 006) para poder cambiar de proveedor después sin tocar el resto. Autocomplete con debounce, sugerencias, últimas búsquedas (guardadas en cliente, no requieren cuenta), productos sugeridos, categorías relacionadas, y un estado sin resultados diseñado (no un "no results" genérico).

El header puede transformarse al hacer scroll (compactarse), pero sin Layout Shift ni impacto medible en INP.

Entrega: buscar "SAV-RX-BLK-40" encuentra el producto por SKU exacto, buscar con un typo razonable ("runer" en vez de "runner") sigue encontrando resultados relevantes, y el mega menú es navegable por teclado.
```

### 3.3 — PLP (listado de categoría) con filtros

**PROMPT → Fase 3.3**

```
Implementa las rutas de categoría (/mujer, /hombre, /running, /sneakers, /casual, /sandalias, /plataformas, /vestir, /nuevos, /ofertas) como PLP con: breadcrumb, H1 y descripción SEO editable, banner opcional, cantidad de resultados, ordenamiento (Destacados, Más vendidos, Nuevos, Precio menor→mayor, Precio mayor→menor), filtros (género, categoría, estilo, talla, color, rango de precio, disponibilidad, nuevos, ofertas, colección), grid de ProductCard, wishlist inline, paginación o infinite loading (decide cuál y justifica — con catálogo mediano probablemente paginación clásica es más simple y no sacrifica SEO).

Filtros en desktop: sidebar o topbar (decide y sé consistente). En mobile: bottom sheet (usa el componente de 2.2) con CTA inferior sticky "Ver N productos" y botón "Limpiar filtros".

La URL debe reflejar los filtros activos vía query params, pero NO generes combinaciones indexables sin valor SEO: define en el middleware/metadata qué combinaciones de filtros llevan `noindex` (todo lo que no sea la categoría base o 1 filtro con valor SEO real) y documenta la regla en /docs/SEO.md.

Entrega: filtrar por talla+color+precio funciona y es compartible por URL, la combinación de 3+ filtros no es indexable, y el bottom sheet mobile no bloquea el scroll del body por detrás.
```

### 3.4 — PDP (página de producto)

**PROMPT → Fase 3.4**

```
Implementa la página de producto (/producto/[slug]) con:

Desktop: layout galería (~60%) + información (~40%). Mobile: galería → nombre → precio → color → talla → CTA → información → relacionados, con CTA sticky al hacer scroll.

Galería: varias fotos, zoom en desktop, swipe en mobile, thumbnails en desktop, foto lifestyle, video opcional — todo vía Cloudinary con next/image, sin cargar assets de 4000px si se muestran en 400px.

Información: nombre, SKU, categoría, precio en USD, equivalente en Bs. calculado con el ExchangeRateProvider (aún con la tasa fija del seed si la Fase 5.2 no está lista — no inventes una tasa random en el componente, tráela del mismo servicio que usará producción), descuento, selector de color, selector de talla con guía de tallas (modal), disponibilidad real de esa variante específica.

Regla dura: es imposible agregar al carrito una variante sin stock o sin talla/color seleccionados — validado en cliente para UX y re-validado en servidor al agregar al carrito.

Información adicional en accordion: descripción, materiales, cuidado, envíos, cambios/devoluciones, medios de pago. Cross-selling: "también te puede gustar" (misma categoría/colección) y "vistos recientemente" (cliente, sin cuenta necesaria, vía cookie/localStorage — recuerda que localStorage aquí es en el navegador del usuario final, no en un artifact, así que sí puedes usarlo para esto).

Entrega: agregar una variante agotada muestra el estado deshabilitado correcto y el intento directo al server action también lo rechaza; PDP responsive validada; imágenes con srcset correcto (verifica con devtools que no se descarga una imagen más grande de la necesaria).
```

### 3.5 — Wishlist, carrito (drawer + página)

**PROMPT → Fase 3.5**

```
Implementa wishlist asociada al usuario (requiere cuenta) con guardar/quitar/mover-a-carrito.

Implementa carrito como drawer (desktop, desde la derecha) y fullscreen/bottom en mobile, más una página completa /carrito. Muestra foto, producto, talla, color, cantidad, precio, subtotal, descuento, delivery estimado, total.

Regla dura (ya en CLAUDE.md, repetida aquí porque es crítica): el precio, el descuento y el total mostrados se calculan en servidor a partir del carrito persistido, nunca se confía en lo que mande el cliente. Cada vez que se agrega/quita/cambia cantidad, el servidor revalida stock disponible en ese momento (sin todavía reservar inventario definitivamente — eso se define en checkout, Fase 3.6) y recalcula todo.

Estado vacío diseñado (no un texto plano), con CTA a categorías. Estado de "producto ya no disponible" si algo del carrito perdió stock entre que se agregó y que se vuelve a abrir el carrito.

Entrega: manipular el payload de un server action para mandar un precio distinto no cambia el total mostrado; el carrito sobrevive a un refresh de página (persistido por usuario o por cookie de sesión de carrito para invitados).
```

### 3.6 — Checkout venezolano (4 pasos)

Esta es la sub-fase más importante de negocio. Divídela en su propia sesión de Claude Code, no la mezcles con nada más.

**PROMPT → Fase 3.6**

```
Implementa el checkout en 4 pasos (Datos → Entrega → Pago → Confirmación), como flujo propio (no un wrapper de Stripe Checkout).

Paso 1 — Datos: login o registro simplificado; solicitar solo nombre, apellido, email, teléfono/WhatsApp.

Paso 2 — Entrega: cards seleccionables Delivery local / Envío nacional / Retiro, con estado/ciudad/municipio/zona/dirección/referencias cuando aplique. Los métodos y zonas disponibles salen de configuración administrativa (dominio shipping: ShippingZone, ShippingMethod, ShippingRate) — nada hardcodeado (ni Valencia ni ninguna empresa de encomienda específica en el código; eso vive en datos, se gestiona en Fase 4.9).

Paso 3 — Pago: cards seleccionables por método activo (Pago Móvil, Transferencia, Zelle, USDT, Binance Pay, etc. — según PaymentMethod activos en BD, con su ícono, instrucciones y moneda). Al seleccionar, muestra instrucciones específicas del método. El monto a pagar en Bs. usa el ExchangeRateProvider vigente al momento del checkout (congela la tasa usada en el pedido, no la recalcules después silenciosamente).

Formulario de confirmación de pago: referencia, monto, fecha, titular, banco/teléfono según lo que pida el método (campos dinámicos por método, no un formulario genérico que no aplica a todos). Componente de carga de comprobante: drag/drop en desktop, upload en mobile, con upload firmado directo a la carpeta privada de Cloudinary (nunca pasa por un bucket público), validación real de MIME y extensión, límite de tamaño, nombre no predecible.

Paso 4 — Confirmación: pantalla positiva con número de pedido (formato SAV-XXXXXX), estado "Verificando tu pago", explicación clara de qué sigue, botón "Enviar pedido por WhatsApp" (genera mensaje prellenado con número, nombre, total, método — abre wa.me, no manda nada automáticamente por una API de negocio todavía) y botón secundario "Ver mi pedido".

Al crear el pedido: transacción que verifica stock real de cada variante, decide si reserva inventario (documenta cuánto tiempo dura esa reserva en /docs/PAYMENTS-VENEZUELA.md — hazlo configurable, no un número mágico en el código) y crea el Order en estado PENDING_PAYMENT, con idempotencia (si el usuario hace doble submit no se duplica el pedido).

Entrega: dos usuarios intentando comprar la última unidad de una variante en paralelo — uno gana, el otro recibe el estado "sin stock" en checkout, sin condición de carrera (usa transacción/locking real, no un check-then-write ingenuo). Prueba también: cupón inválido, upload de un archivo que no es imagen/PDF real (aunque tenga extensión falsificada), sesión expirada a mitad de checkout.
```

### 3.7 — Cuenta del cliente

**PROMPT → Fase 3.7**

```
Implementa /mi-cuenta con: Resumen, Mis pedidos (lista + detalle con timeline de estado: Pedido creado → comprobante enviado → comprobante revisado → pago aprobado → preparando → enviado → entregado, con íconos de check/en progreso/pendiente), Wishlist, Direcciones (crear/editar/eliminar, una por defecto), Perfil, Seguridad (cambiar password, sesiones activas si aplica), Cerrar sesión.

Sidebar en desktop, tabs en mobile. No almacenes datos financieros que no sean estrictamente necesarios (nunca números de tarjeta completos ni nada similar — los métodos de pago de SAVAYA son manuales/informativos, no hay tarjetas que guardar).

Entrega: un cliente solo puede ver sus propios pedidos y direcciones (probar intentando acceder al pedido de otro usuario por ID directo en la URL — debe fallar en servidor, no solo estar oculto en la UI).
```

### 3.8 — Páginas adicionales + Mayorista

**PROMPT → Fase 3.8**

```
Implementa las páginas: Nosotros, Contacto, Preguntas Frecuentes, Guía de Tallas, Envíos, Cambios y Devoluciones, Política de Privacidad, Términos, Tiendas/Distribuidores, 404, 500, y /ventas-al-mayor.

/ventas-al-mayor: landing con explicación del programa mayorista de SAVAYA, beneficios, formulario de contacto (nombre, negocio, ciudad, WhatsApp, volumen estimado), datos comerciales, CTA a WhatsApp. Es solo una landing con formulario — NO implementes catálogo B2B, precios diferenciados ni cuentas mayoristas todavía (eso es explícitamente futuro según el prompt maestro), pero deja el formulario guardando el lead en una tabla propia (no lo mezcles con Customer) para que en el futuro se pueda convertir sin rehacer nada.

Nosotros debe usar contenido real de la historia de la marca (Carabobo, origen, enfoque en la mujer venezolana evolucionando a hombre y mujer) — no un texto genérico de "somos una empresa apasionada por la calidad". Usa como referencia el copy real que ya existe en el brochure de marca, pero reescrito para 2026 (no lo copies literal, adapta el tono a la nueva identidad ampliada mujer+hombre).

Todas estas páginas deben tener metadata SEO propia (title, description, canonical) y estar en el sitemap salvo 404/500.
```

### 3.9 — Estados de interfaz (auditoría transversal)

**PROMPT → Fase 3.9**

```
Recorre todo el storefront construido en 3.1-3.8 y verifica/completa explícitamente estos estados, que no deben faltar en ningún flujo: loading, vacío, error, offline (o degradación razonable sin conexión), sin stock, producto eliminado/agotado, talla agotada, cupón inválido, sesión expirada, error de upload, pago rechazado, pedido cancelado, búsqueda sin resultados.

Para cada uno, dime en qué pantalla está y muéstrame que existe (no me digas "ya están todos", pruébalo). Si falta alguno, impleméntalo ahora en vez de dejarlo pendiente — este es el checkpoint antes de pasar a Admin.
```

---

## FASE 4 — Panel administrativo

El admin comparte el design system de Fase 2 pero con layout propio (sidebar + contenido denso tipo SaaS).

### 4.1 — Shell del admin (sidebar, auth, layout)

**PROMPT → Fase 4.1**

```
Implementa el layout base del admin (/admin) protegido por autenticación + RBAC de la Fase 1.4: sidebar con Inicio, Pedidos, Pagos, Productos, Inventario, Clientes, Contenido, Promociones, Delivery, Tasas, Analytics, Usuarios, Configuración (cada ítem visible solo si el usuario tiene permiso — y bloqueado también en servidor si intenta acceder por URL directa sin permiso), buscador global, header con usuario/logout, breadcrumb de sección.

Session timeout razonable para admin (más corto que storefront) y reautenticación para las acciones de alto riesgo ya definidas en Fase 1.4.

Entrega: un usuario con rol "Catálogo" no ve ni puede acceder a /admin/usuarios ni a /admin/tasas aunque escriba la URL directamente.
```

### 4.2 — Dashboard

**PROMPT → Fase 4.2**

```
Implementa /admin (dashboard) con KPI cards (ventas, pedidos, ticket promedio, clientes, nuevos clientes), selector de periodo (hoy, 7 días, 30 días, mes, rango personalizado), gráfico de ventas en el tiempo, bloque de "pagos pendientes de revisión" (con acceso directo a cada uno), bloque de stock bajo, bloque de productos más vendidos, y si hay datos suficientes: ventas por ciudad/estado/método de pago.

Todas las queries deben ser eficientes (agregaciones en SQL, no traer todos los pedidos y sumar en JS) — verifica que no haya N+1 en ninguna de estas vistas.

Entrega: cambiar el periodo actualiza todos los bloques de forma consistente, y el dashboard carga con skeletons mientras resuelve, no con la pantalla en blanco.
```

### 4.3 — Catálogo (productos, variantes, categorías, colecciones)

**PROMPT → Fase 4.3**

```
Implementa el editor de productos con tabs (General, Media, Variants, Inventory, SEO, Related) — evita un formulario gigante de una sola pantalla. Permite crear, editar, duplicar, archivar, publicar, despublicar y programar publicación.

Media: subida a Cloudinary (carpeta pública savaya/products), reordenar, marcar portada. Variants: color × talla con SKU autogenerado editable y precio/stock por variante. SEO: title, meta description, slug, canonical, index/noindex, OG image — todo editable sin tocar código.

Implementa también el CRUD de categorías y colecciones (jerarquía categoría > subcategoría, colecciones independientes de la jerarquía).

Entrega: crear un producto completo (con 2 variantes, 3 fotos, SEO) desde el admin y verlo aparecer correctamente en el PLP y PDP del storefront sin ningún cambio de código adicional.
```

### 4.4 — Inventario

**PROMPT → Fase 4.4**

```
Implementa la vista de inventario: tabla producto/SKU/color/talla/stock/reservado/disponible, con highlight visual para stock bajo (umbral configurable por producto o global). Permite registrar movimientos manuales (entrada, ajuste, corrección) siempre con motivo obligatorio, quedando en InventoryMovement con trazabilidad completa — nunca un UPDATE directo de la columna de stock desde esta pantalla.

Entrega: hacer un ajuste manual de stock queda visible en el historial de movimientos de esa variante, con quién lo hizo y por qué.
```

### 4.5 — Pedidos y verificación de pagos

**PROMPT → Fase 4.5**

```
Implementa la tabla de pedidos (pedido, cliente, fecha, total, pago, delivery, estado) con filtros y búsqueda, y el detalle de pedido (cliente, productos, shipping, payment, proof, notas, timeline).

Implementa la pantalla de verificación de pago: panel izquierdo con datos del pedido y lo que el cliente reportó (referencia, monto, fecha, titular), panel derecho con el comprobante ampliable (servido vía URL firmada temporal de Cloudinary, nunca la URL pública/permanente). Acciones: Aprobar pago (positiva), Rechazar (requiere motivo, es una acción de riesgo — confirma antes de ejecutar), Solicitar información adicional.

Aprobar pago dispara la transición de estado correspondiente (PAYMENT_UNDER_REVIEW → PAID) validada contra la máquina de estados de la Fase 1.3 — no permitas transiciones inválidas (por ejemplo aprobar un pedido ya cancelado). Cada acción queda en AuditLog y en OrderStatusHistory.

Entrega: intentar aprobar un pago ya rechazado (o viceversa) es rechazado por el sistema con un mensaje claro, no falla silenciosamente ni con un error genérico.
```

### 4.6 — CRM

**PROMPT → Fase 4.6**

```
Implementa la ficha de cliente: nombre, contacto, WhatsApp, pedidos, total gastado, último pedido, frecuencia, ubicación, tags, notas, timeline de actividad. Implementa tags/segmentos (nuevo, recurrente, VIP, alto ticket, inactivo, frecuente, mayorista) — pueden ser manuales inicialmente, con la puerta abierta a automatizarlos después (no los automatices ahora si no hay volumen de datos real para definir los umbrales; documenta el criterio pendiente en vez de inventar números).

Entrega: agregar una nota o tag a un cliente queda en su timeline con autor y fecha.
```

### 4.7 — CMS / Page builder

**PROMPT → Fase 4.7**

```
Construye la interfaz admin para el sistema de bloques de la Fase 3.1: panel izquierdo con lista de bloques disponibles, centro con preview en vivo, derecho con configuración del bloque seleccionado. Permite reordenar (drag and drop), activar/desactivar, editar contenido de cada bloque (Hero, Banner, ShopByCategory, ProductCarousel, EditorialBlock, SplitBlock, BenefitsBlock, Newsletter, AnnouncementBar), con draft/preview/publish y, si el tiempo lo permite razonablemente, historial simple con rollback a la versión anterior.

Restringe estrictamente los campos editables por tipo de bloque (Zod schema por tipo) — el admin nunca debe poder pegar HTML/JS arbitrario ni elegir tipografías o colores fuera de los tokens del design system.

Implementa también Banners (crear, activar/desactivar, programar por fecha, imagen desktop/mobile, CTA, URL) y Popups (por fechas, páginas, frecuencia, nuevos visitantes) — con la regla de UX de no mostrar popups agresivos inmediatamente al entrar (delay mínimo configurable, nunca 0).

Entrega: reordenar los bloques en el admin y ver el nuevo orden reflejado en la Home real al refrescar, sin deploy.
```

### 4.8 — Promociones y descuentos

**PROMPT → Fase 4.8**

```
Implementa el sistema de cupones y promociones: porcentaje o monto fijo, mínimo de compra, aplicable a categorías/productos/colección/cliente específico, primer pedido, límite global, límite por usuario, fecha inicio/fin. Toda la validación (vigencia, límites, aplicabilidad) se hace en servidor al aplicar el cupón en el carrito/checkout — nunca solo mostrar/ocultar en el cliente.

Entrega: un cupón vencido o que ya alcanzó su límite de usos es rechazado con un mensaje claro tanto en la UI como si se intenta forzar vía server action directamente.
```

### 4.9 — Delivery y zonas de envío

**PROMPT → Fase 4.9**

```
Implementa la configuración admin de shipping: zonas, ciudades, tarifas, delivery gratuito por monto mínimo, métodos activos/inactivos, información adicional por método. Esto es lo que alimenta el Paso 2 del checkout (Fase 3.6) — verifica que agregar una zona nueva desde el admin la hace aparecer en checkout sin tocar código.

Entrega: crear una zona de delivery nueva con tarifa específica desde el admin y completar un pedido de prueba usándola.
```

### 4.10 — Tasas de cambio (BCV)

**PROMPT → Fase 4.10**

```
Implementa la pantalla admin de tasas: USD/BCV y EUR/BCV, mostrando valor actual, fuente, última actualización, con botón "Actualizar" (dispara el ExchangeRateProvider real de la Fase 5.2) y una acción avanzada "Override manual" claramente marcada como sensible (requiere reautenticación, requiere motivo, y registra en AuditLog usuario, tasa anterior, tasa nueva, fecha, motivo — nunca reemplaza en silencio).

Muestra también la política de USDT (definida como configuración explícita, no como "1 USDT = 1 USD" asumido por defecto en el código).

Entrega: hacer un override manual queda visible en el historial de tasas y en el audit log, y el storefront usa inmediatamente la tasa nueva.
```

### 4.11 — Usuarios, roles y configuración general

**PROMPT → Fase 4.11**

```
Implementa la gestión admin de usuarios internos y roles (asignar rol, revocar, ver permisos efectivos), y el panel de Configuración: datos de empresa (nombre, logo, contacto, WhatsApp, redes), métodos de pago (activar/desactivar, editar instrucciones y cuentas), delivery (enlaza a 4.9), tienda (moneda, idioma, mínimos), diseño (logo, banners globales), analytics (IDs de GA4/Meta/Search Console) y SEO global (metadata por defecto, imagen social).

Ningún dato de estos debe requerir tocar .env ni la base de datos manualmente para cambiarlo — esa es la prueba de aceptación completa de esta fase (regla 80 del prompt maestro: "cambiar el número de Pago Móvil" o "agregar Valencia como zona" nunca requiere editar código).

Entrega: cambia el número de Pago Móvil desde el admin y confirma que el checkout lo refleja de inmediato.
```

---

## FASE 5 — Integraciones

### 5.1 — Cloudinary completo

**PROMPT → Fase 5.1**

```
Formaliza la integración de Cloudinary: transformaciones automáticas (formato moderno, compresión, tamaños responsive con srcset), blur placeholder donde mejore la percepción de carga, organización de carpetas (savaya/products, savaya/categories, savaya/banners, savaya/editorial, savaya/cms) y la carpeta privada savaya/private/payment-proofs con upload firmado, tipo private/authenticated, URLs firmadas de corta duración generadas solo para usuarios con permiso.

Audita todo el storefront y admin construidos hasta ahora y corrige cualquier imagen que no esté pasando por esta capa (por ejemplo un <img> suelto en vez de next/image + Cloudinary loader).

Entrega: confirma con devtools que ninguna imagen de producto pesa más de lo necesario para su tamaño de render, y que una URL de comprobante de pago copiada y pegada en una pestaña incógnita no carga (por expirada o por falta de auth).
```

### 5.2 — ExchangeRateProvider real

**PROMPT → Fase 5.2**

```
Implementa la abstracción ExchangeRateProvider (interfaz + adaptador) que obtiene la tasa oficial USD/BCV y EUR/BCV desde una fuente configurada (evalúa opciones como pydolarve.org, bcvapi.tech o cotizave.com — community APIs que replican el dato oficial del BCV; documenta cuál eliges y por qué en el ADR 003, incluyendo qué haces si esa fuente cae).

Requisitos: caché (no llamar a la fuente externa en cada request), manejo de errores, fallback a la última tasa válida guardada en BD, timestamp visible de cuándo se actualizó, actualización programada (cron/scheduled job, no manual cada vez), y que el override manual de la Fase 4.10 siga funcionando por encima de esto sin conflictos.

Ningún componente ni ruta debe llamar a la fuente externa directamente — todo pasa por este servicio único.

Entrega: simula que la fuente externa falla (apágala o fuerza un error) y confirma que el sitio sigue mostrando la última tasa válida conocida en vez de romperse o mostrar $0.
```

### 5.3 — GA4 (AnalyticsService)

**PROMPT → Fase 5.3**

```
Implementa una capa AnalyticsService única (no llamadas a gtag desde 50 componentes distintos) que dispare los eventos ecommerce de GA4: view_item_list, select_item, view_item, add_to_wishlist, add_to_cart, view_cart, remove_from_cart, begin_checkout, add_shipping_info, add_payment_info, purchase.

purchase debe dispararse cuando el pedido pasa a estado PAID según la máquina de estados (Fase 1.3), no antes — nunca en el momento en que el cliente solo sube el comprobante.

Entrega: recorre el funnel completo en modo desarrollo y confirma en el debugger de GA4 (o en logs) que cada evento se dispara una sola vez, con los parámetros correctos, en el momento correcto.
```

### 5.4 — Meta Pixel + Conversions API

**PROMPT → Fase 5.4**

```
Implementa Meta Pixel (browser) + Meta Conversions API (servidor) con deduplicación vía event_id compartido, capturando UTM, fbclid, fbp, fbc cuando corresponda. Todo token/secret de Meta se usa solo desde servidor, nunca expuesto en el cliente.

Reutiliza el AnalyticsService de 5.3 como capa de desacople — el ecommerce dispara eventos internos genéricos, y esta capa decide cómo traducirlos a GA4 y a Meta sin que el resto del código conozca los detalles de cada proveedor.

Entrega: un mismo evento de compra no aparece duplicado en Meta Events Manager (verifica con la herramienta de deduplicación de eventos), y ningún token aparece en el bundle de cliente (verifícalo inspeccionando el JS servido).
```

### 5.5 — SEO técnico

**PROMPT → Fase 5.5**

```
Implementa sitemap dinámico (productos y categorías publicados), robots.txt, metadata (title/description/canonical/OG/Twitter) generada por página usando los campos SEO ya editables desde el admin (Fase 4.3), structured data (Product, Organization, BreadcrumbList) en JSON-LD, y verificación de Google Search Console.

Confirma que la regla de no-indexar combinaciones de filtros sin valor (Fase 3.3) sigue respetada en el sitemap (no debe listar URLs con filtros).

Entrega: valida al menos 3 páginas de producto y 2 de categoría con la herramienta de Rich Results de Google (o equivalente) sin errores de structured data.
```

### 5.6 — WhatsApp

**PROMPT → Fase 5.6**

```
Formaliza la generación de enlaces de WhatsApp (wa.me) usados en confirmación de pedido (Fase 3.6) y en contacto/mayorista (Fase 3.8) en un único helper reutilizable, dejando la arquitectura lista para que en el futuro un canal de notificaciones real (WhatsApp Business API) pueda reemplazar el link manual sin tocar el resto del código — usa la interfaz de notificaciones ya prevista en el dominio notifications, no acoples esto directo a los server actions de pedidos.

Entrega: confirma que el mensaje prellenado incluye número de pedido, nombre, total y método, y que abrir el link no requiere que el pedido ya esté "enviado" — es un canal de comunicación, no la fuente de verdad del pedido.
```

---

## FASE 6 — Hardening

### 6.1 — Seguridad

**PROMPT → Fase 6.1**

```
Ejecuta una auditoría de seguridad completa sobre todo lo construido: revisa que ningún endpoint confíe en precio/total/descuento/rol/userId/stock/moneda/estado de pago enviado por el cliente; confirma headers de seguridad activos en producción (no solo report-only); confirma rate limiting activo en login, registro, reset password, checkout, creación de pedidos, upload, búsqueda, y cualquier API pública; confirma CORS restrictivo (nada de Access-Control-Allow-Origin: *); confirma que los comprobantes de pago son inaccesibles sin autorización; confirma que AuditLog registra todo lo que debía registrar según CLAUDE.md sección 6.

Reporta hallazgos en /docs/SECURITY.md con severidad y qué se corrigió. Si algo no se puede corregir en esta fase, dilo explícitamente con el riesgo que implica dejarlo pendiente, no lo omitas del reporte.
```

### 6.2 — Performance

**PROMPT → Fase 6.2**

```
Corre Lighthouse (o equivalente) sobre Home, PLP, PDP y Checkout en mobile y desktop. Objetivo: LCP < 2.5s, INP < 200ms, CLS < 0.1. Optimiza lo que haga falta: revisa uso de Server vs Client Components (nada de "use client" por comodidad en algo que no lo necesita), code splitting/dynamic imports justificados, tamaño de bundle, fuentes, imágenes, prefetch controlado, caching/revalidation de las rutas que lo permiten.

Reporta antes/después con números reales, no estimaciones, en /docs/DEPLOYMENT.md o un archivo de performance dedicado.
```

### 6.3 — Accesibilidad

**PROMPT → Fase 6.3**

```
Audita accesibilidad en todo el storefront (el admin puede ser un poco más laxo pero no ignorarlo): contraste de color contra los tokens definidos, navegación completa por teclado (incluyendo el mega menú, los drawers y el bottom sheet de filtros), foco visible en todo elemento interactivo, labels en todos los formularios (incluyendo checkout y upload de comprobante), tamaños táctiles, estados de error que no dependan solo del color.

Corrige lo que encuentres y reporta lo que quede pendiente con justificación.
```

### 6.4 — Testing

**PROMPT → Fase 6.4**

```
Completa la cobertura de tests:

Unit: cálculo de totales/descuentos, ExchangeRateProvider (incluyendo el caso de fallback), permisos/RBAC, cálculo de stock disponible, transiciones de la máquina de estados de pedido (válidas e inválidas).

Integration: flujo de creación de pedido, flujo de aprobación de pago, movimientos de inventario, acciones críticas del admin.

E2E (Playwright): registro → producto → variante → carrito → checkout → método de pago → comprobante → pedido creado → admin revisa pago → pedido aprobado. Además, como casos separados: producto agotado, cupón inválido, upload inválido, sesión expirada a mitad de checkout, stock concurrente (dos compras simultáneas de la última unidad), usuario sin permisos intentando una acción de admin.

Entrega el reporte de cobertura y confirma que el suite completo corre en CI (o al menos localmente de forma reproducible) sin flakiness evidente.
```

---

## FASE 7 — QA final

**PROMPT → Fase 7**

```
Ejecuta una pasada de QA completa de todo el sitio (storefront + admin) en 390px, 768px, 1024px, 1440px, cubriendo los flujos principales de Fase 6.4 más una revisión visual (no solo funcional) contra el design system de Fase 2 — nada de textos desbordados, botones sin padding correcto, imágenes con aspect ratio roto, o inconsistencias de color/radio fuera de los tokens.

Verifica también los estados de la Fase 3.9 uno por uno en dispositivo real o emulado, no solo en el ancho de ventana de un navegador de escritorio redimensionado.

Entrega una lista de issues encontrados priorizada (crítico/alto/medio/bajo) y corrige al menos todos los críticos y altos antes de considerar el proyecto listo para Fase 8.
```

---

## FASE 8 — Migración (reemplazo de savaya-tienda)

**No ejecutes esta fase hasta que Fases 0-7 estén cerradas y tú hayas aprobado visualmente el resultado.**

**PROMPT → Fase 8**

```
Antes de cualquier reemplazo: haz un backup completo y verificado de savaya-tienda (código, base de datos si aplica, media) y documenta en /docs/DEPLOYMENT.md exactamente cómo restaurarlo si algo sale mal.

Prepara (pero no ejecutes sin mi confirmación explícita) el plan de corte: DNS/dominio, variables de entorno de producción, migración de datos reales si aplica (catálogo, clientes, pedidos históricos si se van a preservar), ventana de mantenimiento si hace falta, y un plan de rollback concreto y probado (no solo "en teoría se puede revertir").

No borres ni sobrescribas savaya-tienda en ningún momento de esta fase — el reemplazo es a nivel de qué dominio/hosting sirve cada uno, no una eliminación de código.

Entrega el plan de corte como documento para que yo lo apruebe antes de que se ejecute cualquier paso irreversible.
```

---

## Decisiones ya tomadas (resumen — detalle completo queda en los ADRs de Fase 1.2)

**Identidad de marca (a partir del brochure real de SAVAYA):** marca nacida en Carabobo, wordmark geométrico en mayúsculas, paleta negro dominante + blanco cálido + dorado como acento (nunca protagonista de fondos grandes), tono "moda + empoderamiento", historia de una marca joven (pocos años en el mercado) escalando de venta por aliados/redes a un canal propio. La nueva tienda debe sentirse como la evolución 2026 de esa identidad, ampliada a hombre sin borrar el origen femenino — el copy de "Nosotros" (Fase 3.8) debe basarse en esa historia real, no en una genérica.

**Stack:** Next.js 16 + React 19.2 + TypeScript estricto, Tailwind v4, PostgreSQL (Neon), Drizzle ORM, Auth.js + 2FA admin, Cloudinary, Vercel, Upstash (rate limiting), Sentry, Vitest + Playwright. Justificación completa de Drizzle vs. Prisma y de la fuente de tasas BCV en los ADRs 002 y 003 — revísalos antes de la Fase 1.2 por si prefieres Prisma (más tooling visual, curva más suave) en vez de Drizzle (más rendimiento, menos "magia"); ambos son razonables, Drizzle es la recomendación por defecto para este proyecto.

**Design tokens:** color negro #0A0A0A, blanco cálido #F7F5F0, dorado #C9A227 como acento puntual, radios grandes (predominan lg/xl/pill), tipografía Inter (UI/body) + Archivo (headings) — ambas gratuitas, variables, de carga rápida.

**Búsqueda:** Postgres full-text ahora, arquitectura lista para Meilisearch después si el catálogo crece mucho — evita instalar un motor de búsqueda dedicado antes de necesitarlo.

**Pendiente de que tú decidas (no lo puede inventar Claude Code):** política exacta de USDT (¿1:1 con USD comercial o con spread?), lista final y tarifas reales de zonas de delivery/encomiendas, textos finales de marketing de Home/Hero, y si hay datos reales de catálogo/clientes en `savaya-tienda` que deban migrarse en vez de partir de cero (esto lo confirma la Fase 0).
