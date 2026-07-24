# CLAUDE.md — Savaya Campañas

Landings de conversión de SAVAYA. Proyecto Vercel separado de la tienda, expuesto bajo el mismo dominio mediante rewrites (ver sección "Arquitectura de dominio" en README.md).

---

## Repositorio

- **GitHub:** `https://github.com/aandreskss/SAVAYA.git` (monorepo)
- **Carpeta en el monorepo:** `campanas/`
- **Rama principal:** `main`

---

## Deploy

El deploy se hace **pusheando a GitHub** — Vercel está conectado al repo y despliega automáticamente desde `main`.

```bash
# Desde la raíz del monorepo (Savaya/)
git add campanas/...
git commit -m "mensaje"
git push origin main
```

No usar `vercel --prod` desde la carpeta `campanas/` — falla porque el proyecto tiene `rootDirectory: campanas` configurado en Vercel, lo que produce una ruta doble `campanas/campanas`.

No hay build step — HTML/CSS/JS plano más una función Node en `api/lead.js`.

---

## Vercel

- **Proyecto:** `savaya-landing`
- **Organización:** `aandreskss-projects`
- **Dominio producción:** `www.savayavzla.com`
- **URL directa (sin dominio):** `savaya-landing.vercel.app`
- **Project ID:** `prj_6JZwIeAsCeLuDa7BOBIUanv683G4`

Las rutas `/cp/*` y `/api/*` de `www.savayavzla.com` son servidas por este proyecto. Cuando la tienda exista, el proxy lo hacen los rewrites de Vercel en `savaya-tienda/vercel.json`.

---

## Variables de entorno (ya configuradas en Vercel)

| Variable | Descripción |
|---|---|
| `FB_PIXEL_ID` | `27355395054120748` — Pixel de SAVAYA |
| `FB_ACCESS_TOKEN` | Token de Conversions API de Meta |
| `LEAD_WEBHOOK_URL` | URL del Google Apps Script para Google Sheets |

---

## Campañas activas

| Carpeta | Estado | URL producción |
|---|---|---|
| `cp/colegiales` | ✅ Live | `www.savayavzla.com/cp/colegiales` |

---

## Arquitectura del flujo de leads

Al hacer submit el formulario:

1. **Client-side (browser):** dispara `fbq('track', 'Lead', ...)` y `fbq('track', 'Contact', ...)` con el mismo `eventID`
2. **WhatsApp:** `window.open(waUrl, '_blank')` — inmediato, sin await, en el call stack del gesto del usuario para evitar bloqueo de popup
3. **Server-side:** `fetch('/api/lead', { keepalive: true })` en background — llama a Meta Conversions API y al webhook de Google Sheets
4. Deduplicación: browser + server usan el mismo `eventId` (Lead) y `${eventId}_c` (Contact)

### Datos que se envían al evento Lead (Meta)

| Campo | Valor |
|---|---|
| `content_name` | `Zapato Escolar Mayorista SAVAYA - Temporada Escolar 2026` |
| `content_category` | `Calzado Escolar al Mayor` |
| `content_type` | `product` |
| `lead_name` | nombre que escribió el lead |
| `city` | ciudad del lead |

### Datos en Google Sheets

Columnas: Fecha · Nombre · Email · Ciudad · WhatsApp · Origen · UTM Source · UTM Medium · UTM Campaign · **Anuncio** · **Plataforma** · **Dispositivo** · **Venta** · **Monto USD** · **Fecha Venta** · **Estado Meta** · **fbc** · **fbp**

- **Plataforma:** detectada por `utm_source` (prioridad) y luego `document.referrer`. Valores: `Facebook`, `Instagram`, `Meta (sin especificar)`, `Directo / Otro`
- **Dispositivo:** detectado por `navigator.userAgent`. Valores: `Teléfono`, `PC`
- **Anuncio:** valor de `utm_content`. Configurar en Meta Ads Manager: `utm_content={{ad.name}}` para que llegue el nombre exacto del anuncio
- Para que FB vs IG sea confiable en anuncios pagados, configurar en Meta Ads Manager: `utm_source={{site_source_name}}`
- **Venta:** checkbox — marcar cuando el lead compra
- **Monto USD:** monto de la venta en dólares (sin símbolo, ej: `120`)
- **Fecha Venta:** fecha real de la venta (opcional — si se deja vacía usa la hora actual)
- **Estado Meta:** resultado del envío a Meta (`✅` = éxito, `❌` = error, `⚠️` = faltó el monto)

### Flujo de registro de ventas offline

1. Llenar **Monto USD** primero
2. Marcar checkbox **Venta** ✅ → Apps Script envía evento `Purchase` a Meta Conversions API (`action_source: "other"`)
3. **Estado Meta** confirma el resultado
4. Los eventos offline pueden tardar varias horas en aparecer en Events Manager (normal — son `action_source: other`, no `website`)

Para leads que no pasaron por el formulario (contacto directo por WhatsApp): agregar fila manual con Nombre + WhatsApp mínimo, luego marcar como venta.

---

## Google Apps Script

Archivo local: `google-apps-script.js`
Crea automáticamente una pestaña por campaña. Si la pestaña ya existe y le faltan columnas, `ensureHeaders()` las agrega sola con el próximo lead.

**Script Properties requeridas (Configuración del proyecto → Propiedades del script):**
| Propiedad | Valor |
|---|---|
| `FB_PIXEL_ID` | `27355395054120748` |
| `FB_ACCESS_TOKEN` | Token de Conversions API de Meta |

**Trigger de ventas (instalar una sola vez):**
Activadores → Agregar activador → función: `onVentaEdit` → evento: Al editar

**Para actualizar el script en producción:**
1. Extensions → Apps Script → reemplazar código → guardar
2. Deploy → Manage deployments → editar → Nueva versión → Deploy

---

## Cómo agregar una campaña nueva

1. Duplicar `cp/colegiales/` → `cp/<nombre-nueva-campaña>/`
2. Cambiar `const CAMPAIGN = 'colegiales'` por el nuevo nombre
3. Cambiar `const WHATSAPP_NUMBERS` si aplica
4. Usar **rutas absolutas** para todos los assets: `/cp/<nombre>/assets/...` (no rutas relativas)
5. Push a GitHub → Vercel despliega automáticamente

---

## Completado

- [x] Campaña `colegiales`: landing mayorista calzado escolar, tallas 28-34 y 35-39
- [x] `api/lead.js`: Meta Pixel + Conversions API + Google Sheets webhook, deduplicación por `event_id`
- [x] Reparto de leads entre múltiples números de WhatsApp (aleatorio por submit)
- [x] Dominio `www.savayavzla.com` apuntado a este proyecto
- [x] Monorepo subido a `github.com/aandreskss/SAVAYA`
- [x] Evento Lead enriquecido: `content_category`, `content_type`, `lead_name`
- [x] Tracking de plataforma (Facebook/Instagram) y dispositivo (Teléfono/PC) en Google Sheets
- [x] Columna **Anuncio** en Google Sheets via `utm_content` — configurar `utm_content={{ad.name}}` en Meta Ads Manager
- [x] Registro de ventas offline → Meta: columnas Venta/Monto/Fecha Venta/Estado Meta + trigger `onVentaEdit` en Apps Script
- [x] Validación: bloquea envío de Purchase si Monto está vacío (muestra aviso en Estado Meta)
- [x] `fbc` y `fbp` guardados en columnas Q y R del Sheet — `api/lead.js` los envía al webhook, Apps Script los incluye en `user_data` del evento Purchase para mejorar match quality (~85%+ vs ~55% sin ellos)
