# DATABASE.md — Modelo de datos de SAVAYA

> Última actualización: 2026-08-15
> El DDL completo (Drizzle schema por dominio) se genera en la Fase 1.3. Este documento describe responsabilidades, reglas de integridad y datos semilla.

---

## 1. Conexión y configuración

- **Motor:** PostgreSQL via Supabase (mismo proyecto Supabase que `savaya-tienda`, para no perder datos al hacer el corte en Fase 8)
- **ORM:** Drizzle ORM — tipos inferidos del schema, sin generación de CLI, SQL explícito
- **`DATABASE_URL`:** connection string de Supabase con pooler (PgBouncer) — usado en runtime por Drizzle para todas las queries de la aplicación
- **`DIRECT_URL`:** connection string directo (sin pooler) — usado exclusivamente por `drizzle-kit` para ejecutar migraciones DDL (el pooler de Supabase no soporta comandos DDL como `CREATE TABLE`)
- **Prefijo de tablas:** ninguno. Las tablas nuevas de `savaya-tienda-nueva` tienen nombres limpios (`products`, `orders`, etc.). Las tablas viejas de `savaya-tienda` tienen sus propios nombres en el schema de Supabase — coexisten sin conflicto hasta el corte en Fase 8

---

## 2. Entidades y responsabilidades

### Identidad y acceso

| Entidad | Responsabilidad |
|---|---|
| `User` | Usuario interno del sistema (admin, staff). Email, password hash, estado activo/inactivo, TOTP secret. No confundir con `Customer` (cliente de la tienda). |
| `Role` | Rol del sistema (Super Admin, Admin, Catálogo, Inventario, Ventas, Finanzas, Atención al Cliente, Marketing, Analista). |
| `Permission` | Permiso granular por acción (ej. `orders:approve_payment`, `catalog:publish_product`, `settings:override_exchange_rate`). |
| `RolePermission` | Tabla de unión Role ↔ Permission. Define qué permisos tiene cada rol. |
| `UserRole` | Tabla de unión User ↔ Role. Un usuario puede tener múltiples roles. |

### Clientes

| Entidad | Responsabilidad |
|---|---|
| `Customer` | Cliente de la tienda. Nombre, email, teléfono/WhatsApp, fecha de registro, estado. Separado de `User` — un admin no es un `Customer` y viceversa. |
| `Address` | Dirección de entrega de un `Customer`. Tipo (domicilio/trabajo/otro), estado, ciudad, municipio, calle, referencias, si es la predeterminada. |
| `CustomerNote` | Nota interna de un agente de admin sobre un cliente. Append-only con autor y fecha. |
| `CustomerTag` | Tag asignado a un cliente (nuevo, recurrente, VIP, alto ticket, inactivo, mayorista). Manual inicialmente. |

### Catálogo

| Entidad | Responsabilidad |
|---|---|
| `Product` | Producto maestro: nombre, descripción, slug único, estado (borrador/publicado/archivado), categoría, colección(es), género, palabras clave para búsqueda. |
| `ProductVariant` | Combinación específica de producto + color + talla = SKU único. Precio propio (puede diferir del producto padre). Estado activo/inactivo. |
| `Category` | Jerarquía de categorías (Mujer, Hombre, Running, Casual, etc.) con soporte de un nivel de subcategoría. Slug, nombre SEO, descripción, imagen. |
| `Collection` | Curación editorial independiente de la jerarquía de categorías (Nuevos, Bestsellers, Rebajas, Temporada). Un producto puede estar en varias colecciones. |
| `Color` | Catálogo de colores disponibles: nombre, hex, slug. Los 19 colores de SAVAYA son datos semilla. |
| `Size` | Catálogo de tallas disponibles: valor ('35'–'40'), tipo (calzado), orden de display. |
| `ProductMedia` | Imágenes y videos de un producto. URL en Cloudinary, tipo (foto/video), orden, si es la imagen portada. |

### Inventario

