import Link from 'next/link'
import type { CategoryPill } from '../repository'

type Props = {
  categories: CategoryPill[]
}

export function CategoryPillsRow({ categories }: Props) {
  if (categories.length === 0) return null

  return (
    <div className="px-4 md:px-10 pt-7 pb-2">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        <Link
          href="/"
          className="shrink-0 px-5 py-2.5 rounded-pill border border-border bg-surface-2 font-sans text-[13px] font-semibold text-text-primary hover:border-accent-gold hover:text-accent-gold transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2"
        >
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categoria/${cat.slug}`}
            className="shrink-0 px-5 py-2.5 rounded-pill border border-border bg-surface-2 font-sans text-[13px] font-semibold text-text-primary hover:border-accent-gold hover:text-accent-gold transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
