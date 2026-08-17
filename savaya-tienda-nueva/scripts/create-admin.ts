/**
 * SAVAYA — Create first admin user
 *
 * Creates a super_admin user in the production database.
 * Must be run AFTER the seed (which creates roles/permissions).
 *
 * Usage:
 *   ADMIN_EMAIL=andre@example.com \
 *   ADMIN_PASSWORD=YourSecurePassword123! \
 *   ADMIN_NAME="André Casadiego" \
 *   DATABASE_URL=your_connection_string \
 *   npx tsx scripts/create-admin.ts
 *
 * Or set env vars in .env.local and run:
 *   npx tsx scripts/create-admin.ts
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { users, accounts } from '@/domains/auth/schema'
import { roles, userRoles } from '@/domains/roles-permissions/schema'

// ---------------------------------------------------------------------------
// Config from env
// ---------------------------------------------------------------------------

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME ?? 'Admin SAVAYA'

if (!email || !password) {
  console.error('❌ Faltan variables de entorno requeridas:')
  console.error('   ADMIN_EMAIL — email del administrador')
  console.error('   ADMIN_PASSWORD — contraseña (mínimo 8 caracteres)')
  console.error('   ADMIN_NAME — nombre completo (opcional, por defecto "Admin SAVAYA")')
  process.exit(1)
}

if (password.length < 8) {
  console.error('❌ La contraseña debe tener al menos 8 caracteres.')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurado.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// DB
// ---------------------------------------------------------------------------

const client = postgres(process.env.DATABASE_URL, { max: 1 })
const db = drizzle(client)

async function main() {
  console.log('🔐 SAVAYA — Creando usuario administrador...')
  console.log(`   Email: ${email}`)
  console.log(`   Nombre: ${name}`)
  console.log(`   Rol: super_admin`)
  console.log()

  // Guard: check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email!))
    .limit(1)

  if (existing) {
    console.error(`❌ Ya existe un usuario con el email ${email}.`)
    console.error('   Si quieres cambiar su rol, usa el panel de admin en /admin/usuarios.')
    process.exit(1)
  }

  // Find super_admin role
  const [superAdminRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, 'super_admin'))
    .limit(1)

  if (!superAdminRole) {
    console.error('❌ No se encontró el rol super_admin en la base de datos.')
    console.error('   Asegúrate de haber ejecutado el seed primero:')
    console.error('   npx tsx src/shared/lib/seed.ts --production')
    process.exit(1)
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password!, 12)

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({ email: email!, name })
    .returning({ id: users.id })

  // Store credentials (password hash in access_token — Auth.js credentials convention)
  await db.insert(accounts).values({
    userId: newUser.id,
    type: 'credentials',
    provider: 'credentials',
    providerAccountId: newUser.id,
    access_token: passwordHash,
  })

  // Assign super_admin role
  await db.insert(userRoles).values({
    userId: newUser.id,
    roleId: superAdminRole.id,
    assignedBy: newUser.id,
  })

  console.log('✅ Administrador creado exitosamente.')
  console.log()
  console.log('📋 Próximos pasos:')
  console.log(`   1. Ir a https://www.savayavzla.com/admin/login`)
  console.log(`   2. Iniciar sesión con ${email}`)
  console.log('   3. El sistema te pedirá configurar 2FA (TOTP) al primer login de admin')
  console.log('   4. Configura los datos de métodos de pago en /admin/configuracion')
  console.log('   5. Carga el catálogo en /admin/productos')

  await client.end()
}

main().catch((err) => {
  console.error('❌ Error al crear administrador:', err)
  process.exit(1)
})
