import { db } from '@/shared/lib/db'
import { users } from '@/domains/auth/schema'
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
