'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

const LS_KEY = 'savaya-wishlist'

function readLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

export function useWishlist() {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const didMigrate = useRef(false)

  // Load on mount / user change
  useEffect(() => {
    setLoaded(false)
    if (!user?.id || !supabaseConfigured) {
      setWishlist(readLocal())
      setLoaded(true)
      return
    }
    const supabase = createClient()
    supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setWishlist((data ?? []).map((r) => r.product_id as string))
        setLoaded(true)
      })
  }, [user?.id])

  // Migrate localStorage → Supabase once when user logs in
  useEffect(() => {
    if (!user?.id || !supabaseConfigured || !loaded || didMigrate.current) return
    didMigrate.current = true
    const local = readLocal()
    if (!local.length) return
    const supabase = createClient()
    supabase
      .from('wishlist_items')
      .upsert(
        local.map((id) => ({ user_id: user.id, product_id: id })),
        { onConflict: 'user_id,product_id', ignoreDuplicates: true },
      )
      .then(() => {
        setWishlist((prev) => [...new Set([...prev, ...local])])
        localStorage.removeItem(LS_KEY)
      })
  }, [user?.id, loaded])

  const toggle = useCallback(
    async (productId: string) => {
      const removing = wishlist.includes(productId)
      const next = removing
        ? wishlist.filter((id) => id !== productId)
        : [...wishlist, productId]
      setWishlist(next) // optimistic

      if (!user?.id || !supabaseConfigured) {
        localStorage.setItem(LS_KEY, JSON.stringify(next))
        return
      }
      const supabase = createClient()
      if (removing) {
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)
      } else {
        await supabase
          .from('wishlist_items')
          .insert({ user_id: user.id, product_id: productId })
      }
    },
    [wishlist, user?.id],
  )

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  )

  return { wishlist, toggle, isWishlisted, loaded }
}
