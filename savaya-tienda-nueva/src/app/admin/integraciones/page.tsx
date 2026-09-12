import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function IntegracionesIndexPage() {
  await requireAdminPermission('integrations:manage')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'

  const cards = [
    {
      href: '/admin/integraciones/odoo',
      title: 'Odoo ERP',
      description: 'Sincronización de inventario entre Odoo y la tienda. Vinculado por SKU.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="13" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="1" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 5h4M5 9v4M17 9v4M13 17H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      tag: 'Inventario',
    },
    {
      href: '/admin/integraciones/cloudinary',
      title: 'Cloudinary · Notificaciones',
      description: `Log de eventos de assets: eliminaciones, uploads y cambios detectados vía webhook. Útil para auditar borrados inesperados.`,
      webhookUrl: `${appUrl}/api/webhooks/cloudinary`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M17 14.5a4 4 0 0 0-3-6.8A6 6 0 1 0 6 15h11a3 3 0 0 0 0-0.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M11 12v4M9 14l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tag: 'Assets',
    },
  ]

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Integraciones</h1>
          <p className="text-sm text-text-secondary">
            Conexiones externas activas en la tienda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-surface-2 rounded-2xl p-6 border border-border hover:border-accent-gold/40 transition-colors flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/15 text-accent-gold shrink-0">
                  {card.icon}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary bg-white/5 px-2 py-1 rounded-full mt-0.5">
                  {card.tag}
                </span>
              </div>

              <div>
                <h2 className="text-base font-semibold text-text-primary mb-1 group-hover:text-accent-gold transition-colors">
                  {card.title}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {card.description}
                </p>
              </div>

              {card.webhookUrl && (
                <div className="mt-auto pt-3 border-t border-border/50">
                  <p className="text-[11px] text-text-secondary font-mono truncate">
                    {card.webhookUrl}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-accent-gold font-medium">
                Ver detalles
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
