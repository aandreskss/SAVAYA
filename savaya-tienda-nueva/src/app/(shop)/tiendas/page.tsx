import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Tiendas y distribuidores | SAVAYA',
  description:
    'Encuentra dónde comprar calzado SAVAYA en Venezuela. Tienda física en Valencia, Carabobo, y distribuidores autorizados.',
  alternates: { canonical: `${BASE_URL}/tiendas` },
}

export const revalidate = 86400

export default function TiendasPage() {
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'SAVAYA Valencia',
    url: BASE_URL,
    telephone: '+584141100100',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'CC Multi Tienda God is Good, local A-4, Calle 73',
      addressLocality: 'Valencia',
      addressRegion: 'Carabobo',
      addressCountry: 'VE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 10.162,
      longitude: -67.9928,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '18:00',
      },
    ],
    sameAs: ['https://instagram.com/savayavzla'],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
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
        <div className="border border-border rounded-xl p-6 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            SAVAYA cuenta con distribuidores autorizados en varias ciudades de Venezuela.
            Escríbenos por WhatsApp y te indicamos el punto de venta más cercano a ti.
          </p>
          <a
            href="https://wa.me/584141100100?text=Hola%2C%20quisiera%20saber%20si%20hay%20un%20distribuidor%20SAVAYA%20cerca%20de%20m%C3%AD."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1ebe5d] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Consultar distribuidor cercano
          </a>
        </div>
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
    </>
  )
}
