# SECURITY.md — Decisiones de seguridad de SAVAYA

> Última actualización: 2026-08-15

---

## 1. Autenticación

- **Librería:** Auth.js v5 (NextAuth)
- **Estrategia:** credentials (email + password) con verificación de email obligatoria antes de poder iniciar sesión
- **Cookies de sesión:**
  - `HttpOnly` — inaccesible desde JavaScript del cliente
  - `Secure` — solo en HTTPS
  - `SameSite=Lax` — protección CSRF para la mayoría de casos sin romper flujos normales de navegación
  - Expiración configurable: más corta para el admin (8h de inactividad) que para el storefront (30 días)
- **Rotación de sesión:** la sesión se rota (nuevo token generado) en cada inicio de sesión — protección contra session fixation
- **Reset de password:** token de un solo uso con expiración de 1 hora, enviado por email. Rate limiting en el endpoint de solicitud.
- **Protección contra session fixation:** Auth.js v5 gestiona la rotación automáticamente en el flujo de credentials

---

## 2. RBAC (Control de acceso basado en roles)

### Principio fundamental

La autorización se verifica en servidor en cada server action y route handler que lo requiera. **Nunca es suficiente ocultar un botón en el cliente.** Si un usuario sin permisos llama directamente a un server action, debe recibir un error de autorización.

### Roles del sistema

| Rol | Descripción |
|---|---|
| Super Admin | Acceso total. 2FA obligatorio. |
| Admin | Acceso completo excepto gestión de otros admins. 2FA obligatorio. |
| Catálogo | Crear/editar productos, categorías, colecciones. |
| Inventario | Registrar movimientos de stock, ver alertas. |
| Ventas | Ver y gestionar pedidos, verificar pagos. |
| Finanzas | Ver reportes financieros, aprobar pagos. |
| Atención al Cliente | Ver clientes, pedidos, añadir notas. |
| Marketing | Gestionar banners, popups, promociones, cupones. |
| Analista | Solo lectura en analytics y reportes. |

### Verificación de permisos en actions

```ts
// Patrón estándar en toda action del admin
export async function approvePayment(orderId: string) {
  const session = await getServerSession()
  if (!session) throw new UnauthorizedError()

  await requirePermission(session.user.id, 'orders:approve_payment')
  // ... lógica de negocio
}
```

La función `requirePermission` consulta la tabla `UserRole` → `RolePermission` → `Permission` y lanza si el usuario no tiene el permiso requerido.

---

## 3. 2FA (Autenticación de dos factores)

- **Tipo:** TOTP (Time-based One-Time Password) compatible con Google Authenticator, Authy, 1Password
- **Obligatorio para:** Super Admin y Admin
- **Opcional para:** otros roles (recomendado pero no forzado inicialmente)
- **Enrolamiento:** al crear o elevar a Admin/Super Admin, el sistema obliga a configurar TOTP antes del primer acceso completo — pantalla de enrolamiento con QR
- **Verificación en login:** después de credentials válidos, se solicita el código TOTP. Sin código válido, la sesión no se completa
- **TOTP secret:** almacenado en la columna `totp_secret` de la tabla `User`, encriptado en reposo (no almacenado en texto plano)
- **Códigos de recuperación:** se generan al enrolar, almacenados como hashes, de un solo uso — para el caso de pérdida del dispositivo

---

## 4. Acciones de alto riesgo que requieren reautenticación

Estas acciones requieren que el usuario introduzca su password (y código TOTP si aplica) nuevamente, incluso con sesión activa. La lista completa está definida en un único lugar del código (`domains/auth/high-risk-actions.ts`):

| Acción | Permiso requerido |
|---|---|
| Cambiar el rol de otro usuario | `users:change_role` |
| Revocar acceso de un usuario | `users:revoke_access` |
| Aprobar un pago | `orders:approve_payment` |
| Rechazar un pago | `orders:reject_payment` |
| Cambiar datos bancarios / instrucciones de pago | `settings:edit_payment_methods` |
| Cambiar claves de integración (Cloudinary, Meta, GA4) | `settings:edit_integrations` |
| Override manual de tasa de cambio BCV | `settings:override_exchange_rate` |
| Eliminar un producto permanentemente | `catalog:delete_product` |
| Emitir una devolución (REFUNDED) | `orders:issue_refund` |

