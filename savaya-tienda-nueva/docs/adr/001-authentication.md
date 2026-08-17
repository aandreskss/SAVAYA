# ADR-001: Auth.js v5 con credentials + 2FA TOTP para administradores

## Estado

Decidido

## Contexto

SAVAYA necesita dos niveles de autenticación con requisitos distintos:

1. **Clientes de la tienda:** registro simple, login con email/password, reset de password, sesión persistente. No requieren 2FA.
2. **Usuarios admin (staff):** acceso a pedidos, pagos, productos, inventario, datos de clientes. Algunos aprueban pagos y tienen acceso a información financiera sensible. Requieren 2FA.

`savaya-tienda` usaba Supabase Auth para ambos. Al auditar, se encontró que los usuarios de Supabase Auth están acoplados al SDK de Supabase JS (`@supabase/supabase-js`), que se descarta en `savaya-tienda-nueva` (la nueva tienda conecta directamente a Postgres via Drizzle). Adicionalmente, Supabase Auth no ofrece TOTP de segunda capa sin pasar por su flujo MFA propio, que no se integra limpiamente con un RBAC personalizado.

Se decidió arrancar con tablas de autenticación limpias — los usuarios admin de `savaya-tienda` no se migran. Se crea un Super Admin nuevo en el seed inicial.

## Decisión

**Auth.js v5 (NextAuth) con credentials provider.**

- Sesiones en cookies `HttpOnly`, `Secure`, `SameSite=Lax`, con rotación en cada login
- TOTP obligatorio para roles Super Admin y Admin (enrolamiento al crear el usuario admin)
- Rate limiting en login, registro y reset via Upstash (no in-memory — lección aprendida de `savaya-tienda`)
- Reautenticación (password + TOTP) requerida para acciones de alto riesgo (ver `SECURITY.md`)
- Los clientes de la tienda se autentican con el mismo sistema pero sin 2FA requerido

## Alternativas consideradas

### Supabase Auth (descartado)

Supabase Auth es la solución que usaba `savaya-tienda`. Se descarta por:
- Requiere `@supabase/supabase-js` en el proyecto, que se descarta en favor de conexión directa Drizzle. Usar ambas conexiones (SDK + Drizzle) sería overhead sin beneficio.
- El MFA de Supabase (TOTP) está disponible pero se gestiona a través de su propia API — no se integra limpiamente con un RBAC propio implementado en tablas de Drizzle.
- El control de sesión (duración, rotación, invalidación) es menos granular que con Auth.js en modo sessions.

### Clerk (descartado)

Clerk ofrece TOTP, RBAC y una UI prebuilt de buena calidad.
- **Costo:** Clerk cobra por MAU (Monthly Active Users). Para un admin con pocos usuarios internos es razonable, pero para los clientes de la tienda el costo escala con el volumen y crea una dependencia de vendor lock-in en una parte crítica del sistema.
- **Vendor lock-in:** toda la lógica de autenticación y sesiones dependería de Clerk. Migrar después sería costoso.
- Para el volumen y perfil de SAVAYA, la complejidad adicional de mantener Auth.js propio no supera el costo de dependencia de Clerk.

### NextAuth v4 (descartado en favor de v5)

Auth.js v5 tiene soporte nativo para App Router y server actions de Next.js 15/16. La v4 requería workarounds para App Router. No tiene sentido iniciar un proyecto nuevo con la versión anterior.

## Consecuencias

**Positivo:**
- Control total sobre el flujo de autenticación, sesiones y RBAC
- 2FA TOTP integrado sin dependencia de un proveedor externo
- Costo cero adicional — sin cobro por MAU
- Las cookies de sesión siguen la misma convención del resto de Next.js (funciona bien con middleware)

**Negativo / trade-offs:**
- Más código a mantener que con Supabase Auth o Clerk (las tablas `User`, `Session`, `VerificationToken` son responsabilidad del proyecto)
- El flujo de reset de password y verificación de email requiere implementación propia (con Resend como proveedor de email)
- Las sesiones de clientes y admins comparten el mismo sistema de Auth.js — hay que discriminar por rol al acceder a rutas del admin
