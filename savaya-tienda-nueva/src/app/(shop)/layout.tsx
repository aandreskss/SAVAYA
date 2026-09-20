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
      >{`(function(){var collector="https://sync-lead-eight.vercel.app/api/collect/de3f204ae3e78bd02bca59adbe09e35f02d6635dbe6f6289";function sendToDiagnostic(eventName,params){var boolParams={};if(params&&typeof params==="object"){Object.keys(params).forEach(function(k){boolParams[k]=true;});}fetch(collector,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventName:eventName,pageUrl:window.location.href,environment:"production",parameters:boolParams})});}window.__synclead_collect=sendToDiagnostic;function wrapFbq(original){if(original&&original._synclead_wrapped)return original;var wrapper=function(){var args=Array.prototype.slice.call(arguments);if(args[0]==="track"||args[0]==="trackCustom"){sendToDiagnostic(args[1],args[2]||{});}if(typeof wrapper.callMethod==="function"){return wrapper.callMethod.apply(wrapper,args);}return original.apply(this,arguments);};try{var skip={length:1,name:1,prototype:1,caller:1,arguments:1};Object.getOwnPropertyNames(original).forEach(function(key){if(skip[key])return;Object.defineProperty(wrapper,key,{get:function(){return original[key];},set:function(v){original[key]=v;},configurable:true,enumerable:true});});}catch(e){}wrapper._synclead_wrapped=true;return wrapper;}if(typeof window.fbq==="function"){window.fbq=wrapFbq(window.fbq);try{if(window._fbq!==window.fbq)window._fbq=window.fbq;}catch(e){}}else{Object.defineProperty(window,"fbq",{configurable:true,set:function(val){var wrapped=typeof val==="function"?wrapFbq(val):val;Object.defineProperty(window,"fbq",{configurable:true,writable:true,value:wrapped});try{if(window._fbq!==window.fbq)window._fbq=window.fbq;}catch(e){};}});}})()`}</Script>
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
