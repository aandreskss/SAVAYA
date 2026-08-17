/**
 * Layout for all /hombre/* pages.
 * The inline script runs synchronously before React hydrates, setting
 * data-gender="hombre" on <html> immediately so CSS vars switch to the
 * SVY dark theme before any paint — no flash of the light (women's) theme.
 */
export default function HombreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Anti-flash: set gender before first paint */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.dataset.gender='hombre'`,
        }}
      />
      {children}
    </>
  )
}
