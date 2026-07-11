'use client'

import { useState, useEffect } from 'react'

export interface CustomColor {
  name: string
  hex: string // supports "hex1|hex2" bicolor format
}

const STORAGE_KEY = 'savaya-custom-colors'

export function useCustomColors() {
  const [customColors, setCustomColors] = useState<CustomColor[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCustomColors(JSON.parse(stored) as CustomColor[])
    } catch {}
  }, [])

  function saveColor(name: string, hex: string) {
    if (!name.trim()) return
    setCustomColors((prev) => {
      // Replace if same name already saved, otherwise prepend
      const filtered = prev.filter((c) => c.name !== name.trim())
      const next = [{ name: name.trim(), hex }, ...filtered]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function removeColor(name: string) {
    setCustomColors((prev) => {
      const next = prev.filter((c) => c.name !== name)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { customColors, saveColor, removeColor }
}
