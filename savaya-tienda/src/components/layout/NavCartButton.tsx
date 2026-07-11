'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useNavTheme } from './NavThemeContext'
import { cn } from '@/lib/utils'
import MiniCart from '@/components/cart/MiniCart'

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2h2l2.4 9.6a1 1 0 0 0 1 .8h7.2a1 1 0 0 0 1-.76L17 7H5" />
      <circle cx="8" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function NavCartButton() {
  const totalItems = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0))
  const toggleMiniCart = useCartStore((s) => s.toggleMiniCart)
  const theme = useNavTheme()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <button
        type="button"
        onClick={toggleMiniCart}
        aria-label={`Carrito${totalItems > 0 ? ` (${totalItems} productos)` : ''}`}
        className={cn(
          'relative p-2 transition-colors',
          theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-black/70 hover:text-black'
        )}
      >
        <CartIcon />
        {mounted && totalItems > 0 && (
          <span
            aria-hidden
            className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-sale text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      <MiniCart />
    </>
  )
}
