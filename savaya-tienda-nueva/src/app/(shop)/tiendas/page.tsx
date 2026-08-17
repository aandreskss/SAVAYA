import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Tiendas y distribuidores | SAVAYA',
  description:
    'Encuentra dónde comprar calzado SAVAYA en Venezuela. Tienda física en Valencia, Carabobo, y distribuidores autorizados.',
  alternates: { canonical: `${BASE_URL}/tiendas` },
}

export default function TiendasPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">
        Tiendas y distribuidores
      </h1>
      <p className="text-text-secondary mb-12">
        Encuentra SAVAYA en nuestra tienda oficial y en distribuidores autorizados en Venezuela.
      </p>

      {/* Tienda oficial */}
      <section className="mb-12">
        <h2 className="font-display text-xl uppercase tracking-wide mb-6">Tienda oficial</h2>
        <div className="border border-border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-medium text-base">SAVAYA Valencia</h3>
              <p className="text-text-secondary text-sm mt-1">Tienda principal</p>
            </div>
            <span className="inline-block bg-accent-gold text-text-primary-inverse text-xs px-3 py-1 rounded-full">
              Oficial
            </span>
          </div>
          <address className="not-italic text-sm text-text-secondary space-y-1 mb-5">
            <p>CC Multi Tienda God is Good, local A-4</p>
            <p>Calle 73, Valencia, Carabobo, Venezuela</p>
          </address>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-text-secondary w-24 shrink-0">Horario:</span>
              <span>Lunes a sábado, 10:00 AM – 6:00 PM</span>
            </div>
            <div className="flex gap-2">
              <span className="text-text-secondary w-24 shrink-0">WhatsApp:</span>
              <a
                href="https://wa.me/584141100100"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                +58 414-1100100
              </a>
            </div>
            <div className="flex gap-2">
              <span className="text-text-secondary w-24 shrink-0">Instagram:</span>
              <a
                href="https://instagram.com/savayavzla"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                @savayavzla
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Distribuidores */}
      <section className="mb-12">
        <h2 className="font-display text-xl uppercase tracking-wide mb-4">
          Distribuidores autorizados
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          Próximamente publicaremos el listado completo de distribuidores autorizados por ciudad.
          Por ahora, para consultar si hay un distribuidor cerca de ti, escríbenos por WhatsApp.
        </p>
        <a
          href="https://wa.me/584141100100?text=Hola%2C%20quisiera%20saber%20si%20hay%20un%20distribuidor%20SAVAYA%20cerca%20de%20m%C3%AD."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1ebe5d] transition-colors"
        >
          Consultar distribuidores
        </a>
      </section>

      {/* CTA mayorista */}
      <div className="border border-border rounded-xl p-8 text-center">
        <p className="font-medium mb-2">¿Quieres vender SAVAYA en tu tienda?</p>
        <p className="text-text-secondary text-sm mb-5">
          Si tienes una tienda de calzado o ropa y te interesa convertirte en distribuidor
          autorizado, conoce nuestro programa mayorista.
        </p>
        <a
          href="/ventas-al-mayor"
          className="inline-block bg-accent-gold text-text-primary-inverse px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-gold-hover transition-colors"
        >
          Ventas al mayor
        </a>
      </div>
    </main>
  )
}
