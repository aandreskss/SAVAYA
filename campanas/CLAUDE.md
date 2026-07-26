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
| `MAILERLITE_API_KEY` | Token JWT de MailerLite para agregar suscriptores vía API |
| `MAILERLITE_GROUP_ID` | `194026197243398003` — Grupo "SAVAYA COLEGIAL" en MailerLite |

---

## Campañas activas

| Carpeta | Estado | URL producción |
|---|---|---|
| `cp/colegiales` | ✅ Live | `www.savayavzla.com/cp/colegiales` |

---

## Arquitectura del flujo de leads

Al hacer submit el formulario:

1. **Client-side (browser):**
   - `gtag('event', 'generate_lead', ...)` — GA4
   - `fbq('track', 'Lead', ...)` y `fbq('track', 'Contact', ...)` con el mismo `eventID` — Meta Pixel
   - `window.open(waUrl, '_blank')` — WhatsApp inmediato, sin await
2. **Server-side:** `fetch('/api/lead', { keepalive: true })` en background:
   - Meta Conversions API: eventos Lead + Contact (dedup por `eventId`)
   - Google Apps Script webhook: fila en Sheet
   - MailerLite API: agrega suscriptor al grupo → dispara automatización de email
3. Deduplicación Meta: browser + server usan el mismo `eventId` (Lead) y `${eventId}_c` (Contact)

### Eventos de tracking completos

| Momento | Meta Pixel | GA4 |
|---|---|---|
| Carga de página | `PageView` + `ViewContent` | `page_view` + `view_item` |
| Primer toque al form | `InitiateCheckout` | `begin_checkout` |
| Submit exitoso | `Lead` + `Contact` | `generate_lead` |
| Venta marcada en Sheet | `Purchase` (via Apps Script) | — |

### Datos que se envían al evento Lead (Meta)

| Campo | Valor |
|---|---|
| `content_name` | `Zapato Escolar Mayorista SAVAYA - Temporada Escolar 2026` |
| `content_category` | `Calzado Escolar al Mayor` |
| `content_type` | `product` |
| `lead_name` | nombre que escribió el lead |
| `city` | ciudad del lead |

### Datos en Google Sheets

Columnas: Fecha · Nombre · Email · Ciudad · WhatsApp · Origen · UTM Source · UTM Medium · UTM Campaign · **Anuncio** · **Plataforma** · **Dispositivo** · **Venta** · **Monto USD** · **Fecha Venta** · **Estado Meta** · **fbc** · **fbp** · **IP** · **UserAgent**

- **Plataforma:** detectada por `utm_source` (prioridad) y luego `document.referrer`. Valores: `Facebook`, `Instagram`, `Meta (sin especificar)`, `Directo / Otro`
- **Dispositivo:** detectado por `navigator.userAgent`. Valores: `Teléfono`, `PC`
- **Anuncio:** valor de `utm_content`. Configurar en Meta Ads Manager: `utm_content={{ad.name}}` para que llegue el nombre exacto del anuncio
- Para que FB vs IG sea confiable en anuncios pagados, configurar en Meta Ads Manager: `utm_source={{site_source_name}}`
- **Venta:** checkbox — marcar cuando el lead compra
- **Monto USD:** monto de la venta en dólares (sin símbolo, ej: `120`)
- **Fecha Venta:** fecha real de la venta (opcional — si se deja vacía usa la hora actual)
- **Estado Meta:** resultado del envío a Meta (`✅` = éxito, `❌` = error, `⚠️` = faltó el monto)

### Flujo de registro de ventas

1. Llenar **Monto USD** primero
2. Marcar checkbox **Venta** ✅ → Apps Script envía evento `Purchase` a Meta Conversions API (`action_source: "website"`, `event_source_url: "https://www.savayavzla.com/cp/colegiales"`)
3. **Estado Meta** confirma el resultado

Para leads que no pasaron por el formulario (contacto directo por WhatsApp): agregar fila manual con Nombre + WhatsApp mínimo, luego marcar como venta.

---

## Google Analytics 4

- **Measurement ID:** `G-FQ34QH6JB5`
- **Propiedad:** SAVAYA
- **Secuencia de datos:** Landing Colegiales

Eventos configurados en `cp/colegiales/index.html`:
- `view_item` — al cargar la página
- `begin_checkout` — al tocar por primera vez cualquier campo del form
- `generate_lead` — al enviar el form exitosamente (incluye city, campaign, platform, device)

---

## MailerLite — Email Marketing

