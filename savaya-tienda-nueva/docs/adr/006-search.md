# ADR-006: Postgres full-text search (tsvector + pg_trgm) detrás de SearchProvider

## Estado

Decidido

## Contexto

SAVAYA necesita un buscador en el storefront que permita a los clientes encontrar productos por nombre, SKU, categoría, color, talla, colección, y con tolerancia a errores tipográficos comunes (buscar "runer" y encontrar "running", "sandalas" y encontrar "sandalias").

El catálogo actual de SAVAYA es mediano: `savaya-tienda` tiene un catálogo de calzado con cientos de variantes (combinaciones talla × color) pero no miles de productos maestros. La proyección para los próximos 2-3 años es de 200-500 productos en el catálogo maestro.

`savaya-tienda` tiene un buscador básico implementado como query Supabase con `.ilike()` — sin tolerancia a typos, sin ranking por relevancia, sin indexación de texto completo. El resultado es que buscar un SKU incompleto o con un error de tipeo no devuelve resultados.

## Decisión

**Postgres full-text search con `tsvector` y `pg_trgm`, implementado detrás de una interfaz `SearchProvider`.**

### Interfaz SearchProvider

Ningún componente ni ruta del storefront llama directamente a la query de búsqueda de Postgres. Todo pasa por:

```ts
// domains/catalog/search-provider.ts
interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResult>
  suggest(term: string): Promise<SearchSuggestion[]>
}

type SearchQuery = {
  term: string
  filters?: ProductFilters
  limit?: number
  offset?: number
}
```

`PostgresSearchProvider` implementa esta interfaz hoy. Si en el futuro se decide migrar a Meilisearch, se crea `MeilisearchSearchProvider` con la misma interfaz — el resto del código no cambia.

### Implementación técnica

**tsvector:** columna generada en la tabla `products` que combina nombre del producto, descripción corta, categoría, colección, palabras clave, colores disponibles, tallas, SKU de variantes. Actualizada automáticamente por trigger al modificar el producto.

```sql
-- Columna generada en products
search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(keywords, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category_name, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(sku_list, '')), 'A')
) STORED
```

Idioma: `spanish` para el stemmer (buscar "zapatilla" también encuentra "zapatillas"). `simple` para SKUs y códigos donde el stemming no aplica.

**pg_trgm:** extensión de Postgres para similitud de trigramas — permite buscar con typos. Buscar "runer" encuentra "runner" porque comparten suficientes trigramas. Índice GIN sobre `name` para esta búsqueda.

**Query combinada:** la búsqueda ejecuta ambos mecanismos en una sola query y rankea por combinación de relevancia de texto y similitud de trigrama.

**Índice GIN** en `search_vector` para full-text, y índice GIN en `name` para `pg_trgm`. Ambos deben estar presentes desde la migración inicial.

### Campos indexados para búsqueda

- Nombre del producto (peso A — más relevante)
- SKU de variantes (peso A — búsqueda exacta por SKU es caso frecuente)
- Palabras clave del producto (peso B)
- Descripción corta (peso B)
- Nombre de categoría y colección (peso C)
- Colores y tallas disponibles (peso C)

## Alternativas consideradas

### Algolia (descartado)

Algolia es el estándar de facto para búsqueda en e-commerce con:
- UI components prebuilt (InstantSearch)
- Relevance tuning visual
- Typo tolerance automática
- Búsqueda instantánea (<100ms)

**Razón de descarte:**
- **Costo:** Algolia cobra por operaciones de búsqueda (records × queries). Para el volumen de SAVAYA (<500 productos, tráfico inicial moderado) el costo mensual no se justifica cuando Postgres puede resolver el problema sin costo adicional.
- **Sincronización de índice:** requiere mantener los datos de Postgres sincronizados con el índice de Algolia — un punto de falla adicional. Si el cron de sincronización falla, los resultados de búsqueda quedan desactualizados.
- **Overhead de integración:** instalar `algoliasearch`, configurar el índice, el dashboard, las réplicas por criterio de ordenamiento. Semanas de trabajo para un problema que Postgres resuelve en días.

La interfaz `SearchProvider` permite adoptar Algolia en el futuro si el volumen lo justifica — sin tocar el resto del código.

### Meilisearch (válido pero prematuro)

Meilisearch es un motor de búsqueda open-source con:
- Relevance excelente out-of-the-box
- Typo tolerance nativa
- Faceted search (filtros dinámicos con conteos)
- API simple y documentada

**Por qué no ahora:**
- Requiere un servidor adicional (instancia de Meilisearch hosteada) — overhead de operaciones y costo (Meilisearch Cloud o auto-hosted)
- Para 200-500 productos, Postgres con pg_trgm resuelve el 95% del problema de búsqueda con cero overhead operacional adicional
- La interfaz `SearchProvider` está diseñada exactamente para esta migración — cuando el catálogo crezca a 2000+ productos o cuando los tiempos de búsqueda sean medibles en la experiencia de usuario, se adopta Meilisearch

Meilisearch es la alternativa correcta si SAVAYA escala significativamente. Por eso la interfaz existe — para que esa migración sea un sprint de una semana, no un refactor de meses.

### Elasticsearch / OpenSearch (descartado)

Sobre-ingeniería para el volumen de SAVAYA. Requiere infraestructura dedicada y expertise de operaciones que no existe en el equipo. Para miles de productos con faceting complejo podría justificarse, pero ese escenario no existe ni en el mediano plazo para este negocio.

## Consecuencias

**Positivo:**
- Sin costo adicional — la extensión `pg_trgm` está disponible en Supabase Postgres
- Sin sincronización de datos — la DB es la única fuente de verdad
- Typo tolerance funcional para los errores más comunes en español venezolano
- La interfaz `SearchProvider` hace que la migración futura a Meilisearch/Algolia no sea un refactor, sino la implementación de un nuevo adaptador
- Buscar por SKU exacto devuelve resultado inmediato

**Negativo / trade-offs:**
- La relevancia de resultados es buena pero no excelente — no hay "did you mean" con corrección de ortografía, no hay sinónimos configurables, no hay faceted search nativo (los conteos de filtros requieren queries adicionales)
- A volumen alto (>5000 productos, >100 búsquedas/segundo), la carga en Postgres puede ser significativa — los índices GIN son eficientes pero no tan escalables como un motor dedicado
- No hay UI de relevance tuning — si los resultados no son los esperados para una búsqueda, el ajuste es via SQL, no via dashboard visual
