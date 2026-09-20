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
      >{`(function(){var collector="https://sync-lead-eight.vercel.app/api/collect/4bcfefdb0d9ce9223485776e1eb29f06287ff496865e88f6b977aedd13547279";function send(n,p){var b={};if(p&&typeof p==="object")Object.keys(p).forEach(function(k){b[k]=true;});fetch(collector,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventName:n,pageUrl:window.location.href,environment:"production",parameters:b})});}window.__synclead_collect=send;function wrap(orig){return function(){var a=Array.prototype.slice.call(arguments);if(a[0]==="track"||a[0]==="trackCustom")send(a[1],a[2]||{});return orig.apply(this,arguments);};}if(typeof window.fbq==="function"){window.fbq=wrap(window.fbq);}else{Object.defineProperty(window,"fbq",{configurable:true,set:function(v){Object.defineProperty(window,"fbq",{configurable:true,writable:true,value:typeof v==="function"?wrap(v):v});}});}})()`}</Script>
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
