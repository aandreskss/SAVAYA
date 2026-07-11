'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlist } from '@/hooks/useWishlist'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { formatPrice, cn } from '@/lib/utils'
import { useCurrency } from '@/components/providers/CurrencyProvider'
import type { Product } from '@/lib/types'

function HeartFilledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-sale">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export default function FavoritosPage() {
  const currency = useCurrency()
  const { wishlist, toggle, loaded } = useWishlist()
  const addItem = useCartStore((s) => s.addItem)
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const hasFetched = useRef(false)

  // Fetch product data once after wishlist IDs are loaded
  useEffect(() => {
    if (!loaded || hasFetched.current) return
    hasFetched.current = true

    if (wishlist.length === 0 || !supabaseConfigured) return

    setLoadingProducts(true)
    const supabase = createClient()
    supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .in('id', wishlist)
      .eq('is_active', true)
      .then(({ data }) => {
        setFetchedProducts((data as Product[]) ?? [])
        setLoadingProducts(false)
      })
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter by current wishlist for immediate remove feedback
  const products = fetchedProducts.filter((p) => wishlist.includes(p.id))

  if (!loaded || loadingProducts) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 bg-gray-bg rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] bg-gray-bg rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Favoritos</h1>

      {products.length === 0 ? (
        <div className="border border-gray-light rounded-lg px-6 py-16 text-center">
          <p className="text-gray-text">Aún no tienes productos guardados.</p>
          <Link
            href="/nuevas-colecciones"
            className="mt-3 inline-block text-sm font-semibold underline underline-offset-2 hover:text-accent transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
          {products.map((product) => {
            const price = product.sale_price ?? product.base_price
            const inStock = (product.variants ?? []).some((v) => v.stock > 0)
            const firstVariant = product.variants?.[0]

            return (
              <article key={product.id} className="flex flex-col">
                <div className="relative rounded overflow-hidden bg-gray-bg aspect-[3/4]">
                  <Link href={`/${product.slug}`} className="block w-full h-full">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-bg" />
                    )}
                  </Link>

                  {!inStock && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-text text-white text-[10px] font-bold uppercase rounded">
                      Sin stock
                    </div>
                  )}

                  <button
                    onClick={() => toggle(product.id)}
                    aria-label="Quitar de favoritos"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
                  >
                    <HeartFilledIcon />
                  </button>
                </div>

                <div className="mt-2.5 flex flex-col gap-1">
                  <Link
                    href={`/${product.slug}`}
                    className="text-sm leading-snug line-clamp-2 hover:underline underline-offset-2"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        'font-heading font-semibold text-sm',
                        product.sale_price != null && 'text-sale',
                      )}
                    >
                      {formatPrice(price, currency)}
                    </span>
                    {product.sale_price && (
                      <span className="text-xs text-gray-text line-through">
                        {formatPrice(product.base_price, currency)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!inStock || !firstVariant) return
                      addItem({
                        variantId: firstVariant.id,
                        productId: product.id,
                        name: product.name,
                        image: product.images[0] ?? '',
                        price,
                        size: firstVariant.size,
                        color: firstVariant.color,
                        quantity: 1,
                      })
                    }}
                    disabled={!inStock}
                    className={cn(
                      'mt-1.5 w-full border py-2 text-xs font-heading font-bold tracking-widest rounded transition-colors',
                      inStock
                        ? 'border-accent text-accent hover:bg-accent hover:text-white'
                        : 'border-gray-light text-gray-text opacity-50 cursor-not-allowed',
                    )}
                  >
                    {inStock ? 'AGREGAR AL CARRITO' : 'SIN STOCK'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
