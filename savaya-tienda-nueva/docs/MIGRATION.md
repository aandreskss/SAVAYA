# MIGRATION.md — Plan de corte a producción

> **Estado:** Pendiente de aprobación. NO ejecutar ningún paso de la Sección 3 sin revisión explícita del negocio.
>
> Última actualización: 2026-08-16

---

## Contexto

`savaya-tienda` (tienda anterior) fue un fork de Tuluoshop que **nunca llegó a producción con datos reales** — no tiene catálogo cargado, no tiene clientes, ni pedidos históricos. Por tanto, esta migración es esencialmente un **lanzamiento limpio** de `savaya-tienda-nueva`.

El dominio `www.savayavzla.com` actualmente apunta al proyecto Vercel `campanas` (landings de campaña). El corte mueve el dominio a `savaya-tienda-nueva` sin tocar `campanas` — las landings `/cp/*` seguirán funcionando porque el dominio seguirá en Vercel, solo cambia qué proyecto lo atiende.

---

## 1. Pre-lanzamiento — checklist completo

Completar **todo esto antes** de ejecutar cualquier paso de corte de dominio.

### 1.1 Infraestructura (acción del negocio)

- [ ] **Cloudinary:** Crear cuenta nueva para Savaya (no usar la de Tuluoshop). Anotar cloud name, API key y API secret.
- [ ] **Resend:** Verificar el dominio `savayavzla.com` en Resend para enviar desde `noreply@savayavzla.com`. Seguir las instrucciones de Resend para agregar los registros DNS (SPF, DKIM, DMARC).
- [ ] **Upstash Redis:** Crear base de datos Redis en Upstash. Anotar REST URL y REST TOKEN.
- [ ] **Sentry:** Crear proyecto `savaya-tienda-nueva` en Sentry. Anotar DSN.

### 1.2 Variables de entorno en Vercel (acción del negocio)

Ir a `vercel.com` → proyecto `savaya-tienda-nueva` → Settings → Environment Variables. Configurar:

| Variable | Entorno | Valor |
|---|---|---|
| `DATABASE_URL` | Production, Preview | Connection string de Supabase con pooler |
| `DIRECT_URL` | Production, Preview | Connection string directo de Supabase (para migraciones) |
| `AUTH_SECRET` | Production, Preview | `openssl rand -base64 32` — generar y guardar en lugar seguro |
| `NEXT_PUBLIC_APP_URL` | Production | `https://www.savayavzla.com` |
| `NEXT_PUBLIC_APP_URL` | Preview | URL de preview de Vercel |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Todos | Cloud name de cuenta Cloudinary Savaya |
| `CLOUDINARY_API_KEY` | Production, Preview | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | Production, Preview | API secret de Cloudinary |
| `UPSTASH_REDIS_REST_URL` | Production, Preview | URL de Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview | Token de Upstash Redis |
| `RESEND_API_KEY` | Production, Preview | API key de Resend |
| `CRON_SECRET` | Production, Preview | `openssl rand -hex 32` — secreto para crons |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Todos | `584141100100` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Production | `27355395054120748` |
| `META_CAPI_ACCESS_TOKEN` | Production | Token de Meta Conversions API |
| `SENTRY_DSN` | Production, Preview | DSN de Sentry |
| `NEXT_PUBLIC_SENTRY_DSN` | Production, Preview | Mismo DSN de Sentry |
| `NEXT_PUBLIC_GA4_ID` | Production | ID de GA4 de Savaya (solo producción) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Production | Código de Google Search Console |

### 1.3 Cron secret en Vercel (acción del negocio)

Vercel ejecuta los crons definidos en `vercel.json`. Para que funcionen, la variable `CRON_SECRET` debe estar configurada **antes del primer deploy a producción** y coincidir con la que usa cada endpoint de cron.

### 1.4 Base de datos — migraciones y seed (acción técnica)

Con `DATABASE_URL` y `DIRECT_URL` ya configurados localmente en `.env.local`:

```bash
# 1. Aplicar migraciones de Drizzle (crea las tablas nuevas en el mismo Supabase Postgres)
npm run db:migrate

# 2. Seed de producción (sin productos de ejemplo)
npm run db:seed:production

# 3. Crear el primer admin
ADMIN_EMAIL=tu@email.com \
ADMIN_PASSWORD=ContraseñaSegura123! \
ADMIN_NAME="Tu Nombre" \
npm run create-admin
```

El seed agrega: tallas, colores, categorías, métodos de pago, zonas de envío, configuración de la aplicación, roles/permisos, y bloques CMS de la home. Las migraciones de Drizzle coexisten con las tablas antiguas de `savaya-tienda` en el mismo Supabase — no hay conflicto.

### 1.5 Contenido inicial desde el admin (acción del negocio)

Después de crear el admin e iniciar sesión:

1. **Métodos de pago** (`/admin/configuracion`): ingresar datos reales de cada método (email Zelle, banco/teléfono/cédula de Pago Móvil, wallet USDT TRC20, Pay ID de Binance Pay, datos de transferencia bancaria). Definir también la política USDT (1:1 con USD o con spread).

2. **Catálogo** (`/admin/productos`): cargar todos los productos con fotos reales desde Cloudinary. Usar el SKU format `{3-PROD}-{3-COLOR}-{TALLA}` (ej. `SND-NEG-38`).

3. **Home** (`/admin/contenido`): reemplazar imágenes Unsplash del hero y las categorías con fotos reales de producto SAVAYA subidas a Cloudinary.

4. **Tasa BCV** (`/admin/tasas`): actualizar la tasa desde el proveedor BCV (pydolarve.org) o usar el override manual hasta que el cron automático esté activo.

