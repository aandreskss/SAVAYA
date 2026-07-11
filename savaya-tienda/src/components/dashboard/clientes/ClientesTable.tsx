'use client'

import { useState, useTransition, useRef } from 'react'
import { updateUserProfile, updateUserRole, importClientsFromCSV } from './actions'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  customer: 'Cliente',
  admin: 'Admin',
  sub_admin: 'Sub Admin',
  editor: 'Editor',
  gestor_pedidos: 'Gestor de Pedidos',
}

// Roles an admin can assign via the UI
const ADMIN_ASSIGNABLE_ROLES = ['customer', 'sub_admin', 'editor', 'gestor_pedidos']
// Roles a sub_admin can assign — never admin or sub_admin
const SUB_ADMIN_ASSIGNABLE_ROLES = ['customer', 'editor', 'gestor_pedidos']

// Which users can the viewer edit?
function canEditTarget(viewerRole: string, targetRole: string): boolean {
  if (viewerRole === 'admin') return true // admin edits everyone (role dropdown hidden for admin targets)
  if (viewerRole === 'sub_admin') return targetRole !== 'admin' && targetRole !== 'sub_admin'
  return false
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  order_count: number
  city: string | null
  created_at: string
  last_sign_in: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function parseCSV(text: string): { email: string; name: string; phone: string }[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  function splitLine(line: string): string[] {
    const fields: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) {
        fields.push(cur); cur = ''
      } else {
        cur += c
      }
    }
    fields.push(cur)
    return fields
  }

  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u'))
  const ei = headers.findIndex((h) => h === 'email')
  const ni = headers.findIndex((h) => h === 'nombre' || h === 'name')
  const pi = headers.findIndex((h) => h === 'telefono' || h === 'phone')

  if (ei === -1) return []

  return lines
    .slice(1)
    .map((line) => {
      const f = splitLine(line)
      return {
        email: f[ei]?.trim() ?? '',
        name: ni >= 0 ? (f[ni]?.trim() ?? '') : '',
        phone: pi >= 0 ? (f[pi]?.trim() ?? '') : '',
      }
    })
    .filter((r) => r.email)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientesTable({ clients, currentUserRole = 'admin' }: { clients: Client[]; currentUserRole?: string }) {
  const isSubAdmin = currentUserRole === 'sub_admin'
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Client | null>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: '' })
  const [editPending, startEdit] = useTransition()
  const [editError, setEditError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ updated: number; skipped: number } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const q = search.trim().toLowerCase()
  const filtered = q
    ? clients.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').includes(q)
      )
    : clients

  function openEdit(client: Client) {
    setEditing(client)
    setEditForm({ name: client.name ?? '', phone: client.phone ?? '', role: client.role })
    setEditError('')
  }

  function handleSave() {
    if (!editing) return
    setEditError('')
    startEdit(async () => {
      const result = isSubAdmin
        ? await updateUserRole(editing.id, editForm.role)
        : await updateUserProfile(editing.id, editForm)
      if (result?.error) {
        setEditError(result.error)
      } else {
        setEditing(null)
      }
    })
  }

  function handleExport() {
    const rows = [
      ['email', 'nombre', 'telefono', 'ciudad', 'rol', 'pedidos', 'registrado', 'ultimo_acceso'],
      ...filtered.map((c) => [
        c.email,
        c.name ?? '',
        c.phone ?? '',
        c.city ?? '',
        c.role,
        String(c.order_count),
        fmtDate(c.created_at),
        fmtDate(c.last_sign_in),
      ]),
    ]
    const csv =
      '﻿' +
      rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes-savaya-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadTemplate() {
    const csv = '﻿"email","nombre","telefono"\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla-clientes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setImportResult({ updated: 0, skipped: 0 })
        return
      }
      const result = await importClientsFromCSV(rows)
      setImportResult(result)
    } catch {
      setImportResult({ updated: 0, skipped: 0 })
    } finally {
      setImporting(false)
    }
  }

  if (clients.length === 0) {
    return <div className="text-center py-16 text-gray-text text-sm">No hay clientes registrados todavía.</div>
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-gray-light rounded text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={importRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) { handleImportFile(f); e.target.value = '' }
            }}
          />
          {!isSubAdmin && (
            <>
              <button
                type="button"
                onClick={downloadTemplate}
                title="Descargar plantilla CSV"
                className="h-9 px-3 text-xs font-heading font-semibold text-gray-text border border-gray-light rounded hover:border-black hover:text-black transition-colors whitespace-nowrap"
              >
                Plantilla CSV
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={() => importRef.current?.click()}
                className="h-9 px-3 text-xs font-heading font-semibold border border-gray-light rounded hover:border-black transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {importing ? 'Importando…' : 'Importar CSV'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="h-9 px-3 text-xs font-heading font-semibold bg-black text-white rounded hover:bg-accent transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Import result ─────────────────────────────────────────────────── */}
      {importResult && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${importResult.skipped > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex-1">
            <p className="font-heading font-semibold text-black">
              {importResult.updated} perfil{importResult.updated !== 1 ? 'es' : ''} actualizado{importResult.updated !== 1 ? 's' : ''}
            </p>
            {importResult.skipped > 0 && (
              <p className="text-xs text-gray-text mt-1">
                {importResult.skipped} fila{importResult.skipped !== 1 ? 's' : ''} omitida{importResult.skipped !== 1 ? 's' : ''} (email no registrado o error)
              </p>
            )}
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="text-gray-text hover:text-black text-xl leading-none shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Count ────────────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-text">
        {filtered.length === clients.length
          ? `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`
          : `${filtered.length} de ${clients.length} clientes`}
      </p>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-gray-light bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-light bg-gray-bg text-left">
              {['Email', 'Nombre', 'Teléfono', 'Ciudad', 'Rol', 'Pedidos', 'Registrado', 'Último acceso', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-heading font-semibold text-xs uppercase tracking-wider text-gray-text whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-light">
            {filtered.map((client) => (
              <tr key={client.id} className="hover:bg-gray-bg/50 transition-colors">
                <td className="px-4 py-3 text-black font-body max-w-[220px] truncate">{client.email}</td>
                <td className="px-4 py-3 text-gray-text whitespace-nowrap">{client.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-text whitespace-nowrap">{client.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-text whitespace-nowrap">{client.city ?? '—'}</td>
                <td className="px-4 py-3">
                  {client.role === 'admin' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-heading font-bold bg-gold/10 text-gold border border-gold/20">
                      Admin
                    </span>
                  ) : client.role === 'sub_admin' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-heading font-bold bg-accent/10 text-accent border border-accent/20">
                      Sub Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-heading font-semibold bg-gray-bg text-gray-text border border-gray-light">
                      {ROLE_LABELS[client.role] ?? client.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {client.order_count > 0 ? (
                    <span className="font-heading font-bold text-black">{client.order_count}</span>
                  ) : (
                    <span className="text-gray-text">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-text text-xs whitespace-nowrap">{fmtDate(client.created_at)}</td>
                <td className="px-4 py-3 text-gray-text text-xs whitespace-nowrap">{fmtDate(client.last_sign_in)}</td>
                <td className="px-4 py-3">
                  {canEditTarget(currentUserRole, client.role) && (
                    <button
                      type="button"
                      onClick={() => openEdit(client)}
                      className="h-7 px-2.5 text-xs font-heading font-semibold border border-gray-light rounded hover:border-black hover:text-black text-gray-text transition-colors"
                    >
                      {isSubAdmin ? 'Rol' : 'Editar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-10 text-sm text-gray-text">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {/* ── Edit modal ───────────────────────────────────────────────────── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null) }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-light">
              <div>
                <h2 className="font-heading font-bold text-base text-black">Editar cliente</h2>
                <p className="text-xs text-gray-text mt-0.5 truncate max-w-[300px]">{editing.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-bg text-gray-text hover:text-black transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Fields */}
            <div className="px-6 py-5 space-y-4">
              {/* Name + phone — admin only */}
              {!isSubAdmin && (
                <>
                  <ModalField label="Nombre completo">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="María García"
                      className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                  </ModalField>
                  <ModalField label="Teléfono / WhatsApp">
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+58 414 123 4567"
                      className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                  </ModalField>
                </>
              )}

              {/* Role — shown based on who is editing and who is the target */}
              {(isSubAdmin || editing.role !== 'admin') && (
                <ModalField label="Rol">
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full h-10 border border-gray-light rounded px-3 text-sm focus:outline-none focus:border-black transition-colors"
                  >
                    {(isSubAdmin ? SUB_ADMIN_ASSIGNABLE_ROLES : ADMIN_ASSIGNABLE_ROLES).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  {isSubAdmin && (
                    <p className="text-[11px] text-gray-text mt-1">
                      Solo puedes asignar roles de Editor o Gestor de Pedidos.
                    </p>
                  )}
                </ModalField>
              )}

              {editError && (
                <p className="text-xs text-sale bg-red-50 border border-red-200 rounded px-3 py-2">
                  {editError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-light flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-9 px-4 text-sm font-heading font-semibold border border-gray-light rounded hover:border-black transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={editPending}
                className="h-9 px-4 text-sm font-heading font-semibold bg-black text-white rounded hover:bg-accent transition-colors disabled:opacity-50"
              >
                {editPending ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-gray-text mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
