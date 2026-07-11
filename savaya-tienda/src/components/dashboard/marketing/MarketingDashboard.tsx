'use client'

import { useState, useMemo } from 'react'
import { formatPrice } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientData {
  email: string
  name: string | null
  phone: string | null
  totalSpent: number
  orderCount: number
  lastOrderAt: string | null
  genders: string[]
  types: string[]
}

interface Segment {
  id: string
  label: string
  category: string
  description: string
  hint: string
  metaHint?: string
  waHint?: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  filter: (c: ClientData) => boolean
}

// ─── Segment definitions ──────────────────────────────────────────────────────

const DAYS = (n: number) => n * 24 * 60 * 60 * 1000

const SEGMENTS: Segment[] = [
  // ── Por género ──────────────────────────────────────────────────────────────
  {
    id: 'women',
    label: 'Moda Mujer',
    category: 'Por interés',
    description: 'Compraron al menos un producto de la línea Mujer',
    hint: 'Ideales para campañas de nueva colección femenina, calzado y accesorios de mujer.',
    metaHint: 'Sube este CSV en Meta Ads → Audiencias → Audiencia personalizada → Lista de clientes.',
    waHint: 'Usa la columna "telefono" para enviar mensajes masivos sobre la colección mujer.',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="8" r="4" />
        <path d="M12 12v8M9 17h6" strokeLinecap="round" />
      </svg>
    ),
    filter: (c) => c.genders.includes('women'),
  },
  {
    id: 'men',
    label: 'Moda Hombre',
    category: 'Por interés',
    description: 'Compraron al menos un producto de la línea Hombre',
    hint: 'Ideales para campañas de ropa masculina, zapatos y accesorios de hombre.',
    metaHint: 'Sube este CSV en Meta Ads → Audiencias → Audiencia personalizada → Lista de clientes.',
    waHint: 'Usa la columna "telefono" para campañas masivas de la línea masculina.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="10" cy="10" r="5" />
        <path d="M19 5l-4.35 4.35M19 5h-4M19 5v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    filter: (c) => c.genders.includes('men'),
  },
  {
    id: 'kids',
    label: 'Moda Niños',
    category: 'Por interés',
    description: 'Compraron al menos un producto de la línea Niños',
    hint: 'Ideales para campañas de temporada escolar, calzado infantil y ropa de niños.',
    metaHint: 'Perfecto para crear audiencias de padres en Meta Ads con hijos en edad escolar.',
    waHint: 'Comparte novedades de la línea infantil directamente por WhatsApp.',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 2a5 5 0 100 10A5 5 0 0012 2z" />
        <path d="M5 22c0-3.87 3.13-7 7-7s7 3.13 7 7" strokeLinecap="round" />
        <path d="M8 8.5c.5 1 2 1.5 4 1.5s3.5-.5 4-1.5" strokeLinecap="round" />
      </svg>
    ),
    filter: (c) => c.genders.includes('kids'),
  },
  // ── Por tipo ─────────────────────────────────────────────────────────────────
  {
    id: 'shoes',
    label: 'Amantes del Calzado',
    category: 'Por tipo',
    description: 'Compraron zapatos o calzado en algún pedido',
    hint: 'Perfectos para campañas de nuevas colecciones de tenis, sandalias y botas.',
    metaHint: 'Excelente audiencia para anuncios de calzado de temporada en Meta.',
    waHint: 'Envía catálogo de calzado nuevas llegadas por WhatsApp Business.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 18c0 0 2-4 5-4h8c1.5 0 4 .5 5 2v2H3z" strokeLinejoin="round" />
        <path d="M8 14l3-6 3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    filter: (c) => c.types.includes('shoes'),
  },
  {
    id: 'clothing',
    label: 'Compradores de Ropa',
    category: 'Por tipo',
    description: 'Compraron prendas de vestir en algún pedido',
    hint: 'Ideales para campañas de temporada, outfits completos y tendencias.',
    metaHint: 'Audiencia amplia, ideal para campañas de awareness de nueva colección de ropa.',
    waHint: 'Comparte lookbooks de temporada o conjuntos destacados por WhatsApp.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 6l3-3 3 3v14H3V6zM21 6l-3-3-3 3v14h6V6z" strokeLinejoin="round" />
        <path d="M9 3c0 2 1.5 3 3 3s3-1 3-3" strokeLinecap="round" />
      </svg>
    ),
    filter: (c) => c.types.includes('clothing'),
  },
  {
    id: 'accessories',
    label: 'Compradores de Accesorios',
    category: 'Por tipo',
    description: 'Compraron accesorios (bolsos, joyería, gorras, cinturones)',
    hint: 'Ideales para campañas de complementos y accesorios de temporada.',
    metaHint: 'Segmento premium — suelen tener alto interés en moda y lifestyle.',
    waHint: 'Comparte novedades de accesorios con fotos del catálogo por WhatsApp.',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M6 2h12l3 7H3L6 2z" strokeLinejoin="round" />
        <path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9" strokeLinejoin="round" />
        <path d="M9 9v4a3 3 0 006 0V9" strokeLinecap="round" />
      </svg>
    ),
    filter: (c) => c.types.includes('accessories'),
  },
  // ── Por comportamiento ────────────────────────────────────────────────────────
  {
    id: 'frequent',
    label: 'Clientes Frecuentes',
    category: 'Por comportamiento',
    description: 'Realizaron 2 o más pedidos en la tienda',
    hint: 'Tus mejores embajadores. Ideales para programas de fidelidad, referencias y acceso VIP.',
    metaHint: 'Crea audiencias similares (Lookalike) en Meta basadas en estos clientes.',
    waHint: 'Envía ofertas exclusivas "solo para clientes especiales" por WhatsApp.',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-700',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinejoin="round" />
      </svg>
    ),
    filter: (c) => c.orderCount >= 2,
  },
  {
    id: 'recent',
    label: 'Compradores Recientes',
    category: 'Por comportamiento',
    description: 'Hicieron un pedido en los últimos 45 días',
    hint: 'Clientes activos — ideales para upsell, cross-sell y mostrar nuevas colecciones.',
    metaHint: 'Alto potencial de conversión: ya compraron recientemente y están en modo compra.',
    waHint: 'Envía "¿Ya viste las últimas novedades?" — alta probabilidad de respuesta.',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    filter: (c) =>
      !!c.lastOrderAt &&
      Date.now() - new Date(c.lastOrderAt).getTime() <= DAYS(45),
  },
  {
    id: 'inactive',
    label: 'Clientes Inactivos',
    category: 'Por comportamiento',
    description: 'Sin pedidos en más de 90 días (pero tienen historial)',
    hint: 'Campaña de reactivación: "Te extrañamos" con descuento especial para volver.',
    metaHint: 'Retargeting de clientes dormidos con oferta de reactivación en Meta Ads.',
    waHint: 'Mensaje de re-engagement: "Han pasado X meses, tenemos algo especial para ti".',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-500',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5s1.5-2 3.5-2 3.5 2 3.5 2" strokeLinecap="round" />
        <path d="M9 9h.01M15 9h.01" strokeLinecap="round" />
      </svg>
    ),
    filter: (c) =>
      !!c.lastOrderAt &&
      Date.now() - new Date(c.lastOrderAt).getTime() > DAYS(90),
  },
  {
    id: 'highvalue',
    label: 'Alto Valor',
    category: 'Por comportamiento',
    description: 'Acumularon $50 o más en pedidos totales',
    hint: 'Tus mejores clientes por gasto. Tratar con prioridad VIP y descuentos exclusivos.',
    metaHint: 'Crea audiencias similares (Lookalike) en Meta para encontrar clientes de alto valor.',
    waHint: 'Acceso anticipado a colecciones, descuentos VIP y atención personalizada.',
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" />
      </svg>
    ),
    filter: (c) => c.totalSpent >= 50,
  },
  {
    id: 'all',
    label: 'Todos los Clientes',
    category: 'General',
    description: 'Todos los que han realizado al menos un pedido',
    hint: 'Para campañas generales, lanzamientos de temporada o anuncios globales de la tienda.',
    metaHint: 'Base completa para audiencias personalizadas y Lookalike en Meta Ads.',
    waHint: 'Campanñas masivas de lanzamiento o ventas especiales (Navidad, remates, etc.).',
    iconBg: 'bg-black',
    iconColor: 'text-white',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    ),
    filter: () => true,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  clients: ClientData[]
  totalOrders: number
  avgOrderValue: number
}