| Entidad | Responsabilidad |
|---|---|
| `Inventory` | Snapshot de stock actual por `ProductVariant`. Es el resultado agregado de todos los `InventoryMovement` asociados. Nunca se actualiza con UPDATE directo desde lógica de negocio — solo via triggers o por el servicio de inventario que inserta el movimiento y actualiza el snapshot en la misma transacción. |
| `InventoryMovement` | Registro inmutable de cada cambio de stock: tipo (ENTRY, SALE, RESERVED, RESERVATION_EXPIRED, ADJUSTMENT, RETURN, CANCELLATION, CORRECTION), cantidad, actor, motivo (obligatorio en ADJUSTMENT y CORRECTION), timestamp. |

### Carrito

| Entidad | Responsabilidad |
|---|---|
| `Cart` | Carrito de compra asociado a un `Customer` (autenticado) o a un `session_id` (invitado). Expiración para carritos de invitados. |
| `CartItem` | Línea del carrito: referencia a `ProductVariant`, cantidad, precio al momento de agregarlo (para detectar cambios de precio). |

### Pedidos

| Entidad | Responsabilidad |
|---|---|
| `Order` | Pedido: cliente, total en USD, equivalente en Bs., `exchange_rate_snapshot` (tasa congelada al momento de crear), método de pago elegido, método de entrega, dirección/municipio destino, estado actual, número `SAV-XXXXXX`, referencia de idempotencia. |
| `OrderItem` | Línea del pedido: variante, cantidad, precio unitario congelado al momento del pedido, descuento aplicado. |
| `OrderStatusHistory` | Registro append-only de cada transición de estado del pedido. Actor, estado anterior, estado nuevo, motivo (obligatorio en rechazos), timestamp, IP. |

### Pagos

| Entidad | Responsabilidad |
|---|---|
| `PaymentMethod` | Método de pago activo configurado en admin: nombre, tipo (Zelle/PagoMovil/Transferencia/USDT/Binance/Efectivo), instrucciones, datos bancarios/wallet, moneda, estado activo/inactivo. Editable desde admin sin deploy. |
| `Payment` | Registro del pago declarado por el cliente: monto declarado, moneda, referencia, fecha, titular, banco/teléfono según el método. |
| `PaymentProof` | Comprobante subido por el cliente: URL en Cloudinary (carpeta privada), nombre no predecible, timestamp de subida, estado (PENDING/APPROVED/REJECTED), motivo de rechazo si aplica. |

### Envío

| Entidad | Responsabilidad |
|---|---|
| `ShippingMethod` | Tipo de entrega disponible (Delivery domicilio Carabobo, Envío nacional por agencia, Retiro en tienda). |
| `ShippingZone` | Zona geográfica de cobertura (municipio, ciudad, estado). |
| `ShippingRate` | Tarifa por zona + método: monto base, monto express, umbral de envío gratis. Editables desde admin. |

### Descuentos y promociones

| Entidad | Responsabilidad |
|---|---|
| `Discount` | Regla de descuento: porcentaje o monto fijo, aplicabilidad (producto/categoría/colección/cliente/primer pedido), fechas de vigencia, límites. |
| `Coupon` | Código de cupón asociado a una regla `Discount`. Código, límite global de usos, límite por usuario, estado. |
| `CouponUsage` | Registro de cada uso de un cupón: customer, order, timestamp. Para enforcement del límite por usuario. |
| `Promotion` | Campaña promocional que puede agrupar múltiples descuentos y aplicarse automáticamente por condiciones (sin código). |

### CMS

| Entidad | Responsabilidad |
|---|---|
| `Page` | Página de contenido editable desde admin (Nosotros, FAQ, Envíos, etc.). Slug, título, estado (borrador/publicado), metadata SEO. |
| `PageSection` | Bloque de contenido tipado dentro de una `Page` o de la Home. Tipo (Hero, ProductCarousel, EditorialBlock, etc.), orden, estado activo/inactivo, contenido en JSON validado por Zod según el tipo. |
| `Banner` | Banner independiente con imagen desktop/mobile, CTA, URL destino, fechas de vigencia, estado. |
| `Popup` | Popup configurable: imagen, CTA, páginas donde aplica, delay mínimo (nunca 0), frecuencia de aparición, fechas. |

