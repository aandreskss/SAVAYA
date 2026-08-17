# ADR-004: Flujo de pago manual venezolano con verificación humana

## Estado

Decidido

## Contexto

SAVAYA opera exclusivamente en Venezuela (distribución desde Carabobo, entregas nacionales). El mercado venezolano tiene características específicas que hacen que el flujo de pago de un e-commerce global no aplique directamente:

1. **Sin pasarela automática dominante:** Visa/Mastercard tienen cobertura limitada y requieren cuentas bancarias en dólares con procesador internacional. PayPal tiene restricciones severas para cuentas venezolanas. Stripe no opera en Venezuela.

2. **Métodos de pago local:** Pago Móvil (transferencia instantánea entre bancos venezolanos), Zelle (dólares USA entre cuentas bancarias americanas), USDT/criptomonedas y efectivo son los métodos reales que usa el comercio venezolano en 2026.

3. **Verificación manual por necesidad:** sin pasarela automática, el negocio necesita verificar cada pago comparando el comprobante que sube el cliente contra los movimientos en sus cuentas reales. Esto es un proceso manual inevitable, no un defecto de diseño.

`savaya-tienda` ya implementa este flujo y ha sido validado con clientes reales. El problema no es el modelo de negocio sino la implementación: datos hardcodeados, sin idempotencia, rate limiter roto, comprobantes en carpeta pública. `savaya-tienda-nueva` reimplementa el mismo modelo de negocio con las correcciones necesarias.

## Decisión

**Flujo de pago manual venezolano: PENDING_PAYMENT → verificación humana del comprobante → PAID.**

El flujo completo está documentado en `PAYMENTS-VENEZUELA.md`. Las decisiones técnicas clave:

1. **Comprobante en Cloudinary privado** — nunca en bucket público
2. **Métodos de pago en DB** — editables desde admin sin deploy, no en código
3. **Tasa de cambio congelada al crear el pedido** — no se recalcula después
4. **Reserva de inventario temporal** — N horas configurables, expiración via cron
5. **Máquina de estados explícita** — transiciones inválidas rechazadas en código, no solo en UI
6. **Idempotencia en creación de pedido** — double submit no genera duplicados
7. **Reservas parciales configurables** — porcentajes en ApplicationSetting, no hardcodeados

## Alternativas consideradas

### Mercado Pago (descartado como alternativa principal)

Mercado Pago opera en Venezuela con ciertas restricciones.

**Razones de descarte:**
- **Adopción baja en el segmento de SAVAYA:** los clientes de calzado de moda en Venezuela usan preferentemente Pago Móvil y Zelle — los métodos que ya tiene Savaya. Agregar Mercado Pago no incrementaría significativamente la conversión para el volumen actual.
- **Complejidad de integración desproporcionada:** la integración correcta de Mercado Pago (webhooks con verificación de firma, manejo de estados de pago, devoluciones, disputas) requiere semanas de trabajo y testing. Para el volumen actual de SAVAYA (unidades en el orden de decenas de pedidos por semana), la verificación manual es más rápida que mantener la integración.
- **No reemplaza los métodos actuales:** Mercado Pago sería un método adicional, no un reemplazo. La arquitectura actual (métodos en DB) permite agregarlo en el futuro sin cambiar el resto del sistema.

Decisión: mantener la puerta abierta para integrarlo como un método más en la tabla `PaymentMethod` con un adaptador propio si el volumen lo justifica — la arquitectura lo soporta sin cambios estructurales.

### Pagos automáticos USDT vía API (descartado)

Existe la posibilidad técnica de integrar una API de procesamiento de pagos en criptomonedas que confirme automáticamente cuando llega una transacción USDT a la wallet.

**Razones de descarte:**
- **Complejidad:** requiere un nodo o un servicio de terceros que monitoree la blockchain TRC20 y notifique via webhook. La confiabilidad de estos servicios varía, y las fallas pueden resultar en pagos no detectados o falsos positivos.
- **Riesgo regulatorio:** el tratamiento de criptomonedas en Venezuela tiene un marco regulatorio cambiante (SUNACRIP). Automatizar el flujo crea más exposición que hacerlo manualmente.
- **Volumen:** para el volumen actual de SAVAYA, el overhead operativo de la verificación manual de USDT es mínimo (segundos en revisar un hash en TronScan).

Decisión: USDT sigue siendo manual. Si el volumen de pagos en USDT crece significativamente, se reevalúa.

### WooCommerce / Shopify (descartado)

Plataformas de e-commerce con plugins para mercados latinoamericanos.
- **Shopify:** sin soporte nativo para Pago Móvil/Zelle venezolano; requeriría plugins customizados; costo mensual + comisión por transacción; control limitado sobre el diseño y el checkout
- **WooCommerce:** control mayor pero require hosting/mantenimiento de WordPress; el stack SAVAYA (Next.js + Vercel) es más apropiado para el perfil de la marca
- Ambas plataformas son válidas para un negocio diferente, pero SAVAYA ya decidió construir propio por control total sobre el diseño y el checkout venezolano

## Consecuencias

**Positivo:**
- El flujo es exactamente lo que el mercado venezolano espera — los clientes están familiarizados con subir comprobantes
- Control total sobre la UX del checkout — no hay restricciones de una plataforma de pagos
- Sin comisión por transacción a un procesador
- El sistema se puede adaptar rápidamente si aparece un nuevo método de pago popular en Venezuela

**Negativo / trade-offs:**
- **Fricción operativa:** alguien del equipo de SAVAYA debe revisar manualmente cada comprobante. A volumen alto, esto escala linealmente con personal. Para el volumen actual, es manejable.
- **Riesgo de fraude:** sin validación automática, un cliente podría subir un comprobante falso. El admin debe revisar que la referencia coincida en los estados de cuenta reales. Esto es inherente al modelo, no un fallo de la implementación.
- **Tiempo de aprobación:** el pedido no avanza a PAID hasta que el admin lo revisa manualmente. El cliente queda en espera. Mitigado por el flujo de confirmación por WhatsApp y las notificaciones de email.