---

## 5. Rate limiting (Upstash Redis)

Upstash Redis con `@upstash/ratelimit`. El límite se aplica por IP y en algunos casos también por usuario autenticado. No hay rate limiter in-memory — eso no funciona en entorno serverless (lección aprendida de `savaya-tienda`).

| Endpoint | Límite por IP | Ventana | Notas |
|---|---|---|---|
| `POST /api/auth/signin` | 10 intentos | 15 min | Bloqueo progresivo después de 5 |
| `POST /api/auth/register` | 5 intentos | 1 hora | |
| `POST /api/auth/forgot-password` | 3 intentos | 1 hora | |
| `POST /api/auth/reset-password` | 5 intentos | 1 hora | |
| Server action: `createOrder` | 5 pedidos | 1 hora | Por IP + por userId |
| Server action: `attachProof` (upload comprobante) | 10 uploads | 1 hora | Por IP + por orderId |
| `GET /api/search` | 60 requests | 1 min | Público |
| APIs públicas del storefront | 100 requests | 1 min | |
| Server action: `applyCoupon` | 20 intentos | 1 hora | Por userId |
| Login del admin (`/admin`) | 5 intentos | 10 min | Más estricto que storefront |
| `POST /api/cron/*` | Solo con `CRON_SECRET` | N/A | Header de autenticación |

---

## 6. Validación de inputs

- **Zod en toda entrada de datos**, tanto en client-side (para feedback inmediato en formularios) como en server-side (para la validación real que importa)
- **Nunca confiar en datos del cliente:** precio, total, descuento, stock, rol, `shippingCost`, estado de pago, `userId`, `orderId` del scope ajeno
- **Validación en server action, siempre:** aunque un formulario tenga validación en React Hook Form + Zod, el server action vuelve a validar el schema antes de procesar
- **Los schemas de Zod son la única fuente de verdad** para la forma de cada input — se definen en `domains/*/validators.ts` y se reutilizan entre cliente y servidor

### Lo que NO se valida en cliente porque es suficiente en servidor

Estos valores se ignoran si vienen en el payload del cliente — el servidor los recalcula o los obtiene de la DB:

- Precio de producto o variante
- Total del carrito
- Monto de descuento / cupón
- `shippingCost` (se calcula desde `ShippingZone` / `ShippingRate` en DB)
- Estado del pedido
- Rol del usuario
- Stock disponible (se lee de `Inventory` en la misma transacción)

---

## 7. Comprobantes de pago

Los comprobantes son documentos financieros sensibles y nunca pueden ser accesibles públicamente.

- **Carpeta Cloudinary:** `savaya/private/payment-proofs` — tipo `private`/`authenticated`
- **Upload firmado:** el cliente nunca sube directamente con credenciales de Cloudinary. El server action `payment-proofs/actions.ts → getUploadSignature()` genera una firma con expiración de 5 minutos. El cliente usa esa firma para subir directo a Cloudinary sin pasar por el servidor de la app
- **Nombre no predecible:** el nombre del archivo en Cloudinary se genera como `proof-{orderId}-{randomUUID}` — no hay manera de adivinar la URL por fuerza bruta
- **URL firmada temporal:** para que un admin vea el comprobante, el server action genera una URL firmada de Cloudinary con expiración de 15 minutos. No hay URL permanente. Si la URL expira, el admin la solicita de nuevo
- **MIME y extensión:** validación real de tipo MIME (no solo extensión) en el servidor antes de generar la firma de upload. Solo se aceptan: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- **Tamaño máximo:** 10 MB por comprobante

---

## 8. SQL y base de datos

