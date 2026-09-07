'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getOrCreateSessionId(): string {
  try {
    const key = 'sva_sid'
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return ''
  }
}

export function SiteTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    try {
      const sessionId = getOrCreateSessionId()
      const referrer = document.referrer || null
      fetch('/api/track/pv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname, referrer, sessionId }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // Silent — tracking must never break the site
    }
  }, [pathname])

  return null
}
