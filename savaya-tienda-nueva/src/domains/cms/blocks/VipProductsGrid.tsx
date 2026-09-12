'use client'

import { useRef, useState, useEffect } from 'react'
import { ProductCard } from '@/shared/ui/ProductCard'
import type { ProductListItem } from '@/domains/catalog/repository'

type Props = {
  products: ProductListItem[]
}

export function VipProductsGrid({ products }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [fired, setFired] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFired(true)
          observer.disconnect()
        }
      },
      { threshold: 0.06 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
      {products.map((product, index) => (
        <div
          key={product.id}
          style={{
            transformOrigin: 'bottom center',
            ...(fired
              ? {
                  animation: 'card-bounce-in 750ms both',
                  animationDelay: `${index * 75}ms`,
                }
              : { opacity: 0 }),
          }}
        >
          <ProductCard
            id={product.id}
            slug={product.slug}
            name={product.name}
            basePrice={product.basePrice}
            compareAtPrice={product.compareAtPrice}
            images={product.images}
            availableColors={product.availableColors}
            isVip
            priority={index < 2}
          />
        </div>
      ))}
    </div>
  )
}
