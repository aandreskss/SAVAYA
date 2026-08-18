'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import { toggleWishlist } from '../wishlist-actions'

// ---------------------------------------------------------------------------
// WishlistButton — heart toggle for product cards and PDP
// ---------------------------------------------------------------------------

type Props = {
  productId: string
  variantId?: string
  initialIsInWishlist: boolean
}

export function WishlistButton({ variantId, initialIsInWishlist }: Props) {
  const router = useRouter()
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!variantId) {
      router.push('/iniciar-sesion')
      return
    }

    const optimistic = !isInWishlist
    setIsInWishlist(optimistic)

    startTransition(async () => {
      const result = await toggleWishlist(variantId)

      if (!result.success) {
        setIsInWishlist(isInWishlist)
        if (result.error?.includes('iniciar sesión')) {
          router.push('/iniciar-sesion')
        }
        return
      }

      setIsInWishlist(result.data.isInWishlist)
    })
  }

  return (
    <button
      type="button"
      aria-label={isInWishlist ? 'Quitar de wishlist' : 'Agregar a wishlist'}
      aria-pressed={isInWishlist}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'h-9 w-9 flex items-center justify-center rounded-full',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
        'disabled:opacity-50',
        isInWishlist
          ? 'text-error bg-error/10'
          : 'text-text-secondary hover:text-error hover:bg-error/10',
      )}
    >
      <HeartIcon filled={isInWishlist} />
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 17s-8-5-8-10a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5-8 10-8 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}
