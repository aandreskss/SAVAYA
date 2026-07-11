import Link from 'next/link'
import Image from 'next/image'
import type { BannerConfig } from '@/lib/types'

// SAVAYA: calzado femenino — Casuales y De vestir como las 2 colecciones destacadas
const DEFAULTS = [
  {
    title: 'Zapatos Casuales',
    subtitle: 'Comodidad y estilo para el día a día',
    cta: 'Explorar ahora',
    href: '/casuales',
    imageUrl: undefined as string | undefined,
  },
  {
    title: 'Zapatos De Vestir',
    subtitle: 'Elegancia que marca tu moda en cada ocasión',
    cta: 'Ver colección',
    href: '/de-vestir',
    imageUrl: undefined as string | undefined,
  },
]

interface PromoBannersProps {
  dualMujer?: BannerConfig | null
  dualCasual?: BannerConfig | null
}

export default function PromoBanners({ dualMujer, dualCasual }: PromoBannersProps) {
  const dbBanners = [dualMujer, dualCasual]

  const banners = DEFAULTS.map((def, i) => {
    const db = dbBanners[i]
    if (!db) return { ...def, imageOnly: false }
    return {
      title: db.title ?? def.title,
      subtitle: db.subtitle ?? def.subtitle,
      cta: db.cta_text ?? def.cta,
      href: db.href ?? def.href,
      imageUrl: db.image_url || def.imageUrl,
      imageOnly: db.image_only ?? false,
    }
  })

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Section header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="font-heading text-[10px] tracking-[0.3em] uppercase text-gold mb-2">
            Colecciones
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-black">
            Encuentra tu estilo
          </h2>
        </div>

        {/* Staggered cards */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 sm:items-start">
          {banners.map(({ title, subtitle, cta, href, imageUrl, imageOnly }, i) => (
            <Link
              key={href}
              href={href}
              className={[
                'group relative overflow-hidden rounded-3xl flex-1 bg-accent block',
                'aspect-[3/4]',
                i === 1 ? 'sm:mt-16' : '',
              ].join(' ')}
            >
              {/* Image */}
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}

              {!imageOnly && (
                <>
                  {/* Gradient — stronger at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Thin gold top-left accent line */}
                  <div className="absolute top-6 left-6 w-8 h-0.5 bg-gold opacity-80" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <p className="font-heading text-[10px] tracking-[0.25em] uppercase text-white/50 mb-2">
                      Nueva temporada
                    </p>
                    <h3 className="font-display text-2xl md:text-[1.75rem] font-bold text-white leading-tight mb-2">
                      {title}
                    </h3>
                    <p className="text-[13px] text-white/65 font-body mb-6 leading-relaxed">
                      {subtitle}
                    </p>

                    {/* Pill CTA */}
                    <span className="inline-flex items-center gap-2 self-start font-heading font-semibold text-[11px] tracking-[0.15em] uppercase text-white bg-white/15 backdrop-blur-sm border border-white/25 px-5 py-2.5 rounded-full group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                      {cta}
                      <svg
                        width="11" height="11" viewBox="0 0 12 12" fill="none"
                        stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      >
                        <line x1="2" y1="6" x2="10" y2="6" />
                        <polyline points="7 3 10 6 7 9" />
                      </svg>
                    </span>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
