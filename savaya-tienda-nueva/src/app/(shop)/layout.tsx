import { headers } from 'next/headers'
import { Navbar } from '@/domains/layout/Navbar'
import { Footer } from '@/domains/layout/Footer'
import { SearchOverlay } from '@/domains/layout/SearchOverlay'
import { GenderSync } from '@/domains/layout/GenderSync'
import { CartProvider } from '@/domains/cart/components/CartProvider'
import { CartDrawer } from '@/domains/cart/components/CartDrawer'
import { AnalyticsProvider } from '@/domains/analytics/AnalyticsProvider'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <CartProvider>
      <AnalyticsProvider
        ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
        metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
        nonce={nonce}
      />
      <GenderSync />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <SearchOverlay />
        <CartDrawer />
        {/* id="main-content" is the skip-to-content target from root layout */}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}