### Configuración y operación

| Entidad | Responsabilidad |
|---|---|
| `ExchangeRate` | Historial de tasas BCV/EUR almacenadas: fuente, valor, timestamp de obtención, si fue override manual, quién hizo el override. La tasa vigente es la más reciente. |
| `WholesaleLead` | Lead del formulario de ventas al mayor: nombre, negocio, ciudad, WhatsApp, volumen estimado, estado (nuevo/contactado/descartado). Tabla propia, no mezclada con `Customer`. |
| `AuditLog` | Registro append-only de acciones sensibles de admin. Ver sección 3. |
| `ApplicationSetting` | Configuración de la tienda editable desde admin sin deploy: datos de empresa, WhatsApp, redes sociales, porcentajes de reserva parcial, duración de reserva de inventario, umbral stock bajo, IDs de analytics, etc. Clave/valor tipado con JSON schema. |

---

## 3. Reglas de integridad

### Inventario inmutable via movimientos

El stock de una variante **nunca** se modifica con `UPDATE inventory SET stock = X`. Toda operación que cambia el stock debe insertar un `InventoryMovement` con tipo y motivo, y actualizar el snapshot de `Inventory` dentro de la misma transacción.

Tipos de movimiento válidos:
- `ENTRY` — entrada de mercancía nueva
- `SALE` — venta confirmada (pedido pasa a PAID)
- `RESERVED` — reserva temporal al crear pedido (PENDING_PAYMENT)
- `RESERVATION_EXPIRED` — la reserva expiró sin pago aprobado
- `ADJUSTMENT` — ajuste manual desde admin (requiere motivo obligatorio)
- `RETURN` — devolución aprobada
- `CANCELLATION` — pedido cancelado, stock liberado
- `CORRECTION` — corrección de error en conteo físico (requiere motivo obligatorio)

### Máquina de estados del pedido

Las transiciones de estado son explícitas en código, no un enum suelto que cualquiera puede mutar:

```
PENDING_PAYMENT ──────────────────────────────────► CANCELLED
     │                                               (expiración reserva o cancelación manual)
     │
     ▼
PAYMENT_UNDER_REVIEW ──────────────────────────────► PAYMENT_REJECTED
     │                                                     │
     │                                                     ▼
     │                                             PENDING_PAYMENT (cliente reintenta)
     ▼
    PAID ──────────────────────────────────────────► REFUNDED (excepcional)
     │
     ▼
PREPARING
     │
     ▼
SHIPPED
     │
     ▼
DELIVERED
```

Transiciones inválidas rechazadas por el sistema (lista no exhaustiva):
- `PAID` → `PENDING_PAYMENT`
- `DELIVERED` → cualquier estado anterior
- `CANCELLED` → cualquier estado activo
- `REFUNDED` → cualquier estado activo

### AuditLog append-only

La tabla `AuditLog` no tiene `UPDATE` ni `DELETE` permitidos desde la aplicación. Solo `INSERT`. Cualquier intento de modificar un registro existente debe ser rechazado por política de la aplicación (y opcionalmente por RLS de Supabase como segunda capa).

---

## 4. Estrategia de migración

- **Herramienta:** `drizzle-kit` — `generate` para crear archivos de migración SQL desde el schema TypeScript, `migrate` para aplicarlos contra la DB
- **Migraciones versionadas en Git:** todas las migraciones viven en `drizzle/migrations/` con timestamps. Se aplican en orden en cada entorno
- **Rollback:** si una migración falla, el script de migración falla completo (transacción). Para rollback, se escribe una nueva migración inversa — nunca se edita una migración ya aplicada en producción
- **Coexistencia con tablas de `savaya-tienda`:** las tablas viejas de Supabase coexisten en el mismo schema de Postgres. Drizzle solo conoce las tablas que define en sus schemas — las tablas viejas son invisibles para él y no hay conflicto de nombres
- **Flujo de desarrollo:**
  1. Modificar `domains/*/schema.ts`
  2. `npm run db:generate` → crea archivo en `drizzle/migrations/`
  3. Revisar el SQL generado antes de aplicar
  4. `npm run db:migrate` → aplica contra la DB de desarrollo
  5. Commit de schema + migración juntos en el mismo commit

