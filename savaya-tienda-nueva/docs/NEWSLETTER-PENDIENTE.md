# Newsletter — Pasos pendientes para activar

La integración con Resend Audiences está implementada en el código y la
tabla `newsletter_subscribers` ya fue creada en Neon (migración 0011 ✅).
Solo faltan estos dos pasos manuales para que el newsletter funcione en producción.

---

## ✅ Paso 3 — Migración en Neon (HECHO)

Tabla `newsletter_subscribers` creada. Los emails se guardarán aquí cuando
los pasos 1 y 2 estén completos.

---

## ⏳ Paso 1 — Crear el Audience en Resend (PENDIENTE)

1. Entra a **resend.com** → sección **Audiences**
2. Clic en **Create Audience**
3. Nombre sugerido: `SAVAYA Newsletter`
4. Copia el **Audience ID** que genera (formato UUID)

---

## ⏳ Paso 2 — Agregar la variable de entorno (PENDIENTE)

Con el Audience ID del paso anterior:

**En Vercel** (producción):
- Proyecto `savaya-tienda-nueva` → Settings → Environment Variables
- Agrega: `RESEND_AUDIENCE_ID = <audience-id>`
- Redeploy para que tome efecto

**En `.env.local`** (desarrollo local):
```
RESEND_AUDIENCE_ID=<audience-id>
```

---

## Qué pasa cuando esté completo

- Cada email suscrito desde la tienda queda en la tabla `newsletter_subscribers` de Neon
- El contacto se agrega automáticamente al Audience de Resend
- Desde Resend puedes enviar broadcasts/campañas a toda la lista cuando quieras
- Si alguien intenta suscribirse con un email ya registrado, recibe un success silencioso (no se duplica)