- **Cuenta:** registrada con email del equipo SAVAYA
- **Dominio verificado:** `savayavzla.com` (DKIM + SPF configurados en Vercel DNS)
- **Dirección de envío:** `ventas@savayavzla.com`
- **Grupo principal:** `SAVAYA COLEGIAL` (ID: `194026197243398003`)

### Automatización activa
- **Trigger:** suscriptor se une al grupo `SAVAYA COLEGIAL`
- **Paso 1:** Esperar 24 horas
- **Paso 2:** Enviar email de seguimiento (`email-colegiales.html`)

El archivo `email-colegiales.html` en la raíz de `campanas/` es la plantilla HTML del email. Usa variables de MailerLite: `{$name}` para el nombre y `{$unsubscribe}` para el enlace de baja.

### Cómo funciona la integración
Cada vez que un lead llena el form, `api/lead.js` llama a `POST https://connect.mailerlite.com/api/subscribers` con el email, nombre y group ID. MailerLite agrega el suscriptor y dispara la automatización automáticamente.

### DNS agregados en Vercel para MailerLite
| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | `litesrv._domainkey` | `litesrv._domainkey.mlsend.com` |
| TXT | `@` | `v=spf1 a mx include:_spf.mlsend.com ?all` |
| TXT | `@` | `mailerlite-domain-verification=d874d0b2007eec1dfce5b3b23c49ccd675ed0f1a` |

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

## Blueprints de campañas

Hay dos flujos definidos y documentados. Elegir según si hay landing page o no.

---

### Blueprint A — Con Landing Page + Formulario

Campaña completa con página de captura. El usuario llena un form → WhatsApp se abre → datos van solos al Sheet. El vendedor solo marca la venta.

**Cuándo usarlo:** Producto con propuesta de valor que necesita explicarse, audiencia fría, mayor volumen de leads esperado.

**Flujo:**
```
Anuncio → Landing page (form: Nombre, Email, Teléfono, Ciudad)
  → submit:
      client-side: gtag generate_lead + fbq Lead + fbq Contact (mismo eventId, dedup)
      window.open(whatsappUrl)  ← inmediato, sin await
      fetch('/api/lead', keepalive)  ← background
        → Meta Conversions API: evento Lead (server-side, dedup por eventId)
        → Apps Script webhook: fila en Sheet
        → MailerLite: agrega suscriptor al grupo → automatización 24h → email
  → WhatsApp abierto
  → Vendedor llena Monto USD → marca Venta ✅
  → Apps Script onVentaEdit → Purchase a Meta CAPI (action_source: website)
```

**Sheet:** Una sola tab "Leads". Columnas:
`Fecha · Nombre · Email · Teléfono · Ciudad · Plataforma · Dispositivo · UTM Source · UTM Medium · UTM Campaign · Anuncio · fbc · fbp · Venta · Monto USD · Fecha Venta · Estado Meta`

**Señales Meta Lead:** email hash + phone hash + fbc + fbp + IP + userAgent
**Señales Meta Purchase:** email hash + phone hash + fbc + fbp + IP + userAgent (guardados en Sheet al llegar el lead)
**Match quality esperado:** ~85-90%

**API (`api/lead.js`) recibe:** campaign, eventId, nombre, email, telefono, ciudad, fbc, fbp, utmSource, utmMedium, utmCampaign, utmContent, plataforma, dispositivo, userAgent

---

### Blueprint B — Sin Landing Page (WhatsApp-Only)

Sin formulario. Una "bridge page" invisible captura la señal del anuncio y redirige a WhatsApp en < 1 segundo. El vendedor registra los datos del cliente manualmente cuando cierra la venta.

**Cuándo usarlo:** Producto de venta directa, audiencia caliente, se quiere eliminar fricción del formulario.

**Flujo:**
```
Anuncio → Bridge page (sin form, sin interacción del usuario)
  → al cargar:
      client-side: fbq Lead (con fbc capturado)
      fetch('/api/lead', keepalive)  ← background
        → Meta Conversions API: evento Lead
        → Apps Script webhook: fila en Tab "Leads" (sin datos del cliente)
      window.location = whatsappUrl  ← redirección inmediata
  → WhatsApp abierto
  → Vendedor atiende, cierra venta
  → Vendedor agrega fila en Tab "Ventas": Nombre + Email + Teléfono + Ciudad + Monto
  → Marca Venta ✅
  → Apps Script onVentaEdit → Purchase a Meta CAPI (action_source: website)
```

**Sheet:** Dos tabs separadas.
- Tab "Leads": auto (bridge page). `Fecha · Plataforma · Dispositivo · UTM Source · UTM Medium · UTM Campaign · Anuncio · fbc · fbp`
- Tab "Ventas": manual (vendedor). `Fecha · Nombre · Email · Teléfono · Ciudad · Plataforma · Venta · Monto USD · Fecha Venta · Estado Meta · fbc · fbp`

