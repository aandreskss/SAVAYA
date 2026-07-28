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

## WhatsApp del negocio

Dos números activos con round-robin en la landing:

| Vendedora | Número | Formato |
|---|---|---|
| Rosmary | `584121211526` | +58 412-1211526 |
| Cecilia | `584242908090` | +58 424-2908090 |

Usado en:
- `WHATSAPP_NUMBERS` de la landing → round-robin al submit del form
- Footer de la landing (ambos números)
- Email template de seguimiento (`email-colegiales.html`) — solo Rosmary
- `VENDEDORAS` del Apps Script → asignación de leads (ambas)

Para agregar/cambiar un número: actualizar los 4 lugares anteriores.

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

Columnas (25 en total). Las cols 17–20 se pueden ocultar sin romper nada — el Apps Script las sigue leyendo aunque estén ocultas.

| # | Col | Columna | Descripción |
|---|---|---|---|
| 1 | A | Fecha | Timestamp ISO del submit |
| 2 | B | Nombre | Nombre del lead |
| 3 | C | Email | Email del lead |
| 4 | D | Ciudad | Ciudad del lead |
| 5 | E | WhatsApp | Teléfono normalizado (58...) |
| 6 | F | Origen | Nombre de la campaña |
| 7 | G | UTM Source | `utm_source` |
| 8 | H | UTM Medium | `utm_medium` |
| 9 | I | UTM Campaign | `utm_campaign` |
| 10 | J | Anuncio | `utm_content` — nombre del anuncio en Meta |
| 11 | K | Plataforma | Facebook / Instagram / Meta (sin especificar) / Directo |
| 12 | L | Dispositivo | Teléfono / PC |
| 13 | M | Venta | Checkbox — marcar cuando el lead compra |
| 14 | N | Monto USD | Monto de la venta (sin símbolo, ej: `120`) |
| 15 | O | Fecha Venta | Fecha real de la venta (opcional) |
| 16 | P | Estado Meta | `✅` éxito · `❌` error · `⚠️` falta monto |
| 17 | Q | fbc | Cookie `_fbc` de Meta (fbclid) — clave para atribución |
| 18 | R | fbp | Cookie `_fbp` de Meta |
| 19 | S | IP | IP del cliente al momento del submit |
| 20 | T | UserAgent | User-Agent del cliente al momento del submit |
| 21 | U | Asignar a | Dropdown con vendedoras — seleccionar para asignar |
| 22 | V | Asignado | Se llena automáticamente: nombre vendedora + timestamp |
| 23 | W | Negocio | Sí / No — respuesta del toggle en el formulario |
| 24 | X | Cal. Auto | 🔥 Caliente / 🌡️ Tibio / ❄️ Frío — calculado al llegar el lead |
| 25 | Y | Cal. Vendedor | Dropdown — el vendedor confirma/corrige tras el WhatsApp |

- **Plataforma:** detectada por `utm_source` (prioridad) y luego `document.referrer`
- **Anuncio:** configurar en Meta Ads Manager: `utm_content={{ad.name}}`
- Para que FB vs IG sea confiable: `utm_source={{site_source_name}}` en Meta Ads Manager

### Flujo de registro de ventas

1. Llenar **Monto USD** primero
2. Marcar checkbox **Venta** ✅ → Apps Script envía evento `Purchase` a Meta CAPI
3. **Estado Meta** confirma el resultado

Para leads que no pasaron por el formulario: agregar fila manual con Nombre + WhatsApp mínimo, luego marcar como venta.

### Flujo de asignación de leads a vendedoras

1. Seleccionar una vendedora del dropdown en columna **"Asignar a"** (col 21)
2. Se abre un dialog en el Sheet con el mensaje pre-rellenado y un botón **Abrir WhatsApp**
3. Clic en el botón → abre WhatsApp Web con el número de la vendedora y el mensaje listo
4. Enviar el mensaje desde el WhatsApp del negocio
5. La columna **"Asignado"** (col 22) se llena automáticamente con nombre + timestamp

