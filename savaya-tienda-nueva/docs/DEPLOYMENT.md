# DEPLOYMENT.md — Despliegue y operaciones de SAVAYA

> Última actualización: 2026-08-15

---

## 1. Repositorio y estructura

- **Repositorio:** `aandreskss/SAVAYA` en GitHub
- **Rama principal:** `main` — única rama de larga duración
- **Estructura del monorepo:**
  ```
  SAVAYA/
    savaya-tienda/         → Tienda anterior (en producción actualmente) — SOLO LECTURA
    savaya-tienda-nueva/   → Esta tienda — root directory del proyecto Vercel
    campanas/              → Landing pages de campañas (proyecto Vercel separado)
    savaya-landing/        → Landing principal (actualmente sirve www.savayavzla.com)
  ```

---

## 2. Proyecto Vercel

- **Nombre del proyecto:** `savaya-tienda-nueva`
- **Root directory:** `savaya-tienda-nueva/` (configurado en Vercel → Settings → General → Root Directory)
- **Framework preset:** Next.js
- **Branch de producción:** `main`
- **Dominio de producción:** `www.savayavzla.com` (se asigna en el corte — ver `docs/MIGRATION.md`)
- **Dominio actual de `www.savayavzla.com`:** apunta a `campanas` hasta el corte (Fase 9)

---

## 3. Entornos

| Entorno | Branch | Propósito |
|---|---|---|
| Production | `main` | La tienda en vivo — después del corte en Fase 8 |
| Preview | Todo PR / branch | Testing de features antes de merge |
| Development | Local con `.env.local` | Desarrollo diario |

---

## 4. Variables de entorno

Todas las variables listadas en `.env.example` deben estar configuradas en Vercel por entorno antes del primer deploy funcional.

| Variable | Entorno | Descripción |
|---|---|---|
| `DATABASE_URL` | Production, Preview | Connection string Supabase con pooler (runtime) |
| `DIRECT_URL` | Production, Preview | Connection string Supabase directo (migraciones) |
| `AUTH_SECRET` | Production, Preview | Secret de Auth.js — `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Todos | URL base del entorno (`https://www.savayavzla.com` en producción) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Todos | Cloud name de la cuenta Cloudinary de Savaya |
| `CLOUDINARY_API_KEY` | Production, Preview | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | Production, Preview | API Secret de Cloudinary — solo servidor |
| `UPSTASH_REDIS_REST_URL` | Production, Preview | URL de Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview | Token de Upstash Redis — solo servidor |
| `RESEND_API_KEY` | Production, Preview | API Key de Resend para emails transaccionales |
| `CRON_SECRET` | Production, Preview | Secret para proteger endpoints de cron |
| `NEXT_PUBLIC_GA4_ID` | Production | ID de GA4 de Savaya (no en Preview para no contaminar datos) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Production | `27355395054120748` |
| `META_CAPI_ACCESS_TOKEN` | Production | Token de Conversions API de Meta — solo servidor |
| `SENTRY_DSN` | Production, Preview | DSN del proyecto Sentry de savaya-tienda-nueva |
| `EXCHANGE_RATE_API_KEY` | Production, Preview | API key del proveedor BCV (si aplica) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Todos | `584141100100` |

**Regla:** nunca configurar variables en el código. Si se necesita una nueva variable, se agrega a `.env.example` (sin valor real) y se configura en Vercel.

---

## 5. Build checks (CI)

Antes de cualquier deploy a producción, deben pasar:

```bash
npm run typecheck   # tsc --noEmit — cero errores TypeScript
npm run lint        # ESLint — cero errores, warnings permitidos
```

Estos se configuran como required checks en la branch `main` de GitHub. Un PR no puede mergearse si alguno falla.

Adicionalmente en CI (opcional pero recomendado una vez que el suite E2E esté maduro):
```bash
npm run test        # Vitest — cero tests fallando
npm run test:e2e    # Playwright — flujos críticos
```

---

## 6. Crons de Vercel

Configurados en `vercel.json` bajo la key `crons`:

| Cron | Ruta | Schedule | Propósito |
|---|---|---|---|
| Expiración de reservas de inventario | `/api/cron/expire-reservations` | `0 * * * *` (cada hora) | Libera stock de pedidos en PENDING_PAYMENT expirados |
| Limpieza de comprobantes Cloudinary | `/api/cron/cleanup-proofs` | `0 3 * * *` (3am diario) | Elimina de Cloudinary los comprobantes de pedidos cancelados >72h |
| Actualización de tasa BCV | `/api/cron/update-exchange-rate` | `0 8,14,20 * * *` (3 veces al día) | Obtiene tasa fresca del ExchangeRateProvider |

Todos los endpoints de cron verifican el header `x-cron-secret` contra la env var `CRON_SECRET`. Sin ese header, devuelven 401.

---

## 7. Rollback

Vercel mantiene un historial completo de deploys. Para hacer rollback:

1. Ir a `vercel.com/dashboard` → proyecto `savaya-tienda-nueva` → pestaña **Deployments**
2. Identificar el deploy estable anterior (fecha + commit hash)
3. Hacer clic en el deploy → botón **Promote to Production**
4. Confirmar — el dominio apunta al deploy anterior en menos de 30 segundos

**Limitación importante:** el rollback de código no revierte migraciones de DB. Si un deploy incluyó una migración destructiva (eliminar columna, cambiar tipo), el código anterior puede fallar contra la DB nueva. Por eso:
- Toda migración debe ser compatible hacia atrás (backward compatible) antes del corte de dominios
- Agregar columnas opcionales antes de desplegarlas como obligatorias
- Nunca eliminar una columna en el mismo deploy que la deja de usar el código

---

## 8. Fase 9 — Corte de dominio

Ver el plan detallado en **`docs/MIGRATION.md`**.

### Situación actual

```
www.savayavzla.com  →  campanas (proyecto Vercel — landings)
[preview URL]       →  savaya-tienda-nueva (este proyecto)
savaya-tienda       →  [proyecto Vercel legado — nunca en producción con datos reales]
```

### Resumen del corte

1. Completar checklist pre-lanzamiento (`docs/MIGRATION.md` sección 1)
2. Ejecutar migraciones + seed producción + create-admin
3. Cargar catálogo real desde el admin
4. Aprobar visualmente en URL de preview
5. Mover dominio `www.savayavzla.com` al proyecto `savaya-tienda-nueva` en Vercel

### Datos a migrar

`savaya-tienda` nunca tuvo datos reales en producción. No hay catálogo, clientes ni pedidos que migrar. El lanzamiento es limpio desde el seed.

---

## 9. Monitoreo post-deploy

- **Sentry:** alertas de error habilitadas para `savaya-tienda-nueva`. Umbral de alerta: cualquier error nuevo en producción. Dashboard: `sentry.io` → proyecto `savaya-tienda-nueva`
- **Vercel Analytics:** revisar bounce rate y páginas de error en las primeras horas post-deploy. Dashboard: `vercel.com` → proyecto → Analytics
- **Uptime:** configurar BetterStack (betterstack.com) con monitor HTTP hacia `https://www.savayavzla.com` y alerta por WhatsApp/email si el sitio cae por más de 2 minutos. Alternativa: Vercel Monitoring (disponible en planes Pro+)
