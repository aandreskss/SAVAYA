'use client'

import Link from 'next/link'
import { useWishlist } from '@/hooks/useWishlist'
import { useNavTheme } from './NavThemeContext'
import { cn } from '@/lib/utils'

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.172 5.172a4 4 0 0 1 5.656 0L10 6.343l1.172-1.171a4 4 0 1 1 5.656 5.656L10 17.657l-6.828-6.829a4 4 0 0 1 0-5.656z" />
    </svg>
  )
}

export default function NavWishlistButton() {
  const { wishlist } = useWishlist()
  const theme = useNavTheme()
  const count = wishlist.length

  return (
    <Link
      href="/cuenta/favoritos"
      aria-label={`Favoritos${count > 0 ? ` (${count})` : ''}`}
      className={cn(
        'relative p-2 transition-colors hidden sm:flex items-center justify-center',
        theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-black/70 hover:text-black'
      )}
    >
      <HeartIcon />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
