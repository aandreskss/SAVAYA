'use client'

import { useState } from 'react'
import type { SalesChartPoint } from '@/domains/admin/dashboard/types'

function formatUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function formatDay(day: string) {
  // day = YYYY-MM-DD
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

interface Props {
  data: SalesChartPoint[]
}

export function SalesLineChart({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
        Sin datos para este período
      </div>
    )
  }

  const W = 600
  const H = 180
  const PL = 56
  const PR = 16
  const PT = 16
  const PB = 36

  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW / 2
  const xOffset = data.length === 1 ? chartW / 2 : 0

  const pts = data.map((d, i) => ({
    x: PL + xOffset + i * xStep,
    y: PT + chartH - (d.revenue / maxRevenue) * chartH,
    ...d,
  }))

  const polyPoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath =
    pts.length > 1
      ? `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ${pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + chartH).toFixed(1)} Z`
      : ''

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  // X-axis: show every Nth label to avoid overlap
  const maxXLabels = 8
  const xLabelStep = data.length > maxXLabels ? Math.ceil(data.length / maxXLabels) : 1

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="dash-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((frac) => (
          <line
            key={frac}
            x1={PL}
            y1={PT + frac * chartH}
            x2={W - PR}
            y2={PT + frac * chartH}
            stroke="#000"
            strokeOpacity="0.06"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#dash-area-grad)" />}

        {/* Line */}
        {pts.length > 1 && (
          <polyline
            points={polyPoints}
            fill="none"
            stroke="#000"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Data points + hover targets */}
        {pts.map((p, i) => (
          <g key={i}>
            {/* Large transparent hit area */}
            <rect
              x={p.x - xStep / 2}
              y={PT}
              width={xStep}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Dot — always shown */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 4 : 2.5}
              fill="#000"
              style={{ transition: 'r 0.1s' }}
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
              fill="#000"
              fillOpacity="0.4"
            >
              {formatDay(p.day)}
            </text>
          ) : null,
        )}

        {/* Y-axis labels */}
        {[1, 0.5, 0].map((frac) => (
          <text
            key={frac}
            x={PL - 6}
            y={PT + (1 - frac) * chartH + 4}
            textAnchor="end"
            fontSize="10"
            fill="#000"
            fillOpacity="0.4"
          >
            {formatUsd(maxRevenue * frac)}
          </text>
        ))}

        {/* Hover tooltip */}
        {hovered !== null && pts[hovered] && (
          <g>
            {/* Vertical guide */}
            <line
              x1={pts[hovered].x}
              y1={PT}
              x2={pts[hovered].x}
              y2={PT + chartH}
              stroke="#000"
              strokeOpacity="0.15"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {/* Tooltip box */}
            <foreignObject
              x={Math.min(pts[hovered].x + 8, W - 120)}
              y={Math.max(pts[hovered].y - 40, PT)}
              width="110"
              height="48"
            >
              <div
                // @ts-expect-error – xmlns required for foreignObject
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  background: '#111',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  lineHeight: '1.5',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ fontWeight: 600 }}>{formatDay(pts[hovered].day)}</div>
                <div>{formatUsd(pts[hovered].revenue)}</div>
                <div style={{ opacity: 0.7 }}>{pts[hovered].orderCount} pedidos</div>
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  )
}