**Señales Meta Lead:** fbc + fbp + IP + userAgent (sin datos personales)
**Señales Meta Purchase:** email hash + phone hash + fbc (si disponible) + fbp
**Match quality esperado:** ~70-80%

**API (`api/lead.js`) recibe:** campaign, eventId, fbc, fbp, utmSource, utmMedium, utmCampaign, utmContent, plataforma, dispositivo, userAgent (sin nombre/email/teléfono)

---

### Elementos comunes a ambos blueprints

**normalizePhone(phone):**
- Quitar espacios, guiones, paréntesis, símbolo +
- Si empieza con 0 → reemplazar con código de país (Venezuela: 58)
- Resultado: solo dígitos con código de país. Ej: `"0424-555-1234"` → `"584245551234"`

**Validación de teléfono en el form:** mínimo 10 dígitos después de quitar no-numéricos. Rechaza números cortos como cédulas o formatos inválidos.

**onVentaEdit (Apps Script):**
- Verifica que la hoja y columna editada sea la de "Venta"
- Valida: monto no vacío; email O teléfono presente
- Si monto vacío → escribe "⚠️ Falta el monto" en Estado Meta → return
- Hashea email y teléfono con SHA-256 antes de enviar a Meta
- Purchase usa `action_source: "website"` + `event_source_url: "https://www.savayavzla.com/cp/colegiales"`

**UTMs en Meta Ads Manager (configurar en cada anuncio):**
```
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

**Script Properties Apps Script requeridas:** `FB_PIXEL_ID` + `FB_ACCESS_TOKEN`

---

## Cómo agregar una campaña nueva

1. Elegir blueprint (A con form / B sin form)
2. Duplicar `cp/colegiales/` → `cp/<nombre-nueva-campaña>/` como base
3. Cambiar `const CAMPAIGN = 'colegiales'` por el nuevo nombre
4. Cambiar `const WHATSAPP_NUMBERS` si aplica
5. Actualizar el `event_source_url` en `google-apps-script.js` si es una campaña diferente
6. Usar **rutas absolutas** para todos los assets: `/cp/<nombre>/assets/...` (no rutas relativas)
7. Crear un grupo nuevo en MailerLite para la campaña y actualizar `MAILERLITE_GROUP_ID` en Vercel (o usar el mismo grupo si se quiere la misma automatización)
8. Push a GitHub → Vercel despliega automáticamente

---

## Completado

- [x] Campaña `colegiales`: landing mayorista calzado escolar, tallas 28-34 y 35-39
- [x] `api/lead.js`: Meta CAPI + Google Sheets webhook + MailerLite, deduplicación por `event_id`
- [x] Reparto de leads entre múltiples números de WhatsApp (aleatorio por submit)
- [x] Dominio `www.savayavzla.com` apuntado a este proyecto
- [x] Monorepo subido a `github.com/aandreskss/SAVAYA`
- [x] Evento Lead enriquecido: `content_category`, `content_type`, `lead_name`
- [x] Tracking de plataforma (Facebook/Instagram) y dispositivo (Teléfono/PC) en Google Sheets
- [x] Columna **Anuncio** en Google Sheets via `utm_content`
- [x] Registro de ventas offline → Meta: columnas Venta/Monto/Fecha Venta/Estado Meta + trigger `onVentaEdit`
- [x] Validación: bloquea envío de Purchase si Monto está vacío
- [x] `fbc` y `fbp` guardados en Sheet e incluidos en `user_data` del Purchase (~85%+ match quality)
- [x] **CRO landing móvil:** form arriba del fold (imagen oculta en <900px), sin animación reveal, badge de urgencia
- [x] **Validación teléfono:** mínimo 10 dígitos — rechaza cédulas y números inválidos
- [x] **Pixel events completos:** `ViewContent` al cargar + `InitiateCheckout` al tocar el form
- [x] **Purchase action_source corregido:** `website` + `event_source_url` → aparece en reportes de campañas
- [x] **GA4 `G-FQ34QH6JB5`:** `view_item` + `begin_checkout` + `generate_lead`
- [x] **MailerLite:** dominio verificado, grupo `SAVAYA COLEGIAL`, automatización 24h activa
- [x] **Email template:** `email-colegiales.html` — ángulo A+C (acceso prioritario + urgencia septiembre)
- [x] **DNS MailerLite** agregados en Vercel: DKIM (CNAME) + SPF (TXT) + verificación (TXT)
