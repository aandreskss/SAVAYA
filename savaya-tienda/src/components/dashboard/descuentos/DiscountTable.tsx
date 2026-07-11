'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatPrice, formatDate } from '@/lib/utils'
import { toggleDiscountStatus, deleteDiscount } from '@/app/dashboard/descuentos/actions'
import type { DiscountCode } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type EffectiveStatus = 'active' | 'inactive' | 'expired'

function getEffectiveStatus(code: DiscountCode): EffectiveStatus {
  if (code.expires_at && new Date(code.expires_at) < new Date()) return 'expired'
  return code.is_active ? 'active' : 'inactive'
}

const STATUS_STYLES: Record<EffectiveStatus, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-bg text-gray-text',
  expired: 'bg-red-50 text-red-700',
}

const STATUS_LABELS: Record<EffectiveStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  expired: 'Vencido',
}

function formatValue(type: string, value: number) {
  return type === 'percentage' ? `${value}%` : formatPrice(value)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  codes: DiscountCode[]
}

export default function DiscountTable({ codes }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function handleToggle(id: string, isActive: boolean) {
    setPendingId(id)
    startTransition(async () => {
      await toggleDiscountStatus(id, !isActive)
      setPendingId(null)
    })
  }

  function handleDelete(id: string, code: string) {
    if (!window.confirm(`¿Eliminar el código "${code}"? Esta acción no se puede deshacer.`)) return
    setPendingId(id)
    startTransition(async () => {
      await deleteDiscount(id)
      setPendingId(null)
    })
  }

  if (codes.length === 0) {
    return (
      <div className="bg-white rounded border border-gray-light py-16 text-center">
        <svg className="mx-auto mb-3 text-gray-text" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <p className="text-sm text-gray-text font-body">No hay códigos de descuento aún.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded border border-gray-light overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="border-b border-gray-light">
            <tr className="text-[11px] text-gray-text font-heading font-semibold uppercase tracking-wider">
              <th className="text-left px-4 py-3">Código</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Compra mín.</th>
              <th className="text-left px-4 py-3">Usos</th>
              <th className="text-left px-4 py-3">Vence</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-light">
            {codes.map((code) => {
              const status = getEffectiveStatus(code)
              const isRowPending = pendingId === code.id && isPending
              const usesDisplay = code.max_uses
                ? `${code.used_count} / ${code.max_uses}`
                : `${code.used_count} / ∞`

              return (
                <tr
                  key={code.id}
                  className={`hover:bg-gray-bg/50 transition-colors ${isRowPending ? 'opacity-50' : ''}`}
                >
                  {/* Code */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs text-black tracking-wider">
                        {code.code}
                      </span>
                      <button
                        onClick={() => copyCode(code.id, code.code)}
                        className="text-gray-text hover:text-black transition-colors p-0.5 shrink-0"
                        title="Copiar código"
                      >
                        {copiedId === code.id ? (
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-green-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 text-gray-text">
                    {code.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3 font-heading font-semibold text-black text-xs">
                    {formatValue(code.type, code.value)}
                  </td>

                  {/* Min purchase */}
                  <td className="px-4 py-3 text-gray-text text-xs">
                    {code.min_purchase ? formatPrice(code.min_purchase) : '—'}
                  </td>

                  {/* Uses */}
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-xs font-body text-black">{usesDisplay}</span>
                      {code.max_uses && (
                        <div className="mt-1 h-1 w-20 bg-gray-light rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{
                              width: `${Math.min(100, (code.used_count / code.max_uses) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Expiry */}
                  <td className="px-4 py-3 text-xs text-gray-text">
                    {code.expires_at ? formatDate(code.expires_at) : 'Sin vencimiento'}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded ${STATUS_STYLES[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggle(code.id, code.is_active)}
                        disabled={isRowPending || status === 'expired'}
                        title={code.is_active ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded transition-colors hover:bg-gray-bg disabled:cursor-not-allowed disabled:opacity-40 ${
                          code.is_active ? 'text-green-600 hover:text-gray-text' : 'text-gray-text hover:text-green-600'
                        }`}
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          {code.is_active ? (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          ) : (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </>
                          )}
                        </svg>
                      </button>

                      {/* Edit */}
                      <Link
                        href={`/dashboard/descuentos/${code.id}`}
                        className="p-1.5 text-gray-text hover:text-black transition-colors rounded hover:bg-gray-bg"
                        title="Editar"
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(code.id, code.code)}
                        disabled={isRowPending}
                        title="Eliminar"
                        className="p-1.5 text-gray-text hover:text-sale transition-colors rounded hover:bg-gray-bg disabled:cursor-not-allowed"
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
