'use client'

import { useState, useId } from 'react'
import type { SalesChartPoint } from '@/domains/admin/dashboard/types'

function formatUsd(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

function formatUsdFull(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function formatDay(day: string) {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

// Catmull-Rom → Cubic Bezier smooth path
function smoothBezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  const k = 0.3
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 2)]
    const p1 = pts[i - 1]
    const p2 = pts[i]
    const p3 = pts[Math.min(pts.length - 1, i + 1)]
    const cp1x = p1.x + (p2.x - p0.x) * k
    const cp1y = p1.y + (p2.y - p0.y) * k
    const cp2x = p2.x - (p3.x - p1.x) * k
    const cp2y = p2.y - (p3.y - p1.y) * k
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

interface Props {
  data: SalesChartPoint[]
}

const GOLD = '#CA8C31'

// SVG viewBox dimensions
const W = 640
const H = 200
const PL = 52
const PR = 20
const PT = 16
const PB = 32
const chartW = W - PL - PR
const chartH = H - PT - PB

export function SalesLineChart({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const uid = useId().replace(/:/g, '')

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
        Sin datos para este período
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW
  const xOffset = data.length === 1 ? chartW / 2 : 0

  const pts = data.map((d, i) => ({
    x: PL + xOffset + i * xStep,
    y: PT + chartH - (d.revenue / maxRevenue) * chartH,
    ...d,
  }))

  const linePath = smoothBezierPath(pts)
  const areaPath =
    pts.length > 1
      ? `${linePath} L ${pts[pts.length - 1].x.toFixed(2)},${(PT + chartH).toFixed(2)} L ${pts[0].x.toFixed(2)},${(PT + chartH).toFixed(2)} Z`
      : ''

  const yTicks = [0, 0.25, 0.5, 0.75, 1]
  const maxXLabels = 7
  const xLabelStep = data.length > maxXLabels ? Math.ceil(data.length / maxXLabels) : 1

  const hoveredPt = hovered !== null ? pts[hovered] : null

  // Tooltip position as % of viewBox — maps cleanly to the padded container
  const ttLeftPct = hoveredPt ? (hoveredPt.x / W) * 100 : 0
  const ttTopPct = hoveredPt ? (hoveredPt.y / H) * 100 : 0

  return (
    // Aspect-ratio container: SVG + tooltip both use the same coordinate space
    <div
      className="relative w-full select-none"
      style={{ paddingBottom: `${(H / W) * 100}%` }}
    >
      {/* SVG fills the container exactly */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.2" />
            <stop offset="80%" stopColor={GOLD} stopOpacity="0.03" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>

          <filter id={`${uid}-glow`} x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id={`${uid}-clip`}>
            <rect x={PL} y={PT} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {yTicks.map((frac) => (
          <line
            key={frac}
            x1={PL} y1={(PT + frac * chartH).toFixed(1)}
            x2={W - PR} y2={(PT + frac * chartH).toFixed(1)}
            style={{ stroke: 'var(--color-border)', strokeOpacity: frac === 0 ? 0.8 : 0.45 }}
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill={`url(#${uid}-area)`} clipPath={`url(#${uid}-clip)`} />
        )}

        {/* Smooth line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter={`url(#${uid}-glow)`}
          />
        )}

        {/* Hover crosshair */}
        {hoveredPt && (
          <line
            x1={hoveredPt.x} y1={PT}
            x2={hoveredPt.x} y2={PT + chartH}
            stroke={GOLD} strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 3"
          />
        )}

        {/* Hit areas + dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - xStep / 2} y={PT}
              width={xStep} height={chartH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {hovered === i && (
              <circle cx={p.x} cy={p.y} r="8" fill={GOLD} fillOpacity="0.15" style={{ pointerEvents: 'none' }} />
            )}
            <circle
              cx={p.x} cy={p.y}
              r={hovered === i ? 4.5 : 2.5}
              fill={GOLD}
              stroke="var(--color-surface)"
              strokeWidth={hovered === i ? 2 : 1.5}
              style={{ transition: 'r 0.12s ease', pointerEvents: 'none' }}
            />
          </g>
        ))}

        {/* X-axis labels */}
        {pts.map((p, i) =>
          i % xLabelStep === 0 || i === pts.length - 1 ? (
            <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="10" fontFamily="inherit" style={{ fill: 'var(--color-text-muted)' }}>
              {formatDay(p.day)}
            </text>
          ) : null,
        )}

        {/* Y-axis labels */}
        {yTicks.filter((f) => f === 0 || f === 0.5 || f === 1).map((frac) => (
          <text key={frac} x={PL - 6} y={(PT + (1 - frac) * chartH + 4).toFixed(1)} textAnchor="end" fontSize="10" fontFamily="inherit" style={{ fill: 'var(--color-text-muted)' }}>
            {formatUsd(maxRevenue * frac)}
          </text>
        ))}
      </svg>

      {/* Tooltip — rendered as HTML outside the SVG for correct theme + font rendering */}
      {hoveredPt && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${ttLeftPct}%`,
            top: `${ttTopPct}%`,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          {/* Card */}
          <div
            className="rounded-lg overflow-hidden shadow-xl"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              minWidth: '116px',
            }}
          >
            {/* Gold accent top bar */}
            <div style={{ height: '2px', background: GOLD }} />
            <div className="px-3 py-2">
              <p className="font-sans text-[11px] font-bold mb-1" style={{ color: GOLD }}>
                {formatDay(hoveredPt.day)}
              </p>
              <p className="font-sans text-[13px] font-semibold text-text-primary leading-tight">
                {formatUsdFull(hoveredPt.revenue)}
              </p>
              <p className="font-sans text-[11px] text-text-muted mt-0.5">
                {hoveredPt.orderCount} {hoveredPt.orderCount === 1 ? 'pedido' : 'pedidos'}
              </p>
            </div>
          </div>
          {/* Caret */}
          <div
            className="mx-auto"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid var(--color-border)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