export default function MarketingDashboard({ clients, totalOrders, avgOrderValue }: Props) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'emails' | 'phones'>('emails')
  const [copied, setCopied] = useState(false)

  const segmentedClients = useMemo(() => {
    const result = new Map<string, ClientData[]>()
    for (const seg of SEGMENTS) {
      result.set(seg.id, clients.filter(seg.filter))
    }
    return result
  }, [clients])

  const openSeg = SEGMENTS.find((s) => s.id === activeSegment)
  const openClients = activeSegment ? (segmentedClients.get(activeSegment) ?? []) : []
  const emailList = openClients.map((c) => c.email)
  const phoneList = openClients.filter((c) => c.phone).map((c) => c.phone!)

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function downloadCSV(seg: Segment) {
    const matched = segmentedClients.get(seg.id) ?? []
    const rows = [
      ['email', 'nombre', 'telefono', 'pedidos', 'gasto_total'],
      ...matched.map((c) => [
        c.email,
        c.name ?? '',
        c.phone ?? '',
        String(c.orderCount),
        c.totalSpent.toFixed(2),
      ]),
    ]
    const csv =
      '﻿' +
      rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `segmento-${seg.id}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Group segments by category
  const categories = ['Por interés', 'Por tipo', 'Por comportamiento', 'General']

  return (
    <div className="space-y-8">
      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Emails únicos', value: clients.length.toLocaleString('es-VE') },
          { label: 'Total de pedidos', value: totalOrders.toLocaleString('es-VE') },
          { label: 'Ticket promedio', value: formatPrice(avgOrderValue) },
          {
            label: 'Con teléfono',
            value: clients.filter((c) => c.phone).length.toLocaleString('es-VE'),
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-light rounded-lg px-5 py-4">
            <p className="text-[11px] font-heading font-bold uppercase tracking-widest text-gray-text mb-1">
              {label}
            </p>
            <p className="text-2xl font-heading font-bold text-black">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Segment groups ─────────────────────────────────────────────────── */}
      {categories.map((cat) => {
        const segs = SEGMENTS.filter((s) => s.category === cat)
        return (
          <div key={cat}>
            <p className="text-[11px] font-heading font-bold uppercase tracking-widest text-gray-text mb-3">
              {cat}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {segs.map((seg) => {
                const count = segmentedClients.get(seg.id)?.length ?? 0
                const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => {
                      setActiveSegment(seg.id)
                      setActiveTab('emails')
                      setCopied(false)
                    }}
                    className="bg-white border border-gray-light rounded-xl p-5 text-left hover:border-black hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg ${seg.iconBg} ${seg.iconColor} flex items-center justify-center shrink-0`}>
                        {seg.icon}
                      </div>
                      {count > 0 && (
                        <span className="text-xs font-heading font-bold text-gray-text bg-gray-bg px-2 py-1 rounded-full">
                          {pct}%
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <p className="font-heading font-bold text-base text-black leading-tight mb-1">
                        {seg.label}
                      </p>
                      <p className="text-xs text-gray-text leading-relaxed">{seg.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-heading font-black text-black">{count}</p>
                      <span className="text-xs font-heading font-semibold text-gray-text group-hover:text-black transition-colors">
                        Ver segmento →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ── Segment modal ──────────────────────────────────────────────────── */}
      {openSeg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveSegment(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-light shrink-0">
              <div className={`w-10 h-10 rounded-lg ${openSeg.iconBg} ${openSeg.iconColor} flex items-center justify-center shrink-0`}>
                {openSeg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-bold text-lg text-black">{openSeg.label}</h2>
                <p className="text-sm text-gray-text mt-0.5">{openSeg.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-heading font-black text-black leading-none">{openClients.length}</p>
                  <p className="text-[10px] text-gray-text font-heading uppercase tracking-wider">clientes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSegment(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-bg text-gray-text hover:text-black transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-light shrink-0 px-6">
              <button
                type="button"
                onClick={() => { setActiveTab('emails'); setCopied(false) }}
                className={`py-3 text-sm font-heading font-semibold border-b-2 mr-6 transition-colors ${activeTab === 'emails' ? 'border-black text-black' : 'border-transparent text-gray-text hover:text-black'}`}
              >
                Emails para Meta/FB
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('phones'); setCopied(false) }}
                className={`py-3 text-sm font-heading font-semibold border-b-2 transition-colors ${activeTab === 'phones' ? 'border-black text-black' : 'border-transparent text-gray-text hover:text-black'}`}
              >
                Teléfonos para WhatsApp
                {phoneList.length > 0 && (
                  <span className="ml-2 text-[10px] bg-gray-bg text-gray-text px-1.5 py-0.5 rounded-full font-heading">
                    {phoneList.length}
                  </span>
                )}
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {activeTab === 'emails' ? (
                <>
                  {emailList.length === 0 ? (
                    <p className="text-center py-8 text-gray-text text-sm">
                      Este segmento no tiene clientes todavía.
                    </p>
                  ) : (
                    <>
                      <div className="bg-gray-bg rounded-lg p-3">
                        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2">
                          Lista de emails ({emailList.length})
                        </p>
                        <textarea
                          readOnly
                          rows={Math.min(emailList.length, 8)}
                          value={emailList.join('\n')}
                          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                          className="w-full bg-white border border-gray-light rounded px-3 py-2 text-xs font-mono text-black resize-none focus:outline-none focus:border-black"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(emailList.join('\n'))}
                          className="h-9 px-4 text-sm font-heading font-semibold bg-black text-white rounded hover:bg-accent transition-colors flex items-center gap-2"
                        >
                          {copied ? '✓ Copiado' : 'Copiar emails'}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(emailList.join(', '))}
                          className="h-9 px-4 text-sm font-heading font-semibold border border-gray-light rounded hover:border-black transition-colors"
                        >
                          Copiar separado por comas
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadCSV(openSeg)}
                          className="h-9 px-4 text-sm font-heading font-semibold border border-gray-light rounded hover:border-black transition-colors flex items-center gap-2"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Exportar CSV
                        </button>
                      </div>
                      {openSeg.metaHint && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-blue-500 mb-1">
                            Cómo usar en Meta / Facebook Ads
                          </p>
                          <p className="text-xs text-blue-700 leading-relaxed">{openSeg.metaHint}</p>
                          <p className="text-xs text-blue-500 mt-1.5 leading-relaxed">
                            Ruta: <span className="font-medium">Meta Business Suite → Administrador de anuncios → Audiencias → Crear audiencia → Audiencia personalizada → Lista de clientes</span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {phoneList.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-text text-sm">
                        {openClients.length === 0
                          ? 'Este segmento no tiene clientes todavía.'
                          : `Ninguno de los ${openClients.length} clientes de este segmento tiene teléfono registrado.`}
                      </p>
                      {openClients.length > 0 && (
                        <p className="text-xs text-gray-text mt-2">
                          Los clientes registran su teléfono al completar un pedido o editar su perfil.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-bg rounded-lg p-3">
                        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2">
                          Teléfonos ({phoneList.length} de {openClients.length} clientes)
                        </p>
                        <textarea
                          readOnly
                          rows={Math.min(phoneList.length, 8)}
                          value={phoneList.join('\n')}
                          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                          className="w-full bg-white border border-gray-light rounded px-3 py-2 text-xs font-mono text-black resize-none focus:outline-none focus:border-black"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(phoneList.join('\n'))}
                          className="h-9 px-4 text-sm font-heading font-semibold bg-black text-white rounded hover:bg-accent transition-colors"
                        >
                          {copied ? '✓ Copiado' : 'Copiar teléfonos'}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadCSV(openSeg)}
                          className="h-9 px-4 text-sm font-heading font-semibold border border-gray-light rounded hover:border-black transition-colors flex items-center gap-2"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Exportar CSV completo
                        </button>
                      </div>
                      {openSeg.waHint && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-green-600 mb-1">
                            Cómo usar en WhatsApp
                          </p>
                          <p className="text-xs text-green-700 leading-relaxed">{openSeg.waHint}</p>
                          <p className="text-xs text-green-500 mt-1.5">
                            Herramientas recomendadas: <span className="font-medium">WhatsApp Business API, Callbell, MessageBird o AiSensy</span> para envíos masivos.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-4 border-t border-gray-light bg-gray-bg/50 rounded-b-2xl shrink-0">
              <p className="text-xs text-gray-text leading-relaxed">
                <span className="font-heading font-semibold text-black">Consejo: </span>
                {openSeg.hint}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