5. **Crons activos**: verificar en Vercel → proyecto → Crons que los tres crons estén registrados y activos.

---

## 2. Verificación pre-corte

Antes de mover el dominio, verificar manualmente en la URL de preview de Vercel:

- [ ] Home carga con contenido real (no fallback dev)
- [ ] Al menos 1 producto visible en el PLP de una categoría
- [ ] PDP de ese producto muestra precio en USD y en Bs.
- [ ] El checkout llega hasta el paso 4 (aunque no se complete la compra)
- [ ] El admin (`/admin/login`) permite iniciar sesión con las credenciales creadas
- [ ] El admin requiere 2FA después del primer login
- [ ] Sentry recibe un error de prueba (verificar en el dashboard de Sentry)
- [ ] `robots.txt` en la URL de preview responde correctamente
- [ ] `sitemap.xml` lista los productos y categorías reales

---

## 3. Corte de dominio (ejecutar solo con aprobación explícita)

**Ventana recomendada:** madrugada venezolana, 2am–4am (menor tráfico). El corte en sí tarda menos de 5 minutos; el tiempo de propagación DNS puede ser de hasta 48h, aunque Vercel normalmente lo resuelve en minutos.

### Paso 1 — Agregar dominio a savaya-tienda-nueva en Vercel

1. Vercel → proyecto `savaya-tienda-nueva` → Settings → Domains
2. Agregar `www.savayavzla.com` y `savayavzla.com`
3. Vercel mostrará los registros DNS a configurar

### Paso 2 — Actualizar DNS en el proveedor del dominio

Actualizar los registros apuntando a Vercel (reemplazar los del proyecto `campanas`):
- Tipo A o CNAME según lo que indique Vercel
- El registro actual apunta a `campanas` — reemplazarlo, no agregar otro

> **Nota:** Las landings de `campanas/` (`/cp/colegiales`, etc.) ya NO se sirven desde `www.savayavzla.com` después del corte. Si es necesario mantenerlas accesibles, hay dos opciones:
> 1. Configurarlas como rutas en `savaya-tienda-nueva` (requiere trabajo adicional — no recomendado ahora)
> 2. Moverlas a un subdominio propio (ej. `promo.savayavzla.com` → proyecto `campanas`) — recomendado

### Paso 3 — Verificar

```bash
# Verificar que el dominio resuelve a savaya-tienda-nueva
curl -I https://www.savayavzla.com
# Debe responder 200 con headers de la tienda nueva

# Verificar robots.txt
curl https://www.savayavzla.com/robots.txt
```

### Paso 4 — Monitoreo post-corte (primeras 24h)

- Sentry: revisar errores nuevos en el dashboard
- Vercel: revisar logs de funciones y analytics
- GA4: verificar que llegan eventos de page_view
- Realizar un pedido de prueba completo y verificarlo desde el admin

---

## 4. Rollback

Si algo falla después del corte de DNS:

### Opción A — Rollback de código (sin rollback de DNS)
Si el problema es de código (no de infraestructura):
1. Vercel → proyecto `savaya-tienda-nueva` → Deployments
2. Hacer clic en el deploy anterior estable → **Promote to Production**
3. El dominio sigue apuntando a `savaya-tienda-nueva` pero a la versión anterior

### Opción B — Rollback de DNS (volver a campanas)
Si el problema es grave y se necesita revertir al estado anterior:
1. En el proveedor del dominio, restaurar los registros DNS que apuntaban a `campanas`
2. El proyecto `campanas` sigue intacto — no se modificó en ningún momento del corte
3. Propagación DNS: hasta 48h (en Vercel suele ser mucho más rápido)

> **Importante:** el rollback de código en Vercel NO revierte migraciones de DB. Las tablas nuevas de Drizzle quedan en la DB pero no afectan el funcionamiento de `savaya-tienda` ni de las landings — son tablas separadas con prefijos distintos.

---

## 5. Qué no migrar

`savaya-tienda` nunca llegó a producción con datos reales, por lo tanto:

- **Catálogo de productos:** NO hay productos en la DB de `savaya-tienda` — cargar el catálogo real directamente en `savaya-tienda-nueva` desde el admin
- **Clientes:** NO hay clientes reales que migrar
- **Pedidos:** NO hay historial de pedidos que migrar
- **Usuarios admin:** `savaya-tienda` usaba Supabase Auth; `savaya-tienda-nueva` usa Auth.js v5 — bases de datos de auth completamente separadas; el admin nuevo se crea con `npm run create-admin`

Las únicas tablas de `savaya-tienda` que podrían tener datos reales son las de Supabase Admin usadas para configuración visual (banners, popups si existían). Esas se reemplazan con contenido nuevo desde `/admin/contenido`.

---

## 6. Post-lanzamiento inmediato (semana 1)

- [ ] Configurar alerta de uptime (BetterStack o Vercel Monitoring) con notificación a WhatsApp/email
- [ ] Verificar Google Search Console: reindexar la home, el sitemap, y 3-5 PDPs importantes
- [ ] Verificar Meta Events Manager: que lleguen eventos de ViewContent y AddToCart desde la nueva tienda
- [ ] Revisar Lighthouse en producción (no en preview) para confirmar LCP/INP/CLS dentro de objetivos
- [ ] Hacer el primer pedido real y verificar todo el flujo: email de confirmación, admin recibe el pedido, la tasa BCV es correcta, el comprobante se sube a Cloudinary privado

---

## 7. Notas sobre savaya-tienda (legado)

`savaya-tienda` **no se elimina**. Se deja en Vercel pero sin dominio propio asignado (accesible solo por URL de preview de Vercel). Las tablas viejas de Supabase se dejan intactas como archivo histórico. Si en el futuro se decide limpiarlas, hacer backup SQL primero.