Mensaje que se envía a la vendedora:
```
Hola, te hemos asignado un nuevo cliente potencial desde el equipo de marketing de Savaya 👟

📋 Nombre: [nombre del lead]
📍 Ciudad: [ciudad]
📧 Email: [email]
📱 Contáctalo aquí: https://wa.me/[teléfono]

Por favor comúnícate a la brevedad 🙏
```

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

### Configuración de vendedoras

Al tope del script, editar el array `VENDEDORAS`:
```javascript
var VENDEDORAS = [
  { nombre: 'Rosmary', numero: '584121211526' },
  { nombre: 'Cecilia', numero: '584242908090' }
];
```
- `nombre`: aparece en el dropdown del Sheet
- `numero`: WhatsApp con código de país (sin +, sin espacios)

Para agregar una vendedora: añadir una línea al array y actualizar el script en producción.

### Script Properties requeridas

Configuración del proyecto → Propiedades del script:

| Propiedad | Valor |
|---|---|
| `FB_PIXEL_ID` | `27355395054120748` |
| `FB_ACCESS_TOKEN` | Token de Conversions API de Meta |

### Triggers installable (instalar una sola vez cada uno)

Activadores (ícono del reloj) → Agregar activador:

| Función | Evento | Para qué |
|---|---|---|
| `onVentaEdit` | Del spreadsheet → Al editar | Envía Purchase a Meta al marcar Venta ✅ |
| `onAsignarEdit` | Del spreadsheet → Al editar | Abre dialog de WhatsApp al seleccionar vendedora |

### Menú Savaya en el Sheet

Al abrir el Sheet aparece el menú **Savaya** en la barra superior (trigger simple `onOpen`, no necesita instalación manual).

| Opción | Función | Para qué |
|---|---|---|
| Configurar dropdowns de asignación | `setupAsignarDropdowns` | Aplica dropdown de vendedoras a todas las filas de la pestaña activa |
| 📊 Actualizar métricas | `buildMetrics` | Genera/regenera la pestaña de métricas con gráficas |
| ⏰ Instalar actualización automática | `installMetricsTrigger` | Crea trigger para regenerar métricas todos los días a las 8am |

### Para actualizar el script en producción
1. Extensiones → Apps Script → reemplazar código → Guardar
2. Implementar → Gestionar implementaciones → lápiz → Nueva versión → Deploy

---

## Hoja de métricas (📊 Métricas)

Se genera con **Savaya → 📊 Actualizar métricas**. Lee todas las pestañas de campaña del Sheet y construye una pestaña resumen con tablas + gráficas.

### Secciones de la pestaña

| Sección | Columnas |
|---|---|
| Resumen general | Leads totales, ventas, conversión %, monto total, ticket promedio |
| Por calificación auto | 🔥/🌡️/❄️ — leads, ventas, conversión, monto por nivel |
| Por vendedora | Leads asignados, ventas cerradas, conversión, monto |
| Por ciudad | Leads, ventas, conversión, monto (ciudades normalizadas) |
| Por plataforma | Leads, ventas, conversión, monto |
| Por dispositivo | Leads, ventas, conversión, monto |
| Por día de la semana | Leads, ventas, % del total (Lunes–Domingo) |
| Por campaña Meta (utm_campaign) | Leads, ventas, conversión, monto |
| Por anuncio (utm_content) | Leads, ventas, conversión, monto |
| Por landing (pestaña) | Leads, ventas, conversión, monto |
| Tendencia por fecha | Leads y ventas por día calendario |

### Gráficas automáticas (6 en total)

Se posicionan a la derecha de los datos (col I y col P):

| Gráfica | Tipo |
|---|---|
| Tendencia de leads | Línea (fecha, leads, ventas) |
| Leads por ciudad | Barras horizontales |
| Leads por día de semana | Columnas |
| Por plataforma | Torta |
| Por dispositivo | Torta |
| Ventas por vendedora | Barras (asignados + ventas) |

Al regenerar, las gráficas viejas se eliminan y se recrean. Si una sección no tiene datos, su gráfica se omite silenciosamente.

### Normalización de ciudades (`normalizeCity`)

