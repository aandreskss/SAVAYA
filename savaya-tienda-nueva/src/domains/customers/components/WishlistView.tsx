'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleWishlist } from '../wishlist-actions'
import type { WishlistProduct } from '../types'

interface Props {
  products: WishlistProduct[]
}

export function WishlistView({ products: initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleRemove(variantId: string) {
    startTransition(async () => {
      await toggleWishlist(variantId)
      setProducts((prev) => prev.filter((p) => p.variantId !== variantId))
      router.refresh()
    })
  }

  if (products.length === 0) {
    return (
      <div className="border border-border rounded-lg p-10 text-center">
        <p className="text-text-secondary mb-4">Tu wishlist está vacía.</p>
        <Link
          href="/"
          className="inline-block bg-accent-gold text-text-primary-inverse text-sm px-5 py-2 rounded-full hover:bg-accent-gold-hover transition-colors"
        >
          Explorar productos
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.variantId}
          className="border border-border rounded-lg overflow-hidden group"
        >
          <Link href={`/producto/${product.productSlug}`} className="block">
            <div className="aspect-square bg-surface overflow-hidden relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-surface" />
              )}
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="text-xs font-medium text-text-secondary bg-white px-2 py-1 rounded">
                    Agotado
                  </span>
                </div>
              )}
            </div>
          </Link>

          <div className="p-3">
            <Link href={`/producto/${product.productSlug}`}>
              <p className="text-sm font-medium truncate hover:underline">
                {product.productName}
              </p>
            </Link>
            <p className="text-xs text-text-secondary mt-0.5">
              {product.colorName} · {product.sizeName}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm font-medium">
                ${parseFloat(product.priceUsd).toFixed(2)}
              </p>
              <button
                onClick={() => handleRemove(product.variantId)}
                disabled={pending}
                className="text-xs text-text-secondary hover:text-error transition-colors"
                aria-label={`Quitar ${product.productName} de wishlist`}
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
