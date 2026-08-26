'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import { CustomerTagsEditor } from './CustomerTagsEditor'
import { AddNoteForm } from './AddNoteForm'
import { CustomerTagBadge } from './CustomerTagBadge'
import { OrderStatusBadge } from '@/domains/admin/orders/components/OrderStatusBadge'
import {
  updateCustomerAction,
  setCustomerStatusAction,
  deleteCustomerAction,
} from '../actions'
import type { CustomerDetail, CustomerNote } from '../types'
import type { OrderStatus } from '@/domains/orders/state-machine'

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold'

export function CustomerDetailView({ customer }: { customer: CustomerDetail }) {
  const router = useRouter()
  const [notes, setNotes] = useState<CustomerNote[]>(customer.notes)

  // Editable fields kept in local state so header updates after save without reload
  const [info, setInfo] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    whatsapp: customer.whatsapp,
  })

  const [isActive, setIsActive] = useState(customer.isActive)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(info)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [editPending, startEditTransition] = useTransition()
  const [statusPending, startStatusTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()

  // ---------------------------------------------------------------------------

  function handleNoteAdded(note: CustomerNote) {
    setNotes((prev) => [note, ...prev])
  }

  function openEdit() {
    setEditForm(info)
    setEditOpen(true)
  }

  function handleEditSave(e: FormEvent) {
    e.preventDefault()
    startEditTransition(async () => {
      try {
        const res = await updateCustomerAction({
          customerId: customer.id,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone || null,
          whatsapp: editForm.whatsapp || null,
        })
        if (res.success) {
          setInfo(res.data)
          setEditOpen(false)
          toast.success('Datos actualizados')
        } else {
          toast.error(res.error)
        }
      } catch {
        toast.error('Error al guardar')
      }
    })
  }

  function handleStatusToggle() {
    const next = !isActive
    setIsActive(next)
    startStatusTransition(async () => {
      try {
        const res = await setCustomerStatusAction(customer.id, next)
        if (res.success) {
          toast.success(next ? 'Cliente activado' : 'Cliente bloqueado')
        } else {
          setIsActive(!next)
          toast.error(res.error)
        }
      } catch {
        setIsActive(!next)
        toast.error('Error al cambiar el estado')
      }
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        const res = await deleteCustomerAction(customer.id)
        if (res.success) {
          toast.success('Cliente eliminado')
          router.push('/admin/clientes')
        } else {
          setConfirmDelete(false)
          toast.error(res.error)
        }
      } catch {
        setConfirmDelete(false)
        toast.error('Error al eliminar el cliente')
      }
    })
  }

  // ---------------------------------------------------------------------------

  const lastOrderFormatted = customer.lastOrderAt
    ? new Date(customer.lastOrderAt).toLocaleDateString('es-VE', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left — name + contact */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/admin/clientes" className="text-text-secondary hover:text-text-primary text-sm">
              ← Clientes
            </Link>
            {!isActive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-error/10 text-error">
                Bloqueada
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl uppercase tracking-wide">
            {info.firstName} {info.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <a href={`mailto:${info.email}`} className="text-sm text-text-secondary hover:underline">
              {info.email}
            </a>
            {info.whatsapp && (
              <a
                href={`https://wa.me/${info.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-success hover:underline"
              >
                WA: {info.whatsapp}
              </a>
            )}
            {info.phone && !info.whatsapp && (
              <span className="text-sm text-text-secondary">{info.phone}</span>
            )}
          </div>
        </div>

        {/* Right — actions + tags */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openEdit}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Editar datos
            </button>

            <button
              onClick={handleStatusToggle}
              disabled={statusPending}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                isActive
                  ? 'border-error/30 text-error hover:bg-error/5'
                  : 'border-success/30 text-success hover:bg-success/5'
              }`}
            >
              {statusPending ? '...' : isActive ? 'Bloquear' : 'Activar'}
            </button>

            {confirmDelete ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-xs text-text-secondary">¿Eliminar?</span>
                <button
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="text-xs font-medium text-error hover:text-error/80 px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  {deletePending ? '...' : 'Sí'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Eliminar cliente"
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-error hover:border-error/30 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {customer.tags.map((tag) => (
              <CustomerTagBadge key={tag} tag={tag} size="md" />
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Total gastado" value={`$${customer.totalSpentUsd}`} />
        <KPICard label="Pedidos" value={String(customer.totalOrders)} />
        <KPICard label="Ticket promedio" value={`$${customer.avgTicketUsd}`} />
        <KPICard label="Último pedido" value={lastOrderFormatted ?? '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left — orders + addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent orders */}
          <section className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-medium">Pedidos recientes</h2>
            </div>
            {customer.recentOrders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-text-secondary">Sin pedidos registrados.</p>
            ) : (
              <ul className="divide-y divide-border">
                {customer.recentOrders.map((order) => (
                  <li key={order.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div>
                      <Link
                        href={`/admin/pedidos/${order.orderNumber}`}
                        className="font-mono text-xs font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-text-secondary">
                        {order.itemCount} artículo{order.itemCount !== 1 ? 's' : ''} ·{' '}
                        {new Date(order.createdAt).toLocaleDateString('es-VE', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium">${order.totalUsd}</p>
                        <p className="text-xs text-text-secondary">Bs. {order.totalBs}</p>
                      </div>
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Addresses */}
          {customer.addresses.length > 0 && (
            <section className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-medium mb-3">Direcciones</h2>
              <ul className="space-y-3">
                {customer.addresses.map((addr) => (
                  <li key={addr.id} className="flex gap-3 text-sm">
                    <div className="shrink-0 mt-0.5">
                      <span className="text-xs bg-surface-2 border border-border px-2 py-0.5 rounded-pill capitalize">
                        {addr.label}
                      </span>
                    </div>
                    <div className="text-text-secondary">
                      {addr.address} · {addr.city}, {addr.state}
                      {addr.isDefault && (
                        <span className="ml-2 text-xs text-success">predeterminada</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right — tags + notes */}
        <div className="space-y-6">
          {/* Tags */}
          <section className="bg-surface border border-border rounded-xl p-5">
            <CustomerTagsEditor
              customerId={customer.id}
              activeTags={customer.tags}
            />
          </section>

          {/* Notes */}
          <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <AddNoteForm customerId={customer.id} onNoteAdded={handleNoteAdded} />

            {notes.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
                  Historial de notas
                </h3>
                <ol className="space-y-4">
                  {notes.map((note) => (
                    <li key={note.id} className="text-sm border-l-2 border-border pl-3">
                      <p className="text-text-primary">{note.content}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {note.authorEmail ? `${note.authorEmail} · ` : ''}
                        {new Date(note.createdAt).toLocaleString('es-VE', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          {/* Member since */}
          <p className="text-xs text-text-secondary text-center">
            Cliente desde{' '}
            {new Date(customer.createdAt).toLocaleDateString('es-VE', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente" size="md">
        <form onSubmit={handleEditSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Nombre <span className="text-error">*</span>
              </label>
              <input
                className={inputCls}
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Apellido <span className="text-error">*</span>
              </label>
              <input
                className={inputCls}
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                required
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              className={inputCls}
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">WhatsApp</label>
              <input
                className={inputCls}
                value={editForm.whatsapp ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: e.target.value || null }))}
                placeholder="584141234567"
                maxLength={30}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Teléfono</label>
              <input
                className={inputCls}
                value={editForm.phone ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value || null }))}
                placeholder="0241-1234567"
                maxLength={30}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={editPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="font-display text-xl tracking-wide">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  )
}
