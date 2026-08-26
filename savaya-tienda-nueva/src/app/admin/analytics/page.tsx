import { SalesReportWidget } from '@/domains/admin/analytics/SalesReportWidget'

export default function AnalyticsAdminPage() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Analytics</h1>
        <p className="text-text-secondary text-sm">Estado de integraciones y accesos rápidos</p>
      </div>

      {/* Integration status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Google Analytics 4</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-pill ${gaId ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${gaId ? 'bg-success' : 'bg-warning'}`} />
              {gaId ? 'Activo' : 'Sin configurar'}
            </span>
          </div>
          <p className="text-xs text-text-secondary">{gaId ?? 'Agrega NEXT_PUBLIC_GA_MEASUREMENT_ID en Vercel'}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Meta Pixel</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-pill ${pixelId ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pixelId ? 'bg-success' : 'bg-warning'}`} />
              {pixelId ? 'Activo' : 'Sin configurar'}
            </span>
          </div>
          <p className="text-xs text-text-secondary">{pixelId ?? 'Agrega NEXT_PUBLIC_META_PIXEL_ID en Vercel'}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Meta CAPI (servidor)</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-pill bg-success/15 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Integrado
            </span>
          </div>
          <p className="text-xs text-text-secondary">Eventos de compra enviados server-side con deduplicación</p>
        </div>
      </div>

      {/* External dashboards */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium mb-4">Reportes externos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-border-hover hover:bg-surface-2 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 text-text-secondary group-hover:text-text-primary transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Google Analytics 4</p>
              <p className="text-xs text-text-secondary">Tráfico, sesiones, conversiones</p>
            </div>
            <svg className="ml-auto text-text-muted" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11 11 3M7 3h4v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>

          <a
            href="https://business.facebook.com/adsmanager"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-border-hover hover:bg-surface-2 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 text-text-secondary group-hover:text-text-primary transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M9.5 5H8a1.5 1.5 0 0 0-1.5 1.5v7M6.5 8.5h3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Meta Ads Manager</p>
              <p className="text-xs text-text-secondary">Campañas, ROAS, audiencias</p>
            </div>
            <svg className="ml-auto text-text-muted" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11 11 3M7 3h4v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Sales report download */}
      <SalesReportWidget />

      {/* Info */}
      <div className="mt-6 bg-accent-gold-soft border border-accent-gold/20 rounded-xl px-4 py-3 text-sm text-text-secondary">
        Los datos de ventas y pedidos están disponibles en el <strong className="text-text-primary">Dashboard</strong> principal con KPIs en tiempo real.
        GA4 y Meta Pixel registran automáticamente los eventos de navegación, carrito y compra.
      </div>
    </div>
  )
}
