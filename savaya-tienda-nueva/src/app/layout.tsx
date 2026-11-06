import type { Metadata } from 'next'
import { Inter, Archivo } from 'next/font/google'
import { ThemeSync } from '@/domains/layout/ThemeSync'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { headers } from 'next/headers'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
})

const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'
const BASE_URL = rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'SAVAYA — Marca tu moda', template: '%s | SAVAYA' },
  description: 'Calzado femenino venezolano de alta calidad. Valencia, Carabobo. Sandalias, tacones, botas y más.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    siteName: 'SAVAYA',
    title: 'SAVAYA — Marca tu moda',
    description: 'Calzado femenino venezolano de alta calidad. Valencia, Carabobo.',
    url: BASE_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SAVAYA — Calzado venezolano',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@savayavzla',
    creator: '@savayavzla',
    title: 'SAVAYA — Marca tu moda',
    description: 'Calzado femenino venezolano de alta calidad. Valencia, Carabobo.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SAVAYA — Calzado venezolano',
      },
    ],
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
}

// Runs synchronously before React hydration to prevent theme flash
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('savaya-theme'),g=localStorage.getItem('savaya-gender');if(t==='dark')document.documentElement.dataset.theme='dark';if(g==='hombre')document.documentElement.dataset.gender='hombre';}catch(e){}})()`

// Organization structured data — appears on every page for Google Knowledge Graph
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  '@id': `${BASE_URL}/#organization`,
  name: 'SAVAYA',
  url: BASE_URL,
  description: 'Calzado femenino venezolano de alta calidad. Valencia, Carabobo.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Calle 73, CC Multi Tienda God is Good, local A-4',
    addressLocality: 'Valencia',
    addressRegion: 'Carabobo',
    addressCountry: 'VE',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: '+584141100100',
    availableLanguage: 'Spanish',
  },
  sameAs: ['https://www.instagram.com/savayavzla/'],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="es" className={`${inter.variable} ${archivo.variable}`}>
      <head>
        {/* Anti-flash: applies persisted theme before React renders */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* GTM dataLayer init — must run before gtm.js loads */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());`,
          }}
        />
        {/* Organization structured data */}
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        {/* GTM noscript fallback — fires iframe-based tags when JS is disabled */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MSG57HFV"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Skip to main content — WCAG 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] btn-primary"
        >
          Saltar al contenido principal
        </a>
        <ThemeSync />
        {children}
        <Analytics />
        <SpeedInsights />
        {/* Google Tag Manager */}
        <Script
          src="https://www.googletagmanager.com/gtm.js?id=GTM-MSG57HFV"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
