'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CustomerTagsEditor } from './CustomerTagsEditor'
import { AddNoteForm } from './AddNoteForm'
import { CustomerTagBadge } from './CustomerTagBadge'
import { OrderStatusBadge } from '@/domains/admin/orders/components/OrderStatusBadge'
import type { CustomerDetail, CustomerNote } from '../types'
import type { OrderStatus } from '@/domains/orders/state-machine'

export function CustomerDetailView({ customer }: { customer: CustomerDetail }) {
  const [notes, setNotes] = useState<CustomerNote[]>(customer.notes)

  function handleNoteAdded(note: CustomerNote) {
    setNotes((prev) => [note, ...prev])
  }

  const lastOrderFormatted = customer.lastOrderAt
    ? new Date(customer.lastOrderAt).toLocaleDateString('es-VE', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/admin/clientes" className="text-text-secondary hover:text-text-primary text-sm">
              ← Clientes
            </Link>
          </div>
          <h1 className="font-display text-2xl uppercase tracking-wide">
            {customer.firstName} {customer.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <a href={`mailto:${customer.email}`} className="text-sm text-text-secondary hover:underline">
              {customer.email}
            </a>
            {customer.whatsapp && (
              <a
                href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-success hover:underline"
              >
                WA: {customer.whatsapp}
              </a>
            )}
            {customer.phone && !customer.whatsapp && (
              <span className="text-sm text-text-secondary">{customer.phone}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {customer.tags.map((tag) => (
            <CustomerTagBadge key={tag} tag={tag} size="md" />
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Total gastado" value={`$${customer.totalSpentUsd}`} />
        <KPICard label="Pedidos" value={String(customer.totalOrders)} />
        <KPICard label="Ticket promedio" value={`$${customer.avgTicketUsd}`} />
        <KPICard
          label="Último pedido"
          value={lastOrderFormatted ?? '—'}
        />
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
    </div>
  )
}

function KPICard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="font-display text-xl tracking-wide">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  )
}
