import type { Metadata } from 'next'
import { Rubik, Bebas_Neue } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

// ── Tipografías Savaya ────────────────────────────────────────────────────────
// Rubik: cuerpo de texto y subtítulos
const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

// Bebas Neue: títulos, tagline "Marca tu moda"
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  weight: ['400'],
  display: 'swap',
})

// ── SEO & Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Savaya — Calzado Femenino en Venezuela | Marca tu Moda',
    template: '%s | Savaya',
  },
  description:
    'Tienda online de calzado femenino en Venezuela. Zapatos casuales, deportivos y de vestir. Envío a todo el país. Paga con Zelle, Binance o USDT.',
  keywords: [
    'zapatos mujer Venezuela',
    'calzado femenino Venezuela',
    'zapatos casuales Venezuela',
    'zapatos de vestir Venezuela',
    'tienda de zapatos online Venezuela',
    'Savaya',
    'calzado Valencia Carabobo',
    'zapatos Zelle',
    'zapatos Binance Venezuela',
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    siteName: 'Savaya',
    url: APP_URL,
    title: 'Savaya — Calzado Femenino en Venezuela',
    description:
      'Zapatos casuales, deportivos y de vestir para la mujer venezolana. Paga con Zelle, Binance o USDT. Envíos a todo Venezuela.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Savaya — Calzado Femenino | Marca tu Moda',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Savaya — Calzado Femenino en Venezuela',
    description:
      'Zapatos casuales, deportivos y de vestir. Paga con Zelle, Binance o USDT. Envíos a todo Venezuela.',
    images: ['/og-default.jpg'],
  },
}

// ── Schema.org ────────────────────────────────────────────────────────────────
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Savaya',
  alternateName: 'Savaya Venezuela',
  url: APP_URL,
  logo: `${APP_URL}/logo.png`,
  image: `${APP_URL}/og-default.jpg`,
  description:
    'Tienda online de calzado femenino en Venezuela. Zapatos casuales, deportivos y de vestir pensados para la mujer venezolana.',
  telephone: '+584141100100',
  email: 'Savayarrss@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Calle 73, CC Multi Tienda God is Good, planta baja local A-4',
    addressLocality: 'Valencia',
    addressRegion: 'Carabobo',
    addressCountry: 'VE',
  },
  areaServed: { '@type': 'Country', name: 'Venezuela' },
  currenciesAccepted: 'USD, VES',
  paymentAccepted: 'Zelle, Binance Pay, USDT, Transferencia bancaria, Pago móvil, Efectivo',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+584141100100',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
  },
  sameAs: [
    'https://www.instagram.com/Savaya',
    'https://www.instagram.com/Savayavzla',
    `https://wa.me/584141100100`,
  ],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Savaya',
  url: APP_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${APP_URL}/buscar?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={`${rubik.variable} ${bebasNeue.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />

        {/*
          ═══════════════════════════════════════════════════════
          META PIXEL — Savaya
          Pixel ID: 27355395054120748
          El mismo Pixel que usan las campañas — toda la data
          (campañas + tienda) alimenta la misma cuenta de anuncios.
          ═══════════════════════════════════════════════════════
        */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body className="min-h-screen flex flex-col bg-white text-black">
        {children}
      </body>
    </html>
  )
}
