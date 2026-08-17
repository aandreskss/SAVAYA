# UX-UI.md — Design System de SAVAYA

> Última actualización: 2026-08-15
> Se implementa en la Fase 2. Este documento es la fuente de verdad de todos los tokens y decisiones de diseño — ningún componente usa valores mágicos sueltos que no estén aquí.

---

## 1. Identidad de marca

SAVAYA es una marca venezolana de calzado nacida en Carabobo. En 2026 amplía su catálogo de femenino a mujer + hombre sin borrar su origen. La estética es **elegante, limpia y directa** — negro dominante, blanco cálido, dorado como acento puntual. El diseño comunica aspiración sin pretensión, accesible sin ser genérico.

---

## 2. Tokens de color

Definidos como CSS custom properties en `shared/ui/tokens.css` e integrados en Tailwind v4 via `@theme`.

| Token | Hex | Uso |
|---|---|---|
| `color.brand.black` | `#0A0A0A` | Fondo base, texto principal sobre fondos claros |
| `color.brand.offwhite` | `#F7F5F0` | Fondo cálido alternativo al blanco puro (body, secciones alternas) |
| `color.brand.white` | `#FFFFFF` | Blanco puro para superficies de cards sobre fondo offwhite |
| `color.accent.gold` | `#C9A227` | Acento: badges, iconografía de marca, detalles de UI — **nunca como fondo de sección grande** |
| `color.accent.gold-soft` | `#E8D9A8` | Tinte claro del dorado — fondos sutiles de badge, highlights |
| `color.text.primary` | `#0A0A0A` (sobre claro) / `#FFFFFF` (sobre oscuro) | Texto de alta jerarquía |
| `color.text.secondary` | `#6B6B6B` | Texto secundario, metadata, labels de formulario |
| `color.border` | `#E5E2DC` | Bordes de cards, inputs, divisores |
| `color.surface` | `#FFFFFF` | Superficie de cards cuando el fondo es offwhite |
| `color.success` | `#1E7F4F` | Estados de éxito, pago aprobado, stock disponible |
| `color.warning` | `#B8791A` | Alertas, stock bajo, estado pendiente |
| `color.error` | `#C0362C` | Errores de formulario, pago rechazado, sin stock |

### Regla de contraste

Todos los pares de color/fondo deben cumplir WCAG AA mínimo (4.5:1 para texto normal, 3:1 para texto grande). El dorado `#C9A227` sobre blanco puro no cumple — solo usarlo sobre `#0A0A0A` o sobre `#F7F5F0` oscuro.

---

## 3. Tipografía

**Máximo 2 familias — sin excepciones.**

| Familia | Uso | Pesos cargados | Fuente |
|---|---|---|---|
| **Archivo** (variable) | Headings, display, wordmark display | 500, 700 | Google Fonts, licencia OFL |
| **Inter** (variable) | UI, body, labels, precios, datos | 400, 500, 600 | Google Fonts, licencia OFL |

Ambas se cargan con `next/font/google` (subsetted, sin layout shift) — no CDN link directo.

### Escala tipográfica

| Nivel | Familia | Peso | Tamaño (base) |
|---|---|---|---|
| Display / Hero | Archivo | 700 | 48–72px (responsive) |
| H1 | Archivo | 700 | 36–48px |
| H2 | Archivo | 500 | 28–36px |
| H3 | Archivo | 500 | 22–28px |
| Body Large | Inter | 400 | 18px |
| Body | Inter | 400 | 16px |
| Body Small | Inter | 400 | 14px |
| Label / Caption | Inter | 500 | 12px |
| Precio principal | Inter | 600 | 24px (PDP) / 18px (card) |
| Precio anterior | Inter | 400 | tachado, color.text.secondary |

---

## 4. Spacing

Escala de 4px. Solo se usan estos valores — sin valores intermedios ad-hoc.

| Token | px |
|---|---|
| `spacing.1` | 4px |
| `spacing.2` | 8px |
| `spacing.3` | 12px |
| `spacing.4` | 16px |
| `spacing.6` | 24px |
| `spacing.8` | 32px |
| `spacing.12` | 48px |
| `spacing.16` | 64px |
| `spacing.24` | 96px |

---

## 5. Border radius

Uso predominante: cards, imágenes y botones usan `lg`, `xl` o `pill`. El `radius.none` (0) es la excepción — solo para líneas divisorias, bordes de tablas en el admin y elementos que intencionalmente tienen esquinas rectas.

| Token | px | Uso |
|---|---|---|
| `radius.sm` | 8px | Tags de estado, inputs en contextos compactos |
| `radius.md` | 14px | Modales, drawers, tooltips |
| `radius.lg` | 24px | Cards de producto, imágenes, secciones |
| `radius.xl` | 32px | CategoryCard ovalada, banners hero |
| `radius.pill` | 999px | Botones principales, badges, chips, avatares |
| `radius.none` | 0px | Divisores, bordes de tabla del admin |

