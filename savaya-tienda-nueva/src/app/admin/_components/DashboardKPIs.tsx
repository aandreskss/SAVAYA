'use client'

import { useEffect, useRef, useState } from 'react'
import type { DashboardKPIs as DashboardKPIsType } from '@/domains/admin/dashboard/types'

// ---------------------------------------------------------------------------
// Count-up hook
// ---------------------------------------------------------------------------

function useCountUp(target: number, duration = 1100, delay = 0): number {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let startTime: number | undefined
      const tick = (ts: number) => {
        if (startTime === undefined) startTime = ts
        const t = Math.min((ts - startTime) / duration, 1)
        const eased = 1 - (1 - t) ** 3
        setCurrent(eased * target)
        if (t < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay])

  return current
}

// ---------------------------------------------------------------------------
// Icons (inline SVG)
// ---------------------------------------------------------------------------

function IconRevenue() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v1.5M12 15.5V17M9.5 10a2.5 2 0 0 1 5 0c0 1.4-1 2-2.5 2.5S9.5 13.5 9.5 15a2.5 2 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconOrders() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconTicket() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h20M6 14h.01M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCustomers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// KPICard
// ---------------------------------------------------------------------------

const GOLD = '#CA8C31'

interface KPICardProps {
  label: string
  rawValue: number
  format: (n: number) => string
  sub?: string
  Icon: React.FC
  delay: number
}

function KPICard({ label, rawValue, format, sub, Icon, delay }: KPICardProps) {
  const counted = useCountUp(rawValue, 1100, delay)

  return (
    <div
      className="relative bg-surface border border-border rounded-xl overflow-hidden group cursor-default"
      style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
    >
      {/* Gold top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
      />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between mb-3 gap-2">
          <p className="text-[11px] text-text-muted font-semibold uppercase tracking-[0.13em] leading-tight">
            {label}
          </p>
          <span
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{ background: `${GOLD}18`, color: GOLD }}
          >
            <Icon />
          </span>
        </div>

        <p className="font-display text-[26px] font-bold text-text-primary leading-none tabular-nums">
          {format(counted)}
        </p>

        {sub && (
          <p className="text-[11px] text-text-muted mt-2">{sub}</p>
        )}
      </div>

      {/* Hover radial glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% -20%, ${GOLD}10 0%, transparent 65%)`,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmtUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function fmtInt(n: number) {
  return Math.round(n).toLocaleString('en-US')
}

// ---------------------------------------------------------------------------
// DashboardKPIs
// ---------------------------------------------------------------------------

export function DashboardKPIs({ kpis }: { kpis: DashboardKPIsType }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <KPICard
        label="Ventas"
        rawValue={kpis.revenue}
        format={fmtUsd}
        Icon={IconRevenue}
        delay={0}
      />
      <KPICard
        label="Pedidos"
        rawValue={kpis.orderCount}
        format={fmtInt}
        Icon={IconOrders}
        delay={80}
      />
      <KPICard
        label="Ticket promedio"
        rawValue={kpis.avgTicket}
        format={fmtUsd}
        sub={kpis.orderCount > 0 ? `de ${kpis.orderCount} pedidos` : undefined}
        Icon={IconTicket}
        delay={160}
      />
      <KPICard
        label="Clientes"
        rawValue={kpis.uniqueCustomers}
        format={fmtInt}
        sub="realizaron pedidos"
        Icon={IconCustomers}
        delay={240}
      />
      <KPICard
        label="Nuevos clientes"
        rawValue={kpis.newCustomers}
        format={fmtInt}
        sub="primera compra"
        Icon={IconStar}
        delay={320}
      />
    </div>
  )
}
