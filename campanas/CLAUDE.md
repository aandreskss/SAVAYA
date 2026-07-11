# CLAUDE.md — Savaya Campañas

Landings de conversión de SAVAYA. Proyecto Vercel separado de la tienda, expuesto bajo el mismo dominio mediante rewrites (ver sección "Arquitectura de dominio" en README.md).

---

## Repositorio

- **GitHub:** `https://github.com/aandreskss/SAVAYA.git` (monorepo)
- **Carpeta en el monorepo:** `Campañas/`
- **Rama principal:** `main`

---

## Comandos

```bash
# Deploy a producción (desde esta carpeta)
vercel --prod
```

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

## Cómo agregar una campaña nueva

1. Duplicar `cp/colegiales/` → `cp/<nombre-nueva-campaña>/`
2. Cambiar `const CAMPAIGN = 'colegiales'` por el nuevo nombre
3. Cambiar `const WHATSAPP_NUMBERS` si aplica
4. Usar **rutas absolutas** para todos los assets: `/cp/<nombre>/assets/...` (no rutas relativas — ver README.md para el detalle del por qué)
5. Ajustar textos e imágenes
6. `vercel --prod`

---

## Completado

- [x] Campaña `colegiales`: landing mayorista calzado escolar, tallas 28-34 y 35-39
- [x] `api/lead.js`: Meta Pixel + Conversions API + Google Sheets webhook, deduplicación por `event_id`
- [x] Reparto de leads entre múltiples números de WhatsApp (aleatorio por submit)
- [x] Dominio `www.savayavzla.com` apuntado a este proyecto
- [x] Monorepo subido a `github.com/aandreskss/SAVAYA`