---

## 6. Sombras

Sutiles — el diseño de SAVAYA es plano/elevado sin efectos pesados tipo Material antiguo.

| Token | Valor CSS |
|---|---|
| `shadow.sm` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` |
| `shadow.md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` |
| `shadow.lg` | `0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.05)` |

---

## 7. Componentes atómicos

Todos viven en `shared/ui/`. Ninguno supera ~150 líneas. Si crece, se divide.

### Button

- Variantes: `primary` (fondo negro, texto blanco), `secondary` (borde negro, fondo transparente), `ghost` (sin borde visible, texto negro)
- Tamaños: `sm`, `md` (default), `lg`
- Estado `loading`: spinner inline, botón deshabilitado, texto cambia a "Cargando..."
- Estado `disabled`: opacity reducida, cursor not-allowed
- Radius: `pill` (999px) — siempre
- Tamaño táctil mínimo: 44px de alto

### IconButton

- Mismo sistema de variantes que `Button` pero cuadrado/circular
- Solo icono — requiere `aria-label` obligatorio

### Input

- Borde `color.border`, focus ring en `color.brand.black`
- Estado de error: borde `color.error`, mensaje de error debajo
- Label siempre visible (no placeholder como único label)
- Radius: `radius.sm`

### Select, Checkbox, Radio, Toggle

- Estilo consistente con Input
- Checkbox y Radio: estado indeterminado soportado donde aplica
- Toggle: animación de 150ms, respeta `prefers-reduced-motion`

### Badge

- Variantes de color: success, warning, error, neutral, gold
- Radius: `pill`
- Texto: Inter 500, 12px

### Chip

- Seleccionable/removible
- Usado en filtros activos, tags de cliente

### Price

- Precio actual: Inter 600
- Precio anterior: Inter 400, tachado, `color.text.secondary`
- Badge de descuento: Badge variante gold o error según el tipo de oferta
- Soporte para precio en USD + equivalente en Bs. (segunda línea más pequeña)

### Tabs

- Sin subrayado grueso — línea sutil debajo del tab activo en `color.brand.black`
- Scroll horizontal en mobile si hay más de 4 tabs

### Accordion

- Icono de chevron con transición 200ms
- Respeta `prefers-reduced-motion`

### Modal

- Overlay con blur sutil
- Trap de foco activo (el foco no puede salir del modal con Tab)
- Cierre con Escape
- Radius: `radius.md`

### Drawer

- Desde la derecha en desktop (carrito, filtros en algunos contextos)
- Animación slide-in 250ms
- Overlay oscuro

### BottomSheet

- Solo en mobile (< 768px)
- Drag handle visible
- Snap points: 50%, 100%
- Para: filtros del PLP en mobile, información adicional, confirmaciones

### Toast

- Posición: top-right en desktop, top-center en mobile
- Auto-dismiss en 4 segundos
- Variantes: success, error, warning, info
- Anunciado como `role="status"` para lectores de pantalla

### Tooltip

- Delay de 300ms antes de aparecer
- No aparece en dispositivos touch

### Pagination

- Números de página + anterior/siguiente
- Estado activo marcado visualmente y con `aria-current="page"`

### Skeleton

- Animación shimmer con `prefers-reduced-motion: reduce` respetado (sin animación)
- Formas que replican el contenido esperado (no rectángulos genéricos)

### EmptyState

- Ícono + título + descripción corta + CTA opcional
- Diseñado, no un texto plano

### ErrorState

- Mismo esquema que EmptyState
- Nunca muestra stack traces al usuario

---

## 8. Componentes de comercio

### ProductCard

- Foto principal (aspect ratio 3:4 fijo, sin distorsión)
- En desktop hover: crossfade a foto de detalle/lifestyle sin layout shift
- Nombre, precio actual, precio anterior tachado
- Badge de estado: Nuevo, Bestseller, Oferta, Últimas unidades, Exclusivo web
- Puntos de color disponibles (máx 6, luego "+N más")
- Botón de wishlist (corazón), visible siempre en mobile, solo en hover en desktop
- Radius de imagen: `radius.lg`

### CategoryCard

- Forma ovalada (`radius.xl` o `radius.pill`)
- Foto de categoría + label centrado
- Efecto sutil en hover

### ColorSelector

- Círculo por cada color disponible con el hex real
- Estado seleccionado: anillo exterior en `color.brand.black`
- Estado agotado para esa combinación: ícono de X o diagonal
- Tooltip con el nombre del color

### SizeSelector

- Grid de chips por talla
- Estado agotado: chip con texto tachado, opacity reducida, **no seleccionable** — es imposible hacer clic en él
- Estado seleccionado: fondo negro, texto blanco

### Quantity Stepper

- Botones − y + con IconButton ghost
- Input central editable (solo números)
- Límite máximo = stock disponible de la variante

### Breadcrumb

- Separador: `/` o `›`
- Último elemento: no es link, `aria-current="page"`
- Truncado en mobile con ellipsis si supera 3 niveles

### SearchBar

- Debounce 300ms
- Estado de carga con spinner
- Lista de sugerencias: productos (foto + nombre + precio), categorías relacionadas, últimas búsquedas (localStorage)
- Estado sin resultados: diseñado con sugerencias alternativas
- Cierre con Escape

### KPICard (admin)

- Valor principal grande, label, variación porcentual con color (verde/rojo), periodo
- Skeleton mientras carga

### AdminSidebar

- Ítems de navegación según permisos del usuario
- Ítems no visibles si el usuario no tiene el permiso (y bloqueados en servidor)
- Estado activo claro
- Colapsable en desktop

### AdminHeader

- Breadcrumb de sección + título
- Avatar del usuario + menú de sesión

### DataTable

- Columnas configurables
- Ordenamiento por columna (indicador de dirección)
- Filtros en header de columna
- Paginación
- Estado vacío diseñado
- Estado de carga con skeleton de filas
- Estado de error con retry

---

## 9. Estados obligatorios en toda feature

Ninguna feature está terminada si no tiene todos los estados relevantes implementados con UI real (no texto plano):

| Estado | Descripción |
|---|---|
| `loading` | Skeleton o spinner — nunca pantalla en blanco |
| `vacío` | EmptyState diseñado con ícono + mensaje + CTA |
| `error` | ErrorState con opción de reintentar |
| `sin stock` | Variante no disponible — visible, no bloqueable, con mensaje |
| `agotado` | Producto sin ninguna variante disponible |
| `sesión expirada` | Redirección a login con mensaje de contexto, no silenciosa |
| `pago rechazado` | Feedback claro con motivo y opción de reintentar |
| `pedido cancelado` | Estado terminal con explicación |
| `cupón inválido` | Error inline en el campo, no en toast |
| `error de upload` | Error inline en el componente de upload |

---

## 10. Reglas UX obligatorias

### Mobile (< 768px)

- **CTA sticky en PDP:** el botón "Agregar al carrito" queda fijo en el bottom mientras el usuario hace scroll. Desaparece cuando el CTA nativo en la página es visible.
- **CTA sticky en Checkout:** el botón de avanzar al siguiente paso queda fijo en el bottom.
- **Bottom sheet para filtros:** el sidebar de filtros del PLP no existe en mobile — se reemplaza por un BottomSheet con snap points.
- **Tamaño táctil mínimo:** 44px de altura para cualquier elemento interactivo.
- **Sin hover states como única señal:** en dispositivos touch el hover no existe — el estado activo/seleccionado debe ser claro sin depender del hover.

### Accesibilidad

- **Foco visible:** todo elemento interactivo tiene un focus ring visible y suficientemente contrastado (`outline: 2px solid #0A0A0A`, `outline-offset: 2px`). No se elimina el foco con `outline: none` sin reemplazarlo.
- **`prefers-reduced-motion`:** todas las animaciones y transiciones respetan la preferencia del sistema. Si está activada, se usa `transition: none` o transiciones instantáneas.
- **Labels explícitos:** todo campo de formulario tiene `<label>` asociado por `htmlFor`. No se usa `placeholder` como único label.
- **Contraste:** cumplir WCAG AA en todos los pares de color. El dorado sobre blanco requiere verificación — no usarlo como texto sobre fondos claros.
- **Errores accesibles:** los mensajes de error en formularios están vinculados al campo con `aria-describedby`. No dependen solo del color.

### Popups

- Delay mínimo configurable en `ApplicationSetting` — el valor por defecto del seed es 5 segundos
- Nunca mostrar un popup en el mismo instante de carga de la página (`delay: 0` es inválido y se ignora)
- Frecuencia configurable (una vez por sesión, una vez por día, etc.)

### Performance visual

- No usar imágenes de fondo CSS para imágenes de producto — siempre `next/image` para poder controlar prioridad, lazy loading y srcset
- El hero de la home usa `priority={true}` en next/image — es el LCP candidate
- Los carruseles no bloquean el thread principal — sin librerías pesadas para efectos simples

---

## 11. Página de referencia del design system (solo en desarrollo)

La ruta `/dev/design-system` muestra todos los tokens y componentes en sus estados principales. Solo accesible en `NODE_ENV=development`. No se despliega a producción.
