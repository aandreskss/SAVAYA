'use client'

import { useState, useTransition } from 'react'
import { Button, Modal, Badge } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { setUserRolesAction } from '../actions'
import type { AdminUser, AdminRole } from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  catalog: 'Catálogo',
  inventory: 'Inventario',
  sales: 'Ventas',
  finance: 'Finanzas',
  customer_service: 'Atención al cliente',
  marketing: 'Marketing',
  analyst: 'Analista',
}

const ROLE_BADGE: Record<string, 'warning' | 'error' | 'gold' | 'success' | 'outline'> = {
  super_admin: 'error',
  admin: 'warning',
  catalog: 'gold',
  inventory: 'gold',
  sales: 'success',
  finance: 'success',
  customer_service: 'outline',
  marketing: 'outline',
  analyst: 'outline',
}

// ---------------------------------------------------------------------------
// Role edit modal
// ---------------------------------------------------------------------------

function RoleModal({
  user,
  allRoles,
  isSuperAdmin,
  onSave,
  onClose,
  isPending,
}: {
  user: AdminUser
  allRoles: AdminRole[]
  isSuperAdmin: boolean
  onSave: (userId: string, roleIds: string[]) => void
  onClose: () => void
  isPending: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(user.roles.map((r) => r.roleId)),
  )

  function toggle(roleId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{user.email}</p>
        {user.name && <p className="text-xs text-text-secondary">{user.name}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {allRoles.map((role) => {
          const isSuperAdminRole = role.name === 'super_admin'
          const disabled = isSuperAdminRole && !isSuperAdmin
          return (
            <label
              key={role.id}
              className={`flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer select-none transition-colors ${
                selected.has(role.id) ? 'bg-accent-gold/5 border-accent-gold/30' : 'hover:bg-surface-2'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected.has(role.id)}
                onChange={() => !disabled && toggle(role.id)}
                className="mt-0.5 w-4 h-4 accent-[var(--color-accent-gold)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {ROLE_LABELS[role.name] ?? role.name}
                  </span>
                  {isSuperAdminRole && (
                    <Badge variant="error" size="sm">Solo super_admin</Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-text-secondary mt-0.5">{role.description}</p>
                )}
              </div>
            </label>
          )
        })}
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          isLoading={isPending}
          onClick={() => onSave(user.id, [...selected])}
        >
          Guardar roles
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// UsersManager
// ---------------------------------------------------------------------------

type Props = {
  initialUsers: AdminUser[]
  allRoles: AdminRole[]
  currentUserId: string
  isSuperAdmin: boolean
}

export function UsersManager({ initialUsers, allRoles, currentUserId, isSuperAdmin }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave(userId: string, roleIds: string[]) {
    startTransition(async () => {
      const res = await setUserRolesAction(userId, roleIds)
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u
            const newRoles = allRoles
              .filter((r) => roleIds.includes(r.id))
              .map((r) => ({ roleId: r.id, roleName: r.name, assignedAt: new Date() }))
            return { ...u, roles: newRoles }
          }),
        )
        setEditingUser(null)
        toast.success('Roles actualizados')
      } else {
        toast.error(res.error)
      }
    })
  }

  const adminUsers = users.filter((u) => u.roles.length > 0)
  const noRoleUsers = users.filter((u) => u.roles.length === 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-wide">Usuarios</h1>
        <p className="text-sm text-text-secondary mt-1">
          {adminUsers.length} {adminUsers.length === 1 ? 'administrador' : 'administradores'} ·{' '}
          {noRoleUsers.length} sin rol
        </p>
      </div>

      {/* Admin users table */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Con acceso admin
        </p>
        {adminUsers.length === 0 ? (
          <div className="border border-border border-dashed rounded-xl p-8 text-center text-text-secondary text-sm">
            Sin administradores configurados.
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Usuario
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Roles
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {adminUsers.map((u) => {
                  const isYou = u.id === currentUserId
                  return (
                    <tr key={u.id} className="bg-surface">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">
                          {u.name ?? u.email}
                          {isYou && (
                            <span className="ml-2 text-xs text-text-secondary">(tú)</span>
                          )}
                        </p>
                        {u.name && (
                          <p className="text-xs text-text-secondary">{u.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge
                              key={r.roleId}
                              variant={ROLE_BADGE[r.roleName] ?? 'outline'}
                              size="sm"
                            >
                              {ROLE_LABELS[r.roleName] ?? r.roleName}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isYou && (
                          <button
                            onClick={() => setEditingUser(u)}
                            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                          >
                            Gestionar roles
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users without roles */}
      {noRoleUsers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Sin rol admin ({noRoleUsers.length})
          </p>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Nombre
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {noRoleUsers.map((u) => {
                  const isYou = u.id === currentUserId
                  return (
                    <tr key={u.id} className="bg-surface">
                      <td className="px-4 py-2.5 text-text-secondary text-xs">
                        {u.email}
                        {isYou && (
                          <span className="ml-2 text-text-secondary/50">(tú)</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary text-xs">
                        {u.name ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!isYou && (
                          <button
                            onClick={() => setEditingUser(u)}
                            className="text-xs text-accent-gold hover:text-accent-gold/80 px-2 py-1 rounded transition-colors"
                          >
                            Asignar rol
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role modal */}
      <Modal
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title="Gestionar roles"
        size="md"
      >
        {editingUser && (
          <RoleModal
            user={editingUser}
            allRoles={allRoles}
            isSuperAdmin={isSuperAdmin}
            onSave={handleSave}
            onClose={() => setEditingUser(null)}
            isPending={isPending}
          />
        )}
      </Modal>
    </div>
  )
}
