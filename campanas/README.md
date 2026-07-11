# SAVAYA — Proyecto de campañas (landings de conversión)

Este proyecto aloja **todas las landings de campaña de SAVAYA**, cada una en su propia carpeta bajo `/cp/`. Es un proyecto de Vercel separado del futuro sitio de la tienda (`www.savayavzla.com`) — se conectan mediante *rewrites* (ver sección "Arquitectura de dominio" más abajo).

Cada campaña es una página de una sola pieza (`index.html`) + una función serverless compartida (`api/lead.js`) que envía cada lead al **Meta Pixel** (navegador), a la **Conversions API** (servidor) y a una **hoja de Google Sheets** (registro permanente), con deduplicación por `event_id` y redirección final a WhatsApp del negocio.

## Estructura

```
/cp/colegiales/index.html   ← landing de la campaña "Colegiales"
/cp/colegiales/assets/      ← imágenes propias de esa campaña
/api/lead.js                ← función serverless COMPARTIDA por todas las campañas
google-apps-script.js       ← código para el registro en Google Sheets
vercel.json                 ← redirect de "/" → "/cp/colegiales" (solo cosmético)
```

### Cómo agregar una campaña nueva
1. Duplica una carpeta existente, ej. `cp/colegiales` → `cp/dia-de-la-madre`.
2. En el `index.html` de la copia, cambia `const CAMPAIGN = 'colegiales';` por el nombre de la nueva campaña (esto es lo único que distingue una campaña de otra a nivel de datos — todas comparten el mismo Pixel, el mismo número de WhatsApp y el mismo `/api/lead`).
3. **Importante:** todas las referencias a `assets/...` (imágenes, favicon, logo, preload) deben ser **rutas absolutas** con el prefijo completo de la campaña, ej. `/cp/dia-de-la-madre/assets/hero.jpg`, **no** rutas relativas (`assets/hero.jpg`). Si visitas la URL sin la barra final (`/cp/dia-de-la-madre`, sin `/` al final) — que es como la comparte la mayoría de la gente — el navegador resuelve las rutas relativas un nivel más arriba y las imágenes se rompen (404). Ya nos pasó con la campaña "colegiales" y así se corrigió.
4. Ajusta textos/imágenes propias de esa campaña.
5. Deploy. Ya queda disponible en `/cp/dia-de-la-madre`.

No hace falta tocar `api/lead.js` — es agnóstico a la campaña, solo etiqueta cada lead con el campo `campaign` que le manda el formulario.

## Qué recoge el formulario
Nombre, correo, ciudad y WhatsApp. Al enviarlo:
1. Se dispara `fbq('track', 'Lead', ...)` en el navegador.
2. Se envía el mismo lead (con el mismo `event_id`) a `/api/lead`, que en paralelo:
   - lo reenvía a la Conversions API de Meta con el email y teléfono **hasheados en SHA-256** (requisito de Meta), etiquetado con la campaña de origen;
   - lo agrega como fila nueva en Google Sheets (si `LEAD_WEBHOOK_URL` está configurado) — este es el registro permanente de todos los leads, con campaña, ciudad, UTM, etc.
3. Se muestra un botón "Continuar por WhatsApp" con el mensaje ya redactado, para que el lead llegue directo al WhatsApp del negocio.

## Arquitectura de dominio (tienda + campañas en un solo dominio)

`www.savayavzla.com` va a ser la tienda (proyecto Vercel aparte). Este proyecto de campañas **no necesita el dominio propio** — se queda en su URL de Vercel (`https://savaya-landing.vercel.app`) y la tienda le hace *proxy* de las rutas `/cp/*` y `/api/*` mediante un rewrite, usando el patrón de ["multi-zonas" de Vercel](https://vercel.com/docs/multi-zones). El visitante nunca nota que son dos proyectos distintos.

**Cuando el proyecto de la tienda exista**, agrégale este `vercel.json` (o su equivalente si usa un framework con su propio sistema de rewrites, ej. Next.js):

```json
{
  "rewrites": [
    { "source": "/cp/:path*", "destination": "https://savaya-landing.vercel.app/cp/:path*" },
    { "source": "/api/:path*", "destination": "https://savaya-landing.vercel.app/api/:path*" }
  ]
}
```

Con eso, `https://www.savayavzla.com/cp/colegiales` sirve exactamente este proyecto, y el formulario (que llama a `/api/lead` con ruta relativa) sigue funcionando igual porque ese rewrite también proxea `/api/*`.

Hasta que la tienda exista, los anuncios pueden apuntar directo a `https://savaya-landing.vercel.app/cp/colegiales` — el día que se conecte el dominio, el link de campaña pasa a `www.savayavzla.com/cp/colegiales` sin tener que tocar nada de este proyecto.

## Configuración necesaria antes de publicar una campaña nueva

### 1. Pixel ID y números de WhatsApp (lado cliente)
En el `index.html` de cada campaña, cerca del inicio del `<body>`:
```js
const FB_PIXEL_ID = '27355395054120748';                          // Pixel de SAVAYA (ya configurado)
const WHATSAPP_NUMBERS = ['584129404770', '584121211526'];        // números del negocio — se reparten al azar por lead
const CAMPAIGN = 'colegiales';                                    // cámbialo por campaña
```
Cada vez que un lead completa el formulario, se elige al azar uno de los números de `WHATSAPP_NUMBERS` para el botón "Continuar por WhatsApp" — así los leads se reparten entre los vendedores sin depender de un solo número. Puedes poner uno o varios números en el arreglo.

### 2. Variables de entorno (lado servidor, en Vercel — ya configuradas para este proyecto)

| Variable | Descripción |
|---|---|
| `FB_PIXEL_ID` | Debe coincidir con el del `index.html` para que la deduplicación funcione. |
| `FB_ACCESS_TOKEN` | Token de Events Manager → Configuración → Conversions API. |
| `LEAD_WEBHOOK_URL` | URL del Google Apps Script desplegado (ver `google-apps-script.js`) — ahí se guardan todos los leads en Sheets. |

## Despliegue (Vercel)
```
vercel --prod
```
No hay build step ni dependencias — HTML/CSS/JS plano más una función Node sin librerías externas (usa `fetch` y `crypto`, nativos en Node 18+).

## Probar el evento en Meta antes de lanzar campañas
En Events Manager → Test Events, copia el "Test Event Code" y pásalo en el body de `/api/lead` como `testEventCode` para verificar que el evento `Lead` llega correctamente antes de activar la campaña real.

## Imágenes
Las fotos de cada campaña viven en `cp/<campaña>/assets/`. Las de "Colegiales" (`hero-lifestyle.jpg`, `collection-bench.jpg`, `detail-rhinestone.jpg`, `box.jpg`, `logo.png`, `favicon.png`) fueron extraídas/optimizadas a partir del brochure y el logo oficial de la marca.
