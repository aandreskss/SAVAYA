import Script from 'next/script'
import { headers } from 'next/headers'
import { getSettingValue } from '@/domains/admin/settings/repository'
import { Navbar } from '@/domains/layout/Navbar'
import { Footer } from '@/domains/layout/Footer'
import { SearchOverlay } from '@/domains/layout/SearchOverlay'
import { GenderSync } from '@/domains/layout/GenderSync'
import { CartProvider } from '@/domains/cart/components/CartProvider'
import { CartDrawer } from '@/domains/cart/components/CartDrawer'
import { AnalyticsProvider } from '@/domains/analytics/AnalyticsProvider'
import { SiteTracker } from '@/domains/analytics/SiteTracker'
import { getAnnouncementBarSection, getActivePopup } from '@/domains/cms/repository'
import { AnnouncementBar } from '@/domains/cms/blocks/AnnouncementBar'
import { PopupBanner } from '@/domains/cms/blocks/PopupBanner'
import { ToastContainer } from '@/shared/ui/Toast'
import { ButterflyEffect } from '@/domains/layout/ButterflyEffect'
import type { BlockContent } from '@/domains/cms/block-schemas'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const [nonce, announcementSection, activePopup, dbPixelId] = await Promise.all([
    headers().then((h) => h.get('x-nonce') ?? ''),
    getAnnouncementBarSection(),
    getActivePopup(now),
    getSettingValue('meta_pixel_id').catch(() => null),
  ])
  const metaPixelId = dbPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <CartProvider>
      <AnalyticsProvider
        ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
        metaPixelId={metaPixelId}
        nonce={nonce}
      />
      <SiteTracker />
      <Script
        id="synclead-collector"
        strategy="afterInteractive"
        nonce={nonce}
      >{`(function(){var token="77f5e752f9458eab1d4c2ab4c46180d9586dc5705f3cbc33d88307ec10d08989";var collector="https://sync-lead-eight.vercel.app/api/collect/"+token;function send(e,p){fetch(collector,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventName:e,pageUrl:window.location.href,environment:"production",parameters:p||{}})})}window.__synclead_collect=send})()`}</Script>
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
      <ButterflyEffect />
    </CartProvider>
  )
}
