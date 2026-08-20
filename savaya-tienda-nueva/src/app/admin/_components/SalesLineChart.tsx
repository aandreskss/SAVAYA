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

  const W = 640
  const H = 200
  const PL = 52
  const PR = 20
  const PT = 16
  const PB = 32

  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW
  const xOffset = data.length === 1 ? chartW / 2 : 0

  const pts = data.map((d, i) => ({
    x: PL + xOffset + i * xStep,
    y: PT + chartH - (d.revenue / maxRevenue) * chartH,
    ...d,
  }))

  const linePath = smoothBezierPath(pts)

  // Area: close the smooth path at the bottom
  const areaPath =
    pts.length > 1
      ? `${linePath} L ${pts[pts.length - 1].x.toFixed(2)},${(PT + chartH).toFixed(2)} L ${pts[0].x.toFixed(2)},${(PT + chartH).toFixed(2)} Z`
      : ''

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  // X-axis: limit labels to avoid overlap
  const maxXLabels = 7
  const xLabelStep = data.length > maxXLabels ? Math.ceil(data.length / maxXLabels) : 1

  const hoveredPt = hovered !== null ? pts[hovered] : null

  // Tooltip clamping
  const ttW = 118
  const ttH = 56
  const ttX = hoveredPt
    ? Math.min(Math.max(hoveredPt.x - ttW / 2, PL), W - PR - ttW)
    : 0
  const ttY = hoveredPt
    ? Math.max(hoveredPt.y - ttH - 12, PT)
    : 0

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          {/* Area gradient — gold tint that reads in both themes */}
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
            <stop offset="75%" stopColor={GOLD} stopOpacity="0.04" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter on the line */}
          <filter id={`${uid}-glow`} x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip to chart area */}
          <clipPath id={`${uid}-clip`}>
            <rect x={PL} y={PT} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((frac) => (
          <line
            key={frac}
            x1={PL}
            y1={(PT + frac * chartH).toFixed(1)}
            x2={W - PR}
            y2={(PT + frac * chartH).toFixed(1)}
            style={{ stroke: 'var(--color-border)', strokeOpacity: frac === 0 ? 0.8 : 0.5 }}
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#${uid}-area)`}
            clipPath={`url(#${uid}-clip)`}
          />
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
            x1={hoveredPt.x}
            y1={PT}
            x2={hoveredPt.x}
            y2={PT + chartH}
            stroke={GOLD}
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* Hit areas + dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - xStep / 2}
              y={PT}
              width={xStep}
              height={chartH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Outer ring (hovered) */}
            {hovered === i && (
              <circle
                cx={p.x}
                cy={p.y}
                r="7"
                fill={GOLD}
                fillOpacity="0.18"
                style={{ pointerEvents: 'none' }}
              />
            )}
            {/* Dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 4 : 2.5}
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
            <text
              key={i}
              x={p.x}
              y={H - 6}
              textAnchor="middle"
              fontSize="10"
              fontFamily="inherit"
              style={{ fill: 'var(--color-text-muted)' }}
            >
              {formatDay(p.day)}
            </text>
          ) : null,
        )}

        {/* Y-axis labels */}
        {yTicks.filter((f) => f === 0 || f === 0.5 || f === 1).map((frac) => (
          <text
            key={frac}
            x={PL - 6}
            y={(PT + (1 - frac) * chartH + 4).toFixed(1)}
            textAnchor="end"
            fontSize="10"
            fontFamily="inherit"
            style={{ fill: 'var(--color-text-muted)' }}
          >
            {formatUsd(maxRevenue * frac)}
          </text>
        ))}

        {/* Tooltip */}
        {hoveredPt && (
          <foreignObject x={ttX} y={ttY} width={ttW} height={ttH}>
            <div
              // @ts-expect-error – xmlns required for foreignObject in SVG
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                borderTop: `2px solid ${GOLD}`,
                color: 'var(--color-text-primary)',
                fontSize: '11px',
                fontFamily: 'inherit',
                padding: '6px 10px',
                borderRadius: '8px',
                lineHeight: '1.55',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ fontWeight: 700, color: GOLD, marginBottom: '2px' }}>
                {formatDay(hoveredPt.day)}
              </div>
              <div style={{ fontWeight: 600 }}>{formatUsdFull(hoveredPt.revenue)}</div>
              <div style={{ opacity: 0.65, fontSize: '10px' }}>
                {hoveredPt.orderCount} {hoveredPt.orderCount === 1 ? 'pedido' : 'pedidos'}
              </div>
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  )
}
