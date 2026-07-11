import Image from 'next/image'

interface CategoryHeroProps {
  title: string
  imageUrl?: string
  productCount: number
  description?: string
}

export default function CategoryHero({ title, imageUrl, productCount, description }: CategoryHeroProps) {
  return (
    <section className="relative h-52 md:h-72 overflow-hidden bg-accent">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/85 via-accent/55 to-accent/15" />
      <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-8 max-w-7xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-white/65 text-sm mb-2">{description}</p>
        )}
        <p className="text-white/50 text-xs font-heading tracking-widest uppercase">
          {productCount} {productCount === 1 ? 'producto' : 'productos'}
        </p>
      </div>
    </section>
  )
}
