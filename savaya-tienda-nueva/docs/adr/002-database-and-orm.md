# ADR-002: Supabase Postgres + Drizzle ORM (conexión directa, sin SDK JS)

## Estado

Decidido

## Contexto

`savaya-tienda` usa Supabase como BaaS completo: base de datos PostgreSQL, autenticación (Supabase Auth), y todas las queries a través de `@supabase/supabase-js`. El resultado, según la auditoría (ver `AUDIT.md`), es:

- Sin ORM ni schema tipado — todas las queries son cadenas `.select().eq().in()` sin type-safety real
- Castings manuales con `unknown as SomeType[]` en decenas de lugares — errores de runtime imposibles de detectar en compilación
- Sin migraciones versionadas en Git — el schema vive en Supabase remoto y no hay forma de reproducir el estado exacto de la DB
- Tipos de respuesta escritos a mano en `lib/types.ts` que divergen silenciosamente del schema real

`savaya-tienda-nueva` necesita:
1. Type-safety real entre el schema de DB y el código TypeScript
2. Migraciones versionadas en Git (reproducibles, revisables, rollbackeables)
3. Rendimiento razonable en entorno serverless (Vercel Functions)
4. Reutilizar la misma base de datos de Supabase para no perder datos al hacer el corte en Fase 8

## Decisión

**PostgreSQL de Supabase (mismo proyecto) + Drizzle ORM, conectado via connection string directo.**

- Drizzle se conecta con `DATABASE_URL` (pooler de Supabase, PgBouncer) para queries de runtime
- `drizzle-kit` usa `DIRECT_URL` (conexión directa, sin pooler) para migraciones DDL — el pooler de Supabase no soporta `CREATE TABLE` ni otros comandos DDL
- El SDK de Supabase JS (`@supabase/supabase-js`) **no se instala** en `savaya-tienda-nueva`
- Los schemas de Drizzle viven en `domains/*/schema.ts` — uno por dominio
- Las migraciones generadas por `drizzle-kit` viven en `drizzle/migrations/` y se commitean en Git
- Las tablas viejas de `savaya-tienda` coexisten en el mismo schema de Postgres — Drizzle las ignora porque no las define en sus schemas

## Alternativas consideradas

### Neon Postgres (descartado)

Neon es una alternativa serverless de PostgreSQL con soporte nativo para branching de DB (ideal para Preview environments). Fue considerado como reemplazo de Supabase.

**Razón de descarte:** el motivo principal de quedarse en Supabase Postgres es la continuidad de datos. `savaya-tienda` tiene pedidos históricos, clientes, configuración real en esa DB. Si `savaya-tienda-nueva` usara Neon, habría que migrar todos esos datos en Fase 8 en lugar de simplemente cambiar qué proyecto sirve el dominio. Reutilizar la misma DB elimina ese riesgo.

### Prisma (no descartado — considerado válido pero Drizzle es la elección)

Prisma es la alternativa ORM más popular en el ecosistema Next.js.

**Ventajas de Prisma sobre Drizzle:**
- Herramienta visual Prisma Studio para explorar datos
- Curva de aprendizaje más suave (schema DSL propio, muy documentado)
- Comunidad más grande, más ejemplos

**Ventajas de Drizzle que inclinaron la decisión:**
- **Rendimiento en serverless:** Drizzle no genera un cliente pesado que inicializar por cada función — la conexión es un objeto de JS plano. En Vercel Functions (cold starts) esto tiene impacto real.
- **Tipos inferidos sin CLI:** Drizzle infiere los tipos directamente del schema TypeScript. Prisma requiere correr `prisma generate` para actualizar los tipos después de cada cambio de schema — un paso extra propenso a olvidos.
- **SQL explícito:** Drizzle expone el SQL que genera, lo que facilita el debugging y la optimización de queries. No hay "magia negra" que genera queries N+1 inesperadamente.
- **Sin Prisma Client en el bundle:** Prisma Client puede ser pesado para entornos edge/serverless. Drizzle no tiene overhead de cliente.

Prisma es una elección razonable para este proyecto — si alguien del equipo prefiere su DX, la decisión puede revisarse con un ADR nuevo. Por defecto, Drizzle.

### Supabase JS SDK como ORM (descartado)

Usar `@supabase/supabase-js` como si fuera un ORM (como hace `savaya-tienda`) es exactamente el problema que se está resolviendo. No ofrece type-safety real ni migraciones versionadas. Descartado sin más análisis.

## Consecuencias

**Positivo:**
- Type-safety de extremo a extremo: el tipo de retorno de una query Drizzle coincide exactamente con el schema de la tabla
- Migraciones en Git: cualquier cambio de schema es revisable en PR y reproducible en cualquier entorno
- Sin overhead de Supabase SDK en el bundle del servidor
- Reutilizar la DB de Supabase elimina la migración de datos en Fase 8

**Negativo / trade-offs:**
- Dos URLs de DB en las variables de entorno (`DATABASE_URL` y `DIRECT_URL`) — requiere documentación clara (está en este ADR y en `DATABASE.md`)
- Sin Prisma Studio — hay que usar el dashboard de Supabase o Drizzle Studio para explorar datos
- El equipo necesita entender la distinción entre el pooler (runtime) y la conexión directa (migraciones)
- Drizzle tiene menos ejemplos y tutoriales que Prisma — la curva inicial es ligeramente más pronunciada
