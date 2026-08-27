import { headers } from 'next/headers'
import { Navbar } from '@/domains/layout/Navbar'
import { Footer } from '@/domains/layout/Footer'
import { SearchOverlay } from '@/domains/layout/SearchOverlay'
import { GenderSync } from '@/domains/layout/GenderSync'
import { CartProvider } from '@/domains/cart/components/CartProvider'
import { CartDrawer } from '@/domains/cart/components/CartDrawer'
import { AnalyticsProvider } from '@/domains/analytics/AnalyticsProvider'
import { getAnnouncementBarSection, getActivePopup } from '@/domains/cms/repository'
import { AnnouncementBar } from '@/domains/cms/blocks/AnnouncementBar'
import { PopupBanner } from '@/domains/cms/blocks/PopupBanner'
import { ToastContainer } from '@/shared/ui/Toast'
import type { BlockContent } from '@/domains/cms/block-schemas'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const [nonce, announcementSection, activePopup] = await Promise.all([
    headers().then((h) => h.get('x-nonce') ?? ''),
    getAnnouncementBarSection(),
    getActivePopup(now),
  ])

  return (
    <CartProvider>
      <AnalyticsProvider
        ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
        metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
        nonce={nonce}
      />
      <GenderSync />
      <div className="min-h-screen flex flex-col">
        {/* Announcement bar — sits above the sticky navbar, scrolls away */}
        {announcementSection && (
          <AnnouncementBar
            {...(announcementSection.content as BlockContent<'announcement_bar'>)}
          />
        )}
        <Navbar />
        <SearchOverlay />
        <CartDrawer />
        {/* id="main-content" is the skip-to-content target from root layout */}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <ToastContainer />
      {activePopup && <PopupBanner {...activePopup} />}
    </CartProvider>
  )
}
