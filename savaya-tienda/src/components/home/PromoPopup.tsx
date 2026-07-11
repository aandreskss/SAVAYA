'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { PopupConfig } from '@/lib/types'

const STORAGE_KEY = 'savaya_popup_ts'
const HOURS_BETWEEN_SHOWS = 24

interface Props {
  config: PopupConfig
}

export default function PromoPopup({ config }: Props) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  const close = useCallback(() => {
    setAnimating(false)
    setTimeout(() => setVisible(false), 280)
  }, [])

  useEffect(() => {
    if (!config.is_active) return

    const delay = (config.delay_seconds ?? 3) * 1000

    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const hoursAgo = (Date.now() - parseInt(stored)) / 36e5
          if (hoursAgo < HOURS_BETWEEN_SHOWS) return
        }
      } catch {
        // localStorage no disponible (SSR safety)
      }
      setVisible(true)
      setTimeout(() => setAnimating(true), 20)
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
      } catch {}
    }, delay)

    return () => clearTimeout(timer)
  }, [config.is_active, config.delay_seconds])

  useEffect(() => {
    if (!visible) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, close])

  if (!visible) return null

  const hasImage = !!config.image_url
  const hasCode = !!config.discount_code
  const hasCta = !!(config.cta_text && config.cta_href)

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${
        animating ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative bg-white rounded-lg overflow-hidden shadow-2xl w-full max-w-md transition-all duration-300 ${
          animating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Cerrar popup"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        {hasImage && (
          <div className="relative aspect-[16/9] w-full bg-gray-bg">
            <Image
              src={config.image_url!}
              alt={config.title ?? 'Promoción'}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6">
          {/* Eyebrow */}
          {!hasImage && (
            <div className="w-10 h-1 bg-gold rounded-full mb-4" />
          )}

          {config.title && (
            <h2 className="font-display text-2xl font-bold text-black leading-tight mb-2">
              {config.title}
            </h2>
          )}

          {config.subtitle && (
            <p className="text-sm font-heading font-semibold text-accent mb-2">
              {config.subtitle}
            </p>
          )}

          {config.body && (
            <p className="text-sm text-gray-text font-body leading-relaxed mb-4">
              {config.body}
            </p>
          )}

          {/* Discount code chip */}
          {hasCode && (
            <DiscountChip code={config.discount_code!} />
          )}

          {/* CTA button */}
          {hasCta && (
            <Link
              href={config.cta_href!}
              onClick={close}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
            >
              {config.cta_text}
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="2" y1="6" x2="10" y2="6" />
                <polyline points="7 3 10 6 7 9" />
              </svg>
            </Link>
          )}

          {/* Dismiss */}
          <button
            type="button"
            onClick={close}
            className="mt-3 w-full text-xs text-gray-text hover:text-black transition-colors font-body py-1"
          >
            No gracias, cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Discount chip with copy ──────────────────────────────────────────────────

function DiscountChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-2 mb-1">
      <p className="text-[11px] text-gray-text font-body mb-1.5 uppercase tracking-wider">
        Tu código de descuento
      </p>
      <button
        type="button"
        onClick={copy}
        className="flex items-center justify-between w-full border-2 border-dashed border-gold rounded px-4 py-2.5 bg-gold/5 hover:bg-gold/10 transition-colors group"
      >
        <span className="font-heading font-black text-base tracking-widest text-black">
          {code}
        </span>
        <span className={`text-xs font-body transition-colors ${copied ? 'text-green-600' : 'text-gray-text group-hover:text-black'}`}>
          {copied ? (
            <span className="flex items-center gap-1">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copiado
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copiar
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
