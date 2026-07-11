import Link from 'next/link'
import CloudinaryImage from '@/components/ui/CloudinaryImage'

const COUNT_GRID: Record<number, string> = {
  1: 'grid-cols-1 max-w-xs mx-auto',
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
}

interface Card {
  id: string
  label: string
  image_url: string | null
  href: string
}

interface CustomSectionProps {
  title?: string | null
  cards: Card[]
}

export default function CustomSection({ title, cards }: CustomSectionProps) {
  if (cards.length === 0) return null

  const gridClass = COUNT_GRID[cards.length] ?? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  return (
    <section className="py-16 overflow-hidden">
      <div className="px-4 md:px-8">
        {title && (
          <div className="mb-8 md:mb-10">
            <h2 className="font-display text-2xl md:text-3xl text-black">{title}</h2>
          </div>
        )}

        <div className={`grid ${gridClass} gap-4 md:gap-5`}>
          {cards.map(({ id, label, image_url, href }) => (
            <Link
              key={id}
              href={href}
              className="group relative block overflow-hidden rounded-3xl aspect-[3/4] bg-gray-bg"
            >
              {/* Image */}
              {image_url && (
                <CloudinaryImage
                  src={image_url}
                  alt={label}
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Top accent line */}
              <div className="absolute top-5 left-5 w-6 h-0.5 bg-gold opacity-75" />

              {/* Text */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <h3 className="font-display text-xl md:text-2xl font-bold text-white leading-tight mb-4">
                  {label}
                </h3>
                <span className="inline-flex items-center gap-1.5 self-start font-heading font-semibold text-[10px] tracking-[0.15em] uppercase text-white bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2 rounded-full group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                  Explorar
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5">
                    <line x1="2" y1="6" x2="10" y2="6" /><polyline points="7 3 10 6 7 9" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
