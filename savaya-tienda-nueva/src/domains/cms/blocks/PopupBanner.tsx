'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { ActivePopup } from '../repository'

export function PopupBanner({
  id,
  imageUrl,
  ctaText,
  ctaUrl,
  delaySeconds,
  showOnPages,
  maxShowsPerSession,
  updatedAt,
}: ActivePopup) {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // If restricted to specific pages, check current path
    if (showOnPages && showOnPages.length > 0) {
      const matches = showOnPages.some((p) => pathname === p || pathname.startsWith(p + '/'))
      if (!matches) return
    }

    // Key includes updatedAt so admin edits reset the counter
    const key = `popup_shown_${id}_${new Date(updatedAt).getTime()}`
    const shown = parseInt(sessionStorage.getItem(key) ?? '0', 10)
    if (shown >= maxShowsPerSession) return

    const timer = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem(key, String(shown + 1))
    }, delaySeconds * 1000)

    return () => clearTimeout(timer)
  }, [id, updatedAt, delaySeconds, maxShowsPerSession, showOnPages, pathname])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setVisible(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-surface shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 384px"
            priority
          />
        </div>

        {/* CTA */}
        {ctaText && ctaUrl && (
          <div className="p-4 bg-surface">
            <Link
              href={ctaUrl}
              onClick={() => setVisible(false)}
              className="block w-full text-center py-3 px-6 bg-accent-gold font-sans font-medium text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
