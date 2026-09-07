import { SalesReportWidget } from '@/domains/admin/analytics/SalesReportWidget'
import { getTrafficSummary } from '@/domains/analytics/repository'

const COUNTRY_NAMES: Record<string, string> = {
  VE: 'Venezuela', US: 'Estados Unidos', CO: 'Colombia', MX: 'México',
  ES: 'España', AR: 'Argentina', CL: 'Chile', PE: 'Perú', EC: 'Ecuador',
  PA: 'Panamá', DO: 'Rep. Dominicana', GT: 'Guatemala', CR: 'Costa Rica',
  UY: 'Uruguay', BO: 'Bolivia', PY: 'Paraguay', HN: 'Honduras', NI: 'Nicaragua',
  SV: 'El Salvador', BR: 'Brasil', PT: 'Portugal', GB: 'Reino Unido', DE: 'Alemania',
  FR: 'Francia', IT: 'Italia', CA: 'Canadá', AU: 'Australia',
}

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code
}

function formatPath(path: string): string {
  if (path === '/') return 'Inicio'
  return path
}

function MiniBarChart({ data, days }: { data: Array<{ date: string; views: number }>; days: number }) {
  const filled: Array<{ date: string; views: number }> = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const found = data.find((r) => r.date === key)
    filled.push({ date: key, views: found?.views ?? 0 })
  }

  const max = Math.max(...filled.map((d) => d.views), 1)
  const total = filled.length
  const barW = Math.max(2, Math.floor(560 / total) - 2)

  if (data.length === 0) {
    return <div className="h-20 flex items-center justify-center text-xs text-text-muted">Sin datos aún</div>
  }

  return (
    <svg viewBox="0 0 560 80" className="w-full h-20" preserveAspectRatio="none">
      {filled.map((item, i) => {
        const h = Math.max(2, (item.views / max) * 72)
        const x = i * (560 / total) + 1
        return (
          <rect
            key={item.date}
            x={x} y={80 - h}
            width={barW} height={h}
            rx="1"
            fill="var(--color-accent-gold, #C9A84C)"
            opacity={item.views === 0 ? 0.15 : 0.85}
          />
        )
      })}
    </svg>
  )
}

function HorizontalBars({ data, total }: { data: Array<{ label: string; value: number }>; total: number }) {
  if (data.length === 0) return <p className="text-xs text-text-muted py-2">Sin datos aún</p>
  return (
    <div className="space-y-2.5">
      {data.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
        return (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-text-primary truncate max-w-[65%]">{item.label}</span>
              <span className="text-text-secondary shrink-0 ml-2">
                {item.value.toLocaleString()} <span className="text-text-muted">({pct}%)</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-accent-gold/70" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function AnalyticsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const params = await searchParams
  const rawDays = parseInt(params.days ?? '30', 10)
  const validDays = [7, 30, 90].includes(rawDays) ? rawDays : 30

  const gaId = process.env.NEXT_PUBLIC_GA4_ID
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const data = await getTrafficSummary(validDays)

  const avgDaily = validDays > 0 ? Math.round(data.totalViews / validDays) : 0
  const deviceTotal = data.deviceBreakdown.reduce((s, d) => s + d.views, 0)
  const deviceData = data.deviceBreakdown.map((d) => ({
    label: d.deviceType === 'mobile' ? 'Móvil' : d.deviceType === 'tablet' ? 'Tablet' : 'Computadora',
    value: d.views,
  }))
  const browserTotal = data.browserBreakdown.reduce((s, d) => s + d.views, 0)
  const browserData = data.browserBreakdown.map((d) => ({ label: d.browser, value: d.views }))
  const countryData = data.topCountries.map((c) => ({ label: countryName(c.country), value: c.views }))
  const countryTotal = data.topCountries.reduce((s, c) => s + c.views, 0)
  const referrerData = data.topReferrers.map((r) => ({ label: r.referrer, value: r.views }))
  const referrerTotal = data.topReferrers.reduce((s, r) => s + r.views, 0)

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Analytics</h1>
          <p className="text-text-secondary text-sm">Tráfico de la tienda · zona horaria Venezuela</p>
        </div>
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`?days=${d}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                validDays === d
                  ? 'bg-surface text-text-primary shadow-sm border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {d === 7 ? '7 días' : d === 30 ? '30 días' : '90 días'}
            </a>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Visitas totales</p>
          <p className="font-display text-3xl">{data.totalViews.toLocaleString()}</p>
          <p className="text-xs text-text-muted mt-1">últimos {validDays} días</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Sesiones únicas</p>
          <p className="font-display text-3xl">{data.uniqueSessions.toLocaleString()}</p>
          <p className="text-xs text-text-muted mt-1">por pestaña / visita</p>
        </div>
        <div className="bg-surface border border-border rounded-xl col-span-2 sm:col-span-1 p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Promedio diario</p>
          <p className="font-display text-3xl">{avgDaily.toLocaleString()}</p>
          <p className="text-xs text-text-muted mt-1">visitas / día</p>
        </div>
      </div>

      {/* Daily chart */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
          Visitas por día — últimos {validDays} días
        </p>
        <MiniBarChart data={data.dailyViews} days={validDays} />
      </div>

      {/* Top pages + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-4">Páginas más vistas</p>
          {data.topPages.length === 0 ? (
            <p className="text-xs text-text-muted">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {data.topPages.map((p, i) => (
                <div key={p.path} className="flex items-center gap-3 text-xs">
                  <span className="text-text-muted w-4 shrink-0 text-right">{i + 1}</span>
                  <span className="text-text-primary truncate flex-1 font-mono text-[11px]">{formatPath(p.path)}</span>
                  <span className="text-text-secondary shrink-0">{p.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-4">Países</p>
          <HorizontalBars data={countryData} total={countryTotal} />
        </div>
      </div>

      {/* Devices + Browsers + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-4">Dispositivos</p>
          <HorizontalBars data={deviceData} total={deviceTotal} />
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-4">Navegadores</p>
          <HorizontalBars data={browserData} total={browserTotal} />
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-4">Origen del tráfico</p>
          <HorizontalBars data={referrerData} total={referrerTotal} />
          {data.topReferrers.length === 0 && (
            <p className="text-xs text-text-muted mt-2">Tráfico directo o primera sesión</p>
          )}
        </div>
      </div>

      {/* Sales report */}
      <SalesReportWidget />

      {/* External integrations */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Google Analytics 4',
            active: !!gaId,
            note: gaId ?? 'Agrega NEXT_PUBLIC_GA4_ID en Vercel',
            href: gaId ? 'https://analytics.google.com' : null,
          },
          {
            label: 'Meta Pixel',
            active: !!pixelId,
            note: pixelId ?? 'Agrega NEXT_PUBLIC_META_PIXEL_ID en Vercel',
            href: pixelId ? 'https://business.facebook.com/adsmanager' : null,
          },
          {
            label: 'Meta CAPI (servidor)',
            active: true,
            note: 'Eventos de compra server-side con deduplicación',
            href: null,
          },
        ].map((int) => (
          <div key={int.label} className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{int.label}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${int.active ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${int.active ? 'bg-success' : 'bg-warning'}`} />
                {int.active ? 'Activo' : 'Sin configurar'}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{int.note}</p>
            {int.href && (
              <a href={int.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent-gold hover:underline">
                Ver dashboard ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