- **Drizzle ORM parametrizado siempre:** todas las queries usan el query builder de Drizzle o la función `sql` con placeholders — nunca concatenación manual de strings SQL
- **Sin raw SQL con interpolación de variables:** si se necesita SQL custom (ej. para `tsvector`), se usa el tagged template de Drizzle que parametriza automáticamente
- **RLS de Supabase:** como segunda capa de defensa, las tablas más sensibles (`AuditLog`, `PaymentProof`) pueden tener Row Level Security de Supabase configurado, aunque la primera línea de defensa es siempre el código de aplicación

---

## 9. Headers de seguridad

Configurados en `next.config.ts` para todas las rutas. No en modo `report-only` en producción.

| Header | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'nonce-{nonce}' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; connect-src 'self' https://api.cloudinary.com https://www.google-analytics.com` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-Frame-Options` | `DENY` (redundante con `frame-ancestors 'none'` en CSP, se incluye para compatibilidad) |

**Nota sobre CSP y Meta Pixel:** el script de Meta Pixel se inyecta con un `nonce` generado por el middleware de Next.js para cada request — no con `'unsafe-inline'` global. Esto es más seguro que la implementación de `savaya-tienda` que usaba `'unsafe-inline'`.

---

## 10. AuditLog

### Acciones que se registran

| Acción | Actor | Datos guardados |
|---|---|---|
| Login exitoso de admin | User | IP, timestamp |
| Intento de login fallido (admin) | email (puede no ser User) | IP, timestamp, razón |
| Creación de pedido | Customer | orderId, total, método de pago |
| Aprobación de pago | User (admin) | orderId, paymentProofId, IP |
| Rechazo de pago | User (admin) | orderId, motivo, IP |
| Transición de estado de pedido | User (admin) | orderId, estado anterior, estado nuevo, motivo |
| Override manual de tasa de cambio | User (admin) | tasa anterior, tasa nueva, motivo, IP |
| Cambio de rol de usuario | User (admin) | targetUserId, rol anterior, rol nuevo, IP |
| Revocación de acceso | User (admin) | targetUserId, IP |
| Cambio de datos bancarios | User (admin) | método de pago afectado, IP (sin los datos en texto plano) |
| Ajuste manual de inventario | User (admin) | variantId, cantidad, tipo de movimiento, motivo |
| Emisión de devolución | User (admin) | orderId, monto, motivo |
| Eliminación de producto | User (admin) | productId, nombre del producto |

### Campos del AuditLog

```ts
{
  id: uuid,
  actor_id: uuid,            // userId del admin que ejecutó la acción
  actor_email: string,       // email denormalizado (por si el usuario se elimina)
  action: string,            // 'orders:approve_payment', 'settings:override_exchange_rate', etc.
  entity_type: string,       // 'Order', 'User', 'ExchangeRate', etc.
  entity_id: string,         // ID de la entidad afectada
  before: jsonb | null,      // estado antes (solo campos relevantes, nunca passwords)
  after: jsonb | null,       // estado después
  ip_address: string,
  created_at: timestamp,
}
```

`before` y `after` nunca incluyen passwords, tokens ni claves de API — solo los campos de negocio relevantes para la auditoría.

---

## 11. Secretos y variables de entorno

- **Nunca en código:** ningún secret, API key, token, password ni connection string va en el código fuente ni en archivos commiteados
- **`.env.local` en `.gitignore`:** siempre. El repositorio no debe contener nunca un `.env.local`
- **`.env.example`:** existe con todas las variables listadas y con valores de ejemplo no reales (`DATABASE_URL=postgresql://user:pass@host:5432/db`)
- **En Vercel:** todas las variables de entorno se configuran en el dashboard de Vercel por entorno (Production, Preview, Development) — no se pasan en el código del deploy
- **Acceso a secrets solo desde servidor:** `META_CAPI_ACCESS_TOKEN`, `CLOUDINARY_API_SECRET`, `AUTH_SECRET`, `UPSTASH_REDIS_REST_TOKEN` nunca se exponen al cliente. Solo las variables `NEXT_PUBLIC_*` son accesibles desde el bundle del browser, y solo van variables que son públicas por naturaleza (GA4 ID, Meta Pixel ID, URL de la app)
