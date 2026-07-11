'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice } from '@/lib/utils'

export interface SalesDataPoint {
  day: string
  total: number
}

interface TooltipPayload {
  value?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-light rounded shadow-sm px-3 py-2">
      <p className="text-[11px] text-gray-text font-body mb-1">{label}</p>
      <p className="text-sm font-heading font-semibold text-black">
        {formatPrice(payload[0].value ?? 0)}
      </p>
    </div>
  )
}

export default function SalesChart({ data }: { data: SalesDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1a1a2e" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#1a1a2e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#888888', fontFamily: 'var(--font-inter)' }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#888888', fontFamily: 'var(--font-inter)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
          }
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e5e5', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#1a1a2e"
          strokeWidth={2}
          fill="url(#salesGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#1a1a2e', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
