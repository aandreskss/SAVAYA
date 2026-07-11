import Link from 'next/link'
import Image from 'next/image'
import FooterQuote from './FooterQuote'

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.35a8.25 8.25 0 0 0 4.82 1.55V7.45a4.85 4.85 0 0 1-1.05-.76z" />
    </svg>
  )
}

function WhatsAppIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

function WhatsAppIconLarge() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

const ALL_PAYMENT_METHODS: { key: string; label: string }[] = [
  { key: 'zelle',           label: 'Zelle' },
  { key: 'binance',         label: 'Binance Pay' },
  { key: 'usdt',            label: 'USDT' },
  { key: 'pago_movil',      label: 'Pago Móvil' },
  { key: 'bank_transfer_ve', label: 'Transferencia Bancaria' },
  { key: 'efectivo',        label: 'Efectivo' },
]

// SAVAYA: solo calzado femenino
const ALL_CATEGORY_LINKS = [
  { label: 'Casuales',           href: '/casuales',           key: 'casuales',           className: '' },
  { label: 'Deportivos',         href: '/deportivos',         key: 'deportivos',         className: '' },
  { label: 'De vestir',          href: '/de-vestir',          key: 'de-vestir',          className: '' },
  { label: 'Nuevas colecciones', href: '/nuevas-colecciones', key: 'nuevas-colecciones', className: 'text-gold' },
  { label: 'Más vendidos',       href: '/mas-vendidos',       key: 'mas-vendidos',       className: '' },
  { label: 'Descuentos',         href: '/descuentos',         key: 'descuentos',         className: 'text-sale' },
]

interface FooterProps {
  disabledCategories?: string[]
  whatsappNumber?: string
  enabledPaymentMethods?: string[] | null
}

export default function Footer({
  disabledCategories = [],
  whatsappNumber = '584141100100',
  enabledPaymentMethods,
}: FooterProps) {
  const disabled = new Set(disabledCategories)
  const visibleCategories = ALL_CATEGORY_LINKS.filter((c) => !disabled.has(c.key))

  // If enabledPaymentMethods is set and non-empty, show only those; otherwise show all
  const visiblePaymentMethods =
    enabledPaymentMethods && enabledPaymentMethods.length > 0
      ? ALL_PAYMENT_METHODS.filter((m) => enabledPaymentMethods.includes(m.key))
      : ALL_PAYMENT_METHODS
  const waHref = `https://wa.me/${whatsappNumber}?text=Hola%2C%20tengo%20una%20consulta%20sobre%20mi%20pedido`

  return (
    <>
      <footer className="bg-accent text-white">
        <div className="px-4 md:px-8 pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="block mb-4" aria-label="Savaya — inicio">
                <Image src="/logo.png" alt="Savaya" width={160} height={160} className="h-40 w-40 object-contain" />
              </Link>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Calzado femenino venezolano. Elegancia, comodidad y estilo para la mujer que marca su moda.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://instagram.com/savayavzla" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/50 hover:text-white transition-colors">
                  <InstagramIcon />
                </a>
                <a href="https://facebook.com/savayavzla" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/50 hover:text-white transition-colors">
                  <FacebookIcon />
                </a>
                <a href="https://tiktok.com/@savayavzla" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-white/50 hover:text-white transition-colors">
                  <TikTokIcon />
                </a>
                <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white/50 hover:text-white transition-colors">
                  <WhatsAppIconSmall />
                </a>
              </div>
            </div>

            {/* Categorías */}
            <div>
              <p className="font-heading font-bold text-[11px] uppercase tracking-widest text-white/40 mb-5">Categorías</p>
              <ul className="flex flex-col gap-3 text-sm text-white/70">
                {visibleCategories.map(({ label, href, className }) => (
                  <li key={href}>
                    <Link href={href} className={`hover:text-white transition-colors ${className}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <p className="font-heading font-bold text-[11px] uppercase tracking-widest text-white/40 mb-5">Soporte</p>
              <ul className="flex flex-col gap-3 text-sm text-white/70">
                <li><Link href="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
                <li><Link href="/politica-de-envios" className="hover:text-white transition-colors">Política de Envíos</Link></li>
                <li><Link href="/politica-de-devoluciones" className="hover:text-white transition-colors">Devoluciones</Link></li>
                <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
                <li>
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
                    WhatsApp <span className="text-[10px] text-green-400 leading-none">●</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <p className="font-heading font-bold text-[11px] uppercase tracking-widest text-white/40 mb-5">Empresa</p>
              <ul className="flex flex-col gap-3 text-sm text-white/70">
                <li><Link href="/sobre-nosotros" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
                <li><Link href="/terminos-y-condiciones" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
                <li><Link href="/politica-de-privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/cuenta" className="hover:text-white transition-colors">Mi Cuenta</Link></li>
                <li><Link href="/cuenta/pedidos" className="hover:text-white transition-colors">Mis Pedidos</Link></li>
              </ul>
            </div>
          </div>

          {/* Payment methods + Venezuelan quote */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-[11px] font-heading font-bold uppercase tracking-widest text-white/30 mb-4">Métodos de pago</p>
              <div className="flex flex-wrap gap-2">
                {visiblePaymentMethods.map(({ key, label }) => (
                  <span
                    key={key}
                    className="px-3 py-1 border border-white/15 text-white/40 text-xs font-heading rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <FooterQuote />
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Savaya. Todos los derechos reservados.</p>
          <p>Hecho con ♥ en Venezuela <span className="text-2xl">🇻🇪</span></p>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-16 right-6 z-40 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
      >
        <WhatsAppIconLarge />
      </a>
    </>
  )
}
