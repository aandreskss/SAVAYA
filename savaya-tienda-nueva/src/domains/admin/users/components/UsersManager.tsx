'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button, Modal, Badge } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { setUserRolesAction, createAdminUserAction, deleteAdminUserAction } from '../actions'
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

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold'

// ---------------------------------------------------------------------------
// Create user modal
// ---------------------------------------------------------------------------

function CreateUserModal({
  allRoles,
  isSuperAdmin,
  onCreated,
  onClose,
}: {
  allRoles: AdminRole[]
  isSuperAdmin: boolean
  onCreated: (user: AdminUser) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleRole(roleId: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    startTransition(async () => {
      const res = await createAdminUserAction({
        email,
        name: name || undefined,
        password,
        roleIds: [...selectedRoles],
      })
      if (res.success) {
        toast.success('Usuario creado')
        onCreated(res.data)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Nombre <span className="text-text-secondary/50">(opcional)</span>
          </label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: María González"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Email <span className="text-error">*</span>
          </label>
          <input
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>
      </div>

      {/* Passwords */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Contraseña <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`${inputCls} pr-10`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 8 caracteres"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Confirmar contraseña <span className="text-error">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            className={`${inputCls} ${confirm && confirm !== password ? 'border-error' : ''}`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            required
          />
          {confirm && confirm !== password && (
            <p className="text-[11px] text-error mt-1">Las contraseñas no coinciden</p>
          )}
        </div>
      </div>

      {/* Roles */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">
          Roles asignados
        </label>
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
          {allRoles.map((role) => {
            const isSuperAdminRole = role.name === 'super_admin'
            const disabled = isSuperAdminRole && !isSuperAdmin
            return (
              <label
                key={role.id}
                className={`flex items-start gap-3 p-2.5 border border-border rounded-lg cursor-pointer select-none transition-colors ${
                  selectedRoles.has(role.id) ? 'bg-accent-gold/5 border-accent-gold/30' : 'hover:bg-surface-2'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selectedRoles.has(role.id)}
                  onChange={() => !disabled && toggleRole(role.id)}
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
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          isLoading={isPending}
          disabled={!email || !password || password !== confirm}
        >
          Crear usuario
        </Button>
      </div>
    </form>
  )
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
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()

  function handleCreated(user: AdminUser) {
    setUsers((prev) => [user, ...prev])
    setCreateModalOpen(false)
  }

  function handleDelete(userId: string) {
    startDeleteTransition(async () => {
      const res = await deleteAdminUserAction(userId)
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        setConfirmDeleteId(null)
        toast.success('Usuario eliminado')
      } else {
        toast.error(res.error)
      }
    })
  }

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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Usuarios</h1>
          <p className="text-sm text-text-secondary mt-1">
            {adminUsers.length} {adminUsers.length === 1 ? 'administrador' : 'administradores'} ·{' '}
            {noRoleUsers.length} sin rol
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          + Nuevo usuario
        </Button>
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
                          confirmDeleteId === u.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-xs text-text-secondary">¿Eliminar?</span>
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={deletePending}
                                className="text-xs font-medium text-error hover:text-error/80 px-2 py-1 rounded transition-colors disabled:opacity-50"
                              >
                                {deletePending ? '...' : 'Sí'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setEditingUser(u)}
                                className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                              >
                                Gestionar roles
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                aria-label="Eliminar usuario"
                                className="p-1 rounded text-text-muted hover:text-error transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </span>
                          )
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
                          confirmDeleteId === u.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-xs text-text-secondary">¿Eliminar?</span>
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={deletePending}
                                className="text-xs font-medium text-error hover:text-error/80 px-2 py-1 rounded transition-colors disabled:opacity-50"
                              >
                                {deletePending ? '...' : 'Sí'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setEditingUser(u)}
                                className="text-xs text-accent-gold hover:text-accent-gold/80 px-2 py-1 rounded transition-colors"
                              >
                                Asignar rol
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                aria-label="Eliminar usuario"
                                className="p-1 rounded text-text-muted hover:text-error transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </span>
                          )
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

      {/* Create user modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Nuevo usuario"
        size="lg"
      >
        <CreateUserModal
          allRoles={allRoles}
          isSuperAdmin={isSuperAdmin}
          onCreated={handleCreated}
          onClose={() => setCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