Resuelve el problema de que el mismo lugar se escriba de formas distintas (estado vs ciudad, con/sin tildes, abreviaturas).

**Estrategia:**
1. Normaliza el input: minúsculas, sin tildes, sin puntuación
2. Busca coincidencia exacta en `CITY_MAP`
3. Si no, busca la clave más larga que aparezca como **palabra completa** en el texto
4. Fallback: título de caso del valor original

**Ejemplos:**
| Lo que escribe el cliente | Se almacena como |
|---|---|
| Carabobo / carabobo / Edo. Carabobo | **Valencia** |
| Caracas / Distrito Capital / Dtto Capital | **Caracas** |
| Aragua / Maracay / Turmero / Cagua | **Maracay** |
| Lara / Barquisimeto / Cabudare | **Barquisimeto** |
| Zulia / Maracaibo | **Maracaibo** |
| Táchira / San Cristóbal | **San Cristóbal** |
| Miranda / Los Teques / Guarenas / Guatire | **Miranda** |
| Nueva Esparta / Margarita / Porlamar | **Isla de Margarita** |
| Puerto Ordaz / San Félix / Ciudad Guayana | **Ciudad Guayana** |
| Vargas / La Guaira / Maiquetía | **La Guaira** |

El mapa (`CITY_MAP`) cubre todos los estados venezolanos + sus municipios principales. Para agregar un alias nuevo: añadir entrada al objeto `CITY_MAP` en `google-apps-script.js`.

---

## Blueprints de campañas

Hay dos flujos definidos y documentados. Elegir según si hay landing page o no.

---

### Blueprint A — Con Landing Page + Formulario

Campaña completa con página de captura. El usuario llena un form → WhatsApp se abre → datos van solos al Sheet. El vendedor asigna el lead y marca la venta.

**Cuándo usarlo:** Producto con propuesta de valor que necesita explicarse, audiencia fría, mayor volumen de leads esperado.

**Flujo:**
```
Anuncio → Landing page (form: Nombre, Email, Teléfono, Ciudad)
  → submit:
      client-side: gtag generate_lead + fbq Lead + fbq Contact (mismo eventId, dedup)
      window.open(whatsappUrl)  ← inmediato, sin await
      fetch('/api/lead', keepalive)  ← background
        → Meta Conversions API: evento Lead (server-side, dedup por eventId)
        → Apps Script webhook: fila en Sheet (con IP + UserAgent)
        → MailerLite: agrega suscriptor al grupo → automatización 24h → email
  → WhatsApp abierto (cliente habla con el negocio)
  → Admin selecciona vendedora en "Asignar a" → dialog → abre WhatsApp → envía mensaje
  → Vendedora atiende al cliente
  → Admin llena Monto USD → marca Venta ✅
  → Apps Script onVentaEdit → Purchase a Meta CAPI (action_source: website)
```

**Sheet:** Una sola tab por campaña. 25 columnas (ver tabla completa arriba).

**Señales Meta Lead:** email hash + phone hash + fn hash + city hash + fbc + fbp + IP + userAgent → ~9/10 match quality
**Señales Meta Purchase:** email hash + phone hash + fn hash + city hash + fbc + fbp + IP + userAgent (guardados en Sheet al llegar el lead) → ~8-9/10 match quality

**API (`api/lead.js`) recibe:** campaign, eventId, name, email, city, whatsapp, negocio, fbc, fbp, utm, platform, device, userAgent (IP se toma del request)

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
- Solo actúa en columna VENTA (13), cuando el valor pasa a `true`
- Si Estado Meta no está vacío → no reenvía (protección contra doble envío)
- Si monto vacío → escribe `⚠️` en Estado Meta y aborta
- Hashea email, teléfono, nombre, ciudad con SHA-256 antes de enviar a Meta
- Purchase incluye IP y UserAgent guardados al llegar el lead → match quality ~8-9/10

