'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import type { DashboardPeriod } from '@/domains/admin/dashboard/period'

const OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'month', label: 'Este mes' },
]

export function PeriodSelector({ current }: { current: DashboardPeriod }) {
  const router = useRouter()

  return (
    <div
      role="group"
      aria-label="Período del dashboard"
      className="flex gap-0.5 bg-surface border border-border rounded-lg p-1"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={opt.value === current}
          onClick={() => router.push(`/admin?period=${opt.value}`)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-100',
            opt.value === current
              ? 'bg-accent-gold text-text-primary-inverse'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/8',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