---

## 5. Datos semilla (seed de desarrollo y producción)

El seed debe poder correr en entorno de desarrollo y también cargarse en producción para datos de configuración base (catálogos de tallas, colores, métodos de pago). Los datos de productos son solo para desarrollo.

### Tallas

```
['35', '36', '37', '38', '39', '40']
Tipo: calzado femenino/masculino (SAVAYA ampliado a mujer + hombre para 2026)
```

### Colores (19 — validados con el negocio)

| Nombre | Hex |
|---|---|
| Negro | #111111 |
| Blanco | #FFFFFF |
| Beige | #D4B896 |
| Café | #6B3F2A |
| Camel | #C19A6B |
| Gris | #9E9E9E |
| Plateado | #C0C0C0 |
| Dorado | #C9A227 |
| Rosado | #F4A7B9 |
| Rojo | #C0362C |
| Azul | #1E3A8A |
| Azul marino | #172554 |
| Verde | #1E7F4F |
| Mostaza | #B8791A |
| Naranja | #EA580C |
| Lila | #A855F7 |
| Nude | #E8C9A5 |
| Multicolor | N/A |
| Estampado | N/A |

### Ciudades con cobertura nacional (21)

Caracas, Valencia, Maracay, Barquisimeto, Puerto La Cruz, Puerto Ordaz, Barinas, San Cristóbal, Mérida, Maracaibo, Acarigua, San Félix, Guanare, El Tigre, Cantaura, Puerto Cabello, Valera, Trujillo, Maturín, Upata, Valle la Pascua

### Métodos de pago (configurados en DB, no en código)

| Método | Moneda | Datos requeridos al cliente |
|---|---|---|
| Zelle | USD | Email o teléfono del titular, nombre del titular |
| Pago Móvil | Bs. | Banco origen, teléfono, CI del titular |
| Transferencia bancaria | Bs. | Banco, tipo de cuenta, número, titular, CI/RIF |
| USDT TRC20 | USD | Dirección de wallet (datos de la tienda) |
| Binance Pay | USD | Pay ID (datos de la tienda) |
| Efectivo | USD o Bs. | Solo para retiro en tienda |

Los datos bancarios reales (número de cuenta, wallet, Pay ID) se configuran desde el admin en `ApplicationSetting` o en la tabla `PaymentMethod` — nunca en código.

### Empresas de encomienda

Zoom, Tealca, MRW

### Municipios de Carabobo con delivery a domicilio (14)

Valencia, Naguanagua, San Diego, Libertador, Los Guayos, Guacara, San Joaquín, Bejuma, Montalbán, Miranda, Puerto Cabello, Carlos Arvelo, Diego Ibarra, Juan José Mora

### Tarifas base de envío

| Tipo | Monto |
|---|---|
| Envío estándar nacional | $5 USD |
| Envío express nacional | $10 USD |
| Umbral envío gratis | $80 USD en subtotal |
| Retiro en tienda | Gratis |
| Delivery a domicilio Carabobo | Configurable por municipio en DB |

Estos valores van como `ApplicationSetting` editables desde admin — son el valor por defecto del seed, no constantes del código.

### Datos de configuración de la tienda (seed)

```
nombre: 'Savaya'
tagline: 'Marca tu moda'
whatsapp: '584141100100'
email: 'Savayarrss@gmail.com'
instagram: '@Savayavzla'
direccion: 'Calle 73, CC Multi Tienda God is Good, local A-4, Valencia, Carabobo'
currency: 'USD'
reserva_parcial_porcentajes: [20, 35, 50]
reserva_inventario_horas: 24     # configurable, no hardcodeado
umbral_stock_bajo: 3             # configurable, no hardcodeado
prefijo_numero_pedido: 'SAV'
```
