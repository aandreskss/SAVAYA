'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

// Fires a GA4 page_view on every client-side navigation
function PageViewTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', gaId, { page_path: url })
    }
  }, [pathname, searchParams, gaId])

  return null
}

type Props = {
  ga4Id?: string
  metaPixelId?: string
  // Nonce from CSP middleware — required for inline scripts when 'unsafe-inline' is absent.
  // Passed from the server layout that reads the x-nonce request header.
  nonce?: string
}

export function AnalyticsProvider({ ga4Id, metaPixelId, nonce }: Props) {
  return (
    <>
      {/* ── GA4 ── */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script id="ga4-init" strategy="afterInteractive" nonce={nonce}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}', { send_page_view: false });
            `}
          </Script>
          <Suspense fallback={null}>
            <PageViewTracker gaId={ga4Id} />
          </Suspense>
        </>
      )}

      {/* ── Meta Pixel ── */}
      {metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive" nonce={nonce}>
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  )
}
