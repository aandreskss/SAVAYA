'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { formatPrice, formatDate } from '@/lib/utils'
import { useCurrency } from '@/components/providers/CurrencyProvider'
import type { OrderStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  created_at: string
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-800' },
  paid:       { label: 'Pagado',      cls: 'bg-blue-100 text-blue-800' },
  processing: { label: 'En proceso',  cls: 'bg-blue-100 text-blue-800' },
  shipped:    { label: 'Enviado',     cls: 'bg-orange-100 text-orange-800' },
  delivered:  { label: 'Entregado',   cls: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Cancelado',   cls: 'bg-red-100 text-red-800' },
  returned:   { label: 'Devuelto',    cls: 'bg-orange-100 text-orange-800' },
  on_hold:    { label: 'En pausa',    cls: 'bg-orange-100 text-orange-800' },
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: OrderRow[] = [
  { id: 'm1', order_number: 'TUL-2026-00123', status: 'delivered', total: 189900, created_at: '2026-04-15T10:30:00Z' },
  { id: 'm2', order_number: 'TUL-2026-00089', status: 'shipped',   total: 103900, created_at: '2026-05-02T14:00:00Z' },
  { id: 'm3', order_number: 'TUL-2026-00067', status: 'pending',   total: 53900,  created_at: '2026-05-10T09:15:00Z' },
]

const QUICK_LINKS = [
  { href: '/cuenta/pedidos',     label: 'Mis pedidos',   desc: 'Seguimiento e historial' },
  { href: '/cuenta/favoritos',   label: 'Favoritos',     desc: 'Productos guardados' },
  { href: '/cuenta/perfil',      label: 'Mi perfil',     desc: 'Datos personales' },
  { href: '/cuenta/direcciones', label: 'Direcciones',   desc: 'Gestionar envíos' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CuentaDashboard() {
  const currency = useCurrency()
  const { user, profile, isLoading } = useAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  const displayName =
    profile?.name ?? user?.user_metadata?.full_name ?? user?.email ?? ''
  const firstName = displayName.split(' ')[0] || 'bienvenido'

  useEffect(() => {
    if (isLoading) return
    if (!user?.id || !supabaseConfigured) {
      setOrders(MOCK_ORDERS)
      setLoadingOrders(false)
      return
    }
    const supabase = createClient()
    supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('email', user.email ?? '')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? [])
        setLoadingOrders(false)
      })
  }, [user?.id, user?.email, isLoading])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          Hola, {firstName} 👋
        </h1>
        <p className="text-gray-text text-sm mt-1">
          Bienvenido a tu panel de cuenta
        </p>
      </div>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-base">Pedidos recientes</h2>
          <Link
            href="/cuenta/pedidos"
            className="text-sm text-gray-text hover:text-black underline underline-offset-2 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-bg rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-gray-light rounded-lg px-6 py-10 text-center">
            <p className="text-gray-text text-sm">Aún no tienes pedidos.</p>
            <Link
              href="/nuevas-colecciones"
              className="mt-3 inline-block text-sm font-semibold underline underline-offset-2 hover:text-accent transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => {
              const s = STATUS[order.status] ?? STATUS.pending
              return (
                <Link
                  key={order.id}
                  href="/cuenta/pedidos"
                  className="flex items-center justify-between gap-4 border border-gray-light rounded-lg px-4 py-3.5 hover:border-black transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${s.cls}`}>
                      {s.label}
                    </span>
                    <span className="text-sm font-medium truncate">{order.order_number}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm text-gray-text">
                    <span className="hidden sm:block">{formatDate(order.created_at)}</span>
                    <span className="font-heading font-semibold text-black">{formatPrice(order.total, currency)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="font-heading font-bold text-base mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="border border-gray-light rounded-lg px-4 py-5 hover:border-black hover:shadow-sm transition-all group"
            >
              <p className="text-sm font-semibold group-hover:text-accent transition-colors">{label}</p>
              <p className="text-xs text-gray-text mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="h-10 w-64 bg-gray-bg rounded animate-pulse" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-bg rounded-lg animate-pulse" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-bg rounded-lg animate-pulse" />)}
      </div>
    </div>
  )
}