**onAsignarEdit (Apps Script):**
- Solo actúa en columna ASIGNAR (21), cuando cambia a un valor no vacío
- Si Asignado (22) ya tiene valor → no re-dispara
- Marca Asignado con `nombreVendedora · timestamp` antes de mostrar el dialog
- Muestra modal con preview del mensaje y link `https://api.whatsapp.com/send?phone=...`

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
4. `const WHATSAPP_NUMBERS` tiene los dos números de Rosmary y Cecilia — ajustar si aplica
5. Actualizar el `event_source_url` en `google-apps-script.js` si es una campaña diferente
6. Usar **rutas absolutas** para todos los assets: `/cp/<nombre>/assets/...` (no rutas relativas)
7. Crear un grupo nuevo en MailerLite para la campaña y actualizar `MAILERLITE_GROUP_ID` en Vercel (o usar el mismo grupo si se quiere la misma automatización)
8. Push a GitHub → Vercel despliega automáticamente
9. En el Sheet, ejecutar **Savaya → Configurar dropdowns de asignación** para activar los dropdowns en las filas existentes

---

## Completado

- [x] Campaña `colegiales`: landing mayorista calzado escolar, tallas 28-34 y 35-39
- [x] `api/lead.js`: Meta CAPI + Google Sheets webhook + MailerLite, deduplicación por `event_id`
- [x] Número único de WhatsApp: `+58 412-1211526` en landing, footer, email y Apps Script
- [x] Dominio `www.savayavzla.com` apuntado a este proyecto
- [x] Monorepo subido a `github.com/aandreskss/SAVAYA`
- [x] Evento Lead enriquecido: `content_category`, `content_type`, `lead_name`
- [x] Tracking de plataforma (Facebook/Instagram) y dispositivo (Teléfono/PC) en Google Sheets
- [x] Columna **Anuncio** en Google Sheets via `utm_content`
- [x] Registro de ventas offline → Meta: columnas Venta/Monto/Fecha Venta/Estado Meta + trigger `onVentaEdit`
- [x] Validación: bloquea envío de Purchase si Monto está vacío
- [x] `fbc` y `fbp` guardados en Sheet e incluidos en `user_data` del Purchase
- [x] **IP y UserAgent** guardados en Sheet (cols 19-20) → Purchase match quality ~8-9/10
- [x] **CRO landing móvil:** form arriba del fold (imagen oculta en <900px), sin animación reveal, badge de urgencia
- [x] **Validación teléfono:** mínimo 10 dígitos — rechaza cédulas y números inválidos
- [x] **Pixel events completos:** `ViewContent` al cargar + `InitiateCheckout` al tocar el form
- [x] **Purchase action_source corregido:** `website` + `event_source_url` → aparece en reportes de campañas
- [x] **GA4 `G-FQ34QH6JB5`:** `view_item` + `begin_checkout` + `generate_lead`
- [x] **MailerLite:** dominio verificado, grupo `SAVAYA COLEGIAL`, automatización 24h activa
- [x] **Email template:** `email-colegiales.html` — ángulo A+C (acceso prioritario + urgencia septiembre)
- [x] **DNS MailerLite** agregados en Vercel: DKIM (CNAME) + SPF (TXT) + verificación (TXT)
- [x] **Asignación de leads a vendedoras:** dropdown en Sheet → dialog → WhatsApp pre-rellenado → columna Asignado con timestamp
- [x] **Hoja de métricas `📊 Métricas`:** `buildMetrics()` genera pestaña con 11 secciones y 6 gráficas automáticas (tendencia, ciudad, día semana, plataforma, dispositivo, vendedora). Trigger diario 8am opcional.
- [x] **Normalización de ciudades:** `normalizeCity()` + `CITY_MAP` agrupa variantes del mismo lugar (estado vs ciudad, tildes, abreviaturas) → evita duplicados en métricas. Cubre todos los estados de Venezuela.
- [x] **Sistema de calificación de leads:** toggle Sí/No en el form + lógica negocio × ciudad principal → Cal. Auto (col X) con color. Cal. Vendedor (col Y) para confirmación manual. Sección POR CALIFICACIÓN en métricas.
- [x] **Dos vendedoras activas:** Rosmary (`584121211526`) y Cecilia (`584242908090`). Round-robin en la landing, dropdown en el Sheet, ambos números en el footer.
