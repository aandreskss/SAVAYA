import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export type CategoryCardProps = {
  name: string
  slug: string
  imageUrl: string
  productCount?: number
  className?: string
}

export function CategoryCard({
  name,
  slug,
  imageUrl,
  productCount,
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categoria/${slug}`}
      className={cn(
        'group relative block w-full overflow-hidden',
        'rounded-[999px]',
        'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
        className,
      )}
      style={{ aspectRatio: '3/4' }}
    >
      {/* Imagen de fondo */}
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes="(max-width: 768px) 40vw, 20vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlay gradiente bottom */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/70"
      />

      {/* Texto */}
      <div className="absolute bottom-0 inset-x-0 p-4 pb-6 flex flex-col items-center text-center">
        <span className="font-display font-medium text-brand-white text-base leading-tight">
          {name}
        </span>
        {productCount !== undefined && (
          <span className="font-sans text-xs text-brand-white/70 mt-1">
            {productCount} {productCount === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>
    </Link>
  )
}
