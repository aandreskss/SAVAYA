# ADR-003: ExchangeRateProvider — abstracción con ve.dolarapi.com como fuente primaria

## Estado

Decidido

## Contexto

SAVAYA vende en USD como moneda de referencia y muestra el equivalente en bolívares (Bs.) en tiempo real usando la tasa oficial del Banco Central de Venezuela (BCV). Esta conversión aparece en:
- Precios en el storefront (PDP, PLP)
- Paso de pago en el checkout (monto en Bs. a transferir)
- Resumen del pedido (la tasa se congela al crear el pedido)
- Panel admin (para revisión de pagos en Bs.)

`savaya-tienda` ya implementa esta funcionalidad usando `ve.dolarapi.com` con caché de 1 hora via `fetch` con `next.revalidate`. Está validado y funcionando en producción.

El riesgo identificado en la auditoría: si `ve.dolarapi.com` cae, el sitio mostraría `$0` o un error de fetch — no hay fallback implementado. Tampoco hay una capa de abstracción: la llamada a la API externa está en `lib/bcvRate.ts` y puede ser llamada directamente desde cualquier componente o ruta.

## Decisión

**Abstracción `ExchangeRateProvider` + fuente primaria `ve.dolarapi.com` + caché en DB + fallback a última tasa válida.**

### Fuente primaria: ve.dolarapi.com

- La misma que usa `savaya-tienda` — ya probada en producción con la realidad del e-commerce venezolano
- Endpoint: `https://ve.dolarapi.com/v1/dolares/oficial` — devuelve la tasa BCV oficial
- Licencia de uso: API pública comunitaria sin autenticación requerida (sin API key necesaria para el tier gratuito)
- Actualización de la tasa en la fuente: el BCV actualiza 2-3 veces por semana — la fuente refleja el cambio en minutos
- Latencia promedio: < 300ms desde Venezuela, ~800ms desde servidores de Vercel en EE.UU. — manejable con caché

### Flujo de obtención de tasa

```
Request que necesita la tasa
  └─► exchange-rates/service.ts → getCurrentRate()
        ├─► Leer ExchangeRate más reciente de la DB (caché persistente)
        │     └─► Si age < 1 hora: devolver inmediatamente (cache hit)
        │
        └─► Si age > 1 hora (o no hay registro):
              └─► Llamar ve.dolarapi.com
                    ├─► Éxito: guardar nueva tasa en DB, devolver
                    └─► Error (timeout, 5xx, red): devolver última tasa válida de DB
                                                    + marcar como "usando tasa anterior"
```

### Actualización proactiva (no reactiva)

Un cron de Vercel (`/api/cron/update-exchange-rate`, 3 veces al día) actualiza la tasa antes de que los requests la necesiten. Así el caché siempre está caliente y el usuario nunca espera una llamada externa.

### Override manual del admin

El admin puede forzar una tasa manualmente desde `/admin/tasas` (acción de alto riesgo con reautenticación). El override se guarda como un `ExchangeRate` marcado con `is_manual_override: true` y no es sobreescrito por el cron hasta que el admin lo libere. Ver `PAYMENTS-VENEZUELA.md` y `SECURITY.md` para el AuditLog de esta acción.

## Alternativas evaluadas

### bcvapi.tech

- API alternativa que también refleja la tasa BCV oficial
- Ventaja: tiene endpoint estructurado similar a `ve.dolarapi.com`
- Desventaja: menos historia de uptime verificada, la comunidad de desarrolladores venezolanos reporta más intermitencias
- Decisión: **descartar como fuente primaria**, pero puede usarse como fuente secundaria de fallback si `ve.dolarapi.com` falla (se implementaría como segundo adaptador en `ExchangeRateProvider`)

### cotizave.com

- Agrega múltiples fuentes (BCV, paralelo, cripto) con un solo endpoint
- Ventaja: más datos en un solo request
- Desventaja: el endpoint de BCV específico es menos documentado; mezclar tasas paralelas y oficiales puede generar confusión en el código si no se discrimina bien
- Decisión: **descartar** — `ve.dolarapi.com` es más claro en su propósito (solo tasa oficial BCV)

### API directa del BCV (descartado)

El BCV no ofrece una API pública oficial. Las APIs comunitarias (como `ve.dolarapi.com`) son scrapers/parsers de la página del BCV. No hay una fuente directa más confiable.

### Tasa fija configurada manualmente (parcialmente adoptado)

Como mecanismo de override, no como fuente principal. El negocio necesita ver la tasa actualizada automáticamente — una tasa fija requeriría intervención manual cada vez que el BCV actualiza, lo cual es frecuente.

## Consecuencias

**Positivo:**
- Si `ve.dolarapi.com` cae, el sitio sigue funcionando con la última tasa válida — nunca muestra $0 ni rompe el checkout
- La abstracción `ExchangeRateProvider` permite cambiar de proveedor sin tocar ningún componente ni ruta
- El cron proactivo mantiene el caché caliente — los usuarios no pagan la latencia de llamadas externas
- El override manual permite ajuste rápido si la fuente externa diverge de la realidad del negocio

**Negativo / trade-offs:**
- Si la fuente externa está caída por más tiempo del que dura la última tasa válida en DB (improbable, pero posible en una caída prolongada), el sitio muestra una tasa potencialmente desactualizada sin avisar al usuario que es aproximada — [PENDIENTE: definir si se debe mostrar un aviso visible cuando se usa tasa de fallback]
- Dependencia de una API comunitaria sin SLA — el proveedor puede cambiar su endpoint o desaparecer. La abstracción mitiga el impacto pero no lo elimina
