import Link from 'next/link'
import Image from 'next/image'

interface PromoBannerFullProps {
  label?: string
  title: string
  subtitle: string
  cta: string
  href: string
  imageUrl?: string
  /** Posición del texto: izquierda, centrado o derecha */
  align?: 'left' | 'center' | 'right'
  /** Color de acento del botón */
  accent?: 'white' | 'gold'
  /** Imagen sola sin texto ni gradiente */
  imageOnly?: boolean
}

export default function PromoBannerFull({
  label,
  title,
  subtitle,
  cta,
  href,
  imageUrl,
  align = 'left',
  accent = 'white',
  imageOnly = false,
}: PromoBannerFullProps) {
  const alignClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align]

  const paddingClass = {
    left: 'pl-8 pr-8 md:pl-16 md:pr-1/2',
    center: 'px-8 md:px-24',
    right: 'pr-8 pl-8 md:pr-16 md:pl-1/2',
  }[align]

  return (
    <section className="py-6 md:py-8">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <Link
          href={href}
          className="group relative overflow-hidden rounded block w-full aspect-[21/8] md:aspect-[21/7] bg-accent"
        >
          {/* Background image */}
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 1280px"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              priority={false}
            />
          )}

          {!imageOnly && (
            <>
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 ${
                  align === 'right'
                    ? 'bg-gradient-to-l from-black/80 via-black/40 to-black/10'
                    : align === 'center'
                    ? 'bg-black/50'
                    : 'bg-gradient-to-r from-black/80 via-black/40 to-black/10'
                }`}
              />

              {/* Content */}
              <div className={`absolute inset-0 flex flex-col justify-center ${alignClass} ${paddingClass} py-8 md:py-12`}>
                {label && (
                  <span className="font-heading text-[10px] md:text-[11px] tracking-[0.25em] uppercase text-white/60 mb-2 md:mb-3">
                    {label}
                  </span>
                )}
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 md:mb-3 max-w-lg">
                  {title}
                </h2>
                <p className="text-sm md:text-base text-white/70 mb-6 md:mb-8 max-w-sm hidden sm:block">
                  {subtitle}
                </p>
                <span
                  className={`inline-flex items-center gap-2 font-heading font-bold text-xs md:text-sm tracking-widest uppercase px-6 py-3 rounded transition-all duration-300 w-fit ${
                    accent === 'gold'
                      ? 'bg-gold text-black group-hover:bg-white group-hover:text-black'
                      : 'bg-white text-black group-hover:bg-gold group-hover:text-black'
                  }`}
                >
                  {cta}
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="6" x2="10" y2="6" />
                    <polyline points="7 3 10 6 7 9" />
                  </svg>
                </span>
              </div>
            </>
          )}
        </Link>
      </div>
    </section>
  )
}
