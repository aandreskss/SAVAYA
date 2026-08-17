export type DashboardPeriod = 'today' | '7d' | '30d' | 'month'

const VALID_PERIODS: DashboardPeriod[] = ['today', '7d', '30d', 'month']

export function parsePeriod(raw: unknown): DashboardPeriod {
  if (typeof raw === 'string' && VALID_PERIODS.includes(raw as DashboardPeriod)) {
    return raw as DashboardPeriod
  }
  return '30d'
}

export function getPeriodBounds(period: DashboardPeriod): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)

  switch (period) {
    case 'today':
      return { start, end }
    case '7d':
      start.setUTCDate(start.getUTCDate() - 6)
      return { start, end }
    case '30d':
      start.setUTCDate(start.getUTCDate() - 29)
      return { start, end }
    case 'month':
      start.setUTCDate(1)
      return { start, end }
  }
}

export function getPeriodLabel(period: DashboardPeriod): string {
  const labels: Record<DashboardPeriod, string> = {
    today: 'Hoy',
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
    month: 'Este mes',
  }
  return labels[period]
}
