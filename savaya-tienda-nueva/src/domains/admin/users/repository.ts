import { db } from '@/shared/lib/db'
import { users, accounts } from '@/domains/auth/schema'
import { roles, userRoles } from '@/domains/roles-permissions/schema'
import { asc, eq, inArray, and } from 'drizzle-orm'
import type { AdminUser, AdminRole } from './types'

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listAdminUsers(): Promise<AdminUser[]> {
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.email))

  if (allUsers.length === 0) return []

  const userIds = allUsers.map((u) => u.id)

  const roleRows = await db
    .select({
      userId: userRoles.userId,
      roleId: roles.id,
      roleName: roles.name,
      assignedAt: userRoles.assignedAt,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(inArray(userRoles.userId, userIds))

  const rolesByUser = new Map<string, AdminUser['roles']>()
  for (const r of roleRows) {
    if (!rolesByUser.has(r.userId)) rolesByUser.set(r.userId, [])
    rolesByUser.get(r.userId)!.push({
      roleId: r.roleId,
      roleName: r.roleName,
      assignedAt: r.assignedAt,
    })
  }

  return allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    roles: rolesByUser.get(u.id) ?? [],
  }))
}

export async function listRoles(): Promise<AdminRole[]> {
  const rows = await db
    .select({ id: roles.id, name: roles.name, description: roles.description })
    .from(roles)
    .orderBy(asc(roles.name))

  return rows.map((r) => ({ id: r.id, name: r.name, description: r.description ?? null }))
}

// ---------------------------------------------------------------------------
// Role assignment (replace full set for a user)
// ---------------------------------------------------------------------------

export async function setUserRoles(
  targetUserId: string,
  newRoleIds: string[],
  assignedById: string,
): Promise<void> {
  const currentRoles = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, targetUserId))

  const currentIds = new Set(currentRoles.map((r) => r.roleId))
  const newIds = new Set(newRoleIds)

  const toRemove = [...currentIds].filter((id) => !newIds.has(id))
  const toAdd = [...newIds].filter((id) => !currentIds.has(id))

  if (toRemove.length > 0) {
    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, targetUserId),
          inArray(userRoles.roleId, toRemove),
        ),
      )
  }

  if (toAdd.length > 0) {
    await db.insert(userRoles).values(
      toAdd.map((roleId) => ({
        userId: targetUserId,
        roleId,
        assignedBy: assignedById,
      })),
    )
  }
}

// ---------------------------------------------------------------------------
// Create admin user
// ---------------------------------------------------------------------------

export async function createAdminUser(
  email: string,
  name: string | null,
  passwordHash: string,
  roleIds: string[],
  assignedById: string,
): Promise<AdminUser> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) throw new Error('EMAIL_TAKEN')

  const [newUser] = await db
    .insert(users)
    .values({ email, name })
    .returning({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })

  await db.insert(accounts).values({
    userId: newUser.id,
    type: 'credentials',
    provider: 'credentials',
    providerAccountId: newUser.id,
    access_token: passwordHash,
  })

  if (roleIds.length > 0) {
    await db.insert(userRoles).values(
      roleIds.map((roleId) => ({ userId: newUser.id, roleId, assignedBy: assignedById })),
    )

    const assignedRoles = await db
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(inArray(roles.id, roleIds))

    return {
      id: newUser.id,
      name: newUser.name ?? null,
      email: newUser.email,
      createdAt: newUser.createdAt,
      roles: assignedRoles.map((r) => ({ roleId: r.id, roleName: r.name, assignedAt: new Date() })),
    }
  }

  return {
    id: newUser.id,
    name: newUser.name ?? null,
    email: newUser.email,
    createdAt: newUser.createdAt,
    roles: [],
  }
}

// ---------------------------------------------------------------------------
// Delete user (cascades to accounts, sessions, userRoles, 2FA)
// ---------------------------------------------------------------------------

export async function deleteAdminUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId))
}

// ---------------------------------------------------------------------------
// Check if a user is super_admin
// ---------------------------------------------------------------------------

export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const rows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))

  return rows.some((r) => r.roleName === 'super_admin')
}
