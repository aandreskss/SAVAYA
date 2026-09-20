'use client'

import { useEffect, useState } from 'react'

const POLL_MS = 60_000
const MIN_SHOW = 2

export function LiveViewers({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/products/viewers?slug=${encodeURIComponent(slug)}`)
        const data = (await res.json()) as { count: number }
        if (!cancelled) setCount(data.count)
      } catch {
        // fail silently — social proof is non-critical
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [slug])

  if (count === null || count < MIN_SHOW) return null

  return (
    <p className="flex items-center gap-1.5 font-sans text-sm text-text-secondary">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      {count} {count === 1 ? 'persona viendo esto' : 'personas viendo esto'}
    </p>
  )
}
