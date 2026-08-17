# ADR-005: Page builder con bloques tipados (Zod por tipo), sin HTML libre

## Estado

Decidido

## Contexto

El equipo de SAVAYA necesita poder editar la Home y otras páginas de marketing (banners, popups, secciones editoriales) sin necesidad de un deploy y sin depender de un desarrollador para cada cambio de texto o imagen.

Al mismo tiempo, hay dos riesgos a evitar:
1. **Inyección de código:** si el admin puede pegar HTML/JS libre, puede introducir XSS inadvertidamente (o intencionalmente si una cuenta es comprometida)
2. **Rotura del design system:** si el admin puede elegir cualquier color, fuente o tamaño libre, el resultado rompe la coherencia visual de la marca SAVAYA

`savaya-tienda` tiene un editor de hero slides (`HeroSlidesEditor.tsx`) con un campo de texto rico, y un `ConfigForm.tsx` con configuración mezclada. Ambos son monolíticos y sin validación tipada de contenido. No hay un page builder real — la Home es JSX hardcodeado con algunos datos editables.

## Decisión

**Page builder propio basado en bloques tipados, almacenados en la tabla `PageSection` con contenido validado por Zod según el tipo de bloque.**

### Principio central

Cada tipo de bloque define en código exactamente qué campos puede tener y qué tipos de valores acepta. El admin no puede salirse de esa estructura. No hay campo de HTML libre en ningún bloque.

```ts
// Ejemplo: schema Zod de un bloque Hero
const HeroBlockSchema = z.object({
  type: z.literal('Hero'),
  headline: z.string().min(1).max(80),
  subheadline: z.string().max(120).optional(),
  cta_label: z.string().max(30),
  cta_url: z.string().url(),
  image_desktop_url: z.string().url(), // URL de Cloudinary — validada por formato
  image_mobile_url: z.string().url(),
  overlay_opacity: z.number().min(0).max(0.6), // el admin no puede poner opacity: 1 (texto ilegible)
  text_color: z.enum(['white', 'black']), // solo las dos opciones del design system
})
```

Los campos que controlan apariencia están limitados a valores del design system — nunca un campo de texto libre para color o fuente.

### Tipos de bloque implementados (Fase 3.1 y 4.7)

| Tipo | Descripción |
|---|---|
| `AnnouncementBar` | Barra de anuncio con texto y CTA opcional |
| `Hero` | Banner principal con imagen, headline, CTA |
| `ShopByCategory` | Grid de cards de categorías (ovaladas) |
| `ProductCarousel` | Carrusel parametrizable (nuevos / más vendidos / tendencias / colección) |
| `EditorialBlock` | Imagen grande + copy storytelling + CTA |
| `SplitBlock` | Dos columnas (ej. Mujer / Hombre) |
| `BenefitsBlock` | Lista de beneficios con íconos |
| `Newsletter` | Formulario de suscripción |

### Almacenamiento

```sql
page_sections:
  id, page_id (null para Home), type, order, is_active, content (jsonb)
```

El campo `content` es JSONB, pero su schema está controlado por el schema Zod del tipo de bloque correspondiente. Al guardar, el server action valida el content con el schema correcto antes de hacer el INSERT/UPDATE.

## Alternativas consideradas

### Sanity CMS (descartado)

Sanity es un CMS headless popular con un estudio de edición flexible.

**Razones de descarte:**
- **Costo:** el plan Free de Sanity tiene límites de API requests y assets. Para el volumen de edición de SAVAYA (cambios frecuentes en temporada) podría requerir un plan pago.
- **Complejidad operativa:** introduce una dependencia externa para editar la Home. Si Sanity tiene downtime, el admin no puede editar contenido. Con el page builder propio, todo está en la misma DB de Supabase.
- **Overhead de integración:** requiere instalar `@sanity/client`, configurar el estudio, y mantener schemas en dos lugares (Sanity y el código TypeScript). Con Drizzle + Zod, los schemas ya existen en el código.

### Contentful (descartado)

Mismas razones que Sanity, con el agravante de que Contentful es significativamente más caro en planes pagos.

### CMS propio con HTML libre (descartado)

La alternativa más simple sería un editor tipo WYSIWYG (TipTap, Quill) que guarda HTML en la DB.

**Razón de descarte:** introduce XSS como riesgo sistémico. Si una cuenta de admin es comprometida, o si un admin sin mala intención pega HTML de una fuente externa (un email, un blog), el resultado puede ser código ejecutable en el storefront. La sanitización de HTML libre es compleja y propensa a bypasses.

Adicionalmente, el HTML libre rompe el design system por definición — el admin puede poner cualquier color, fuente o tamaño, generando inconsistencias visuales que dañan la marca.

### Builder.js / Webflow (descartado)

Herramientas de visual page building con capas externas de renderizado.
- Builder.js: vendor lock-in y dependencia de su CDN para renderizar
- Webflow: incompatible con la arquitectura Next.js elegida para SAVAYA

## Consecuencias

**Positivo:**
- El equipo de SAVAYA puede editar la Home en producción sin deploy ni desarrollador
- Cero riesgo de XSS via CMS — el HTML se genera en el código, no desde la DB
- El design system se mantiene — los bloques solo permiten opciones dentro de los tokens definidos
- Los bloques son Server Components por defecto — sin overhead de JS en el cliente para el contenido estático
- El admin puede previsualizar antes de publicar (draft mode)

**Negativo / trade-offs:**
- Cada nuevo tipo de bloque requiere trabajo de desarrollo: schema Zod, componente de renderizado, interfaz de edición en admin. No es autoservicio total para el desarrollador.
- El editor en admin (Fase 4.7) requiere implementación propia — no es tan pulido como Sanity Studio en primera versión
- Si en el futuro SAVAYA necesita tipos de contenido muy complejos (artículos de blog con rich text real, referencias cruzadas complejas), este sistema puede quedarse corto y habría que migrar a un CMS headless real
