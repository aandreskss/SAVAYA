/**
 * Layout for all /hombre/* pages.
 * The inline script runs synchronously before React hydrates, setting
 * data-gender="hombre" on <html> immediately so CSS vars switch to the
 * SVY dark theme before any paint — no flash of the light (women's) theme.
 * The nonce comes from the CSP middleware (x-nonce header) and must be
 * included so the script-src 'nonce-...' directive allows this inline script.
 */
import { headers } from 'next/headers'

export default async function HombreLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <>
      {/* Anti-flash: set gender before first paint */}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.dataset.gender='hombre'`,
        }}
      />
      {children}
    </>
  )
}
