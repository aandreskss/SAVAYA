// ---------------------------------------------------------------------------
// RBAC service — permission and re-authentication checks
// ---------------------------------------------------------------------------
// All authorization logic lives here. Never rely on client-sent roles or
// permissions. Always re-query the database from the session userId.

import { auth } from '@/domains/auth/auth'
import { db } from '@/shared/lib/db'
import { userRoles, rolePermissions, permissions as permissionsTable } from '@/domains/roles-permissions/schema'
import { eq, inArray } from 'drizzle-orm'
import type { PermissionSlug } from '@/domains/roles-permissions/permissions'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class UnauthorizedError extends Error {
  readonly status = 401
  constructor(message = 'No autenticado') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  readonly status = 403
  constructor(message = 'No tienes permiso para realizar esta acción') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ReauthRequiredError extends Error {
  readonly status = 403
  constructor(message = 'Esta acción requiere reautenticación reciente') {
    super(message)
    this.name = 'ReauthRequiredError'
  }
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Returns all permission slugs assigned to a user via their roles.
 * Queries userRoles → rolePermissions → permissions.
 */
async function getUserPermissions(userId: string): Promise<PermissionSlug[]> {
  // 1. Get all role IDs for this user
  const userRoleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))

  if (userRoleRows.length === 0) return []

  const roleIds = userRoleRows.map((r) => r.roleId)

  // 2. Get all permission IDs for those roles
  const rolePermRows = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(inArray(rolePermissions.roleId, roleIds))

  if (rolePermRows.length === 0) return []

  const permissionIds = rolePermRows.map((r) => r.permissionId)

  // 3. Get permission slugs (resource:action)
  const permRows = await db
    .select({ resource: permissionsTable.resource, action: permissionsTable.action })
    .from(permissionsTable)
    .where(inArray(permissionsTable.id, permissionIds))

  return permRows.map((p) => `${p.resource}:${p.action}` as PermissionSlug)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the user has the given permission slug.
 * Queries the DB directly — never trusts the session token payload for
 * authorization decisions (the token could be stale).
 */
export async function hasPermission(
  userId: string,
  permission: PermissionSlug,
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId)
  return userPerms.includes(permission)
}

/**
 * Asserts that the currently authenticated user has the given permission.
 * Throws UnauthorizedError (401) if there is no session.
 * Throws ForbiddenError (403) if the user lacks the permission.
 *
 * Call at the top of every server action that requires authorization:
 * @example
 * export async function approvePayment(orderId: string) {
 *   await requirePermission('payments:approve')
 *   // ... business logic
 * }
 */
export async function requirePermission(permission: PermissionSlug): Promise<void> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new UnauthorizedError()
  }

  const allowed = await hasPermission(session.user.id, permission)
  if (!allowed) {
    throw new ForbiddenError()
  }
}

// ---------------------------------------------------------------------------
// Re-authentication guard
// ---------------------------------------------------------------------------

/** Duration (ms) within which a step-up reauth is still valid. */
const REAUTH_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Asserts that the user has recently re-authenticated (within 5 minutes).
 * The reauth timestamp is stored in the JWT token as `reauthAt`.
 *
 * Throws UnauthorizedError if there is no session.
 * Throws ReauthRequiredError if reauth is missing or has expired.
 */
export async function requireReauth(userId: string): Promise<void> {
  const session = await auth()

  if (!session?.user?.id || session.user.id !== userId) {
    throw new UnauthorizedError()
  }

  const reauthAt = (session as { user: { id: string; reauthAt?: number } }).user.reauthAt

  if (!reauthAt || Date.now() - reauthAt > REAUTH_WINDOW_MS) {
    throw new ReauthRequiredError()
  }
}
