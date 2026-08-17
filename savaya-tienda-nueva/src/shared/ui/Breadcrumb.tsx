import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Migas de pan" className={cn('w-full', className)}>
      <ol className="flex flex-wrap items-center gap-1 font-sans text-sm text-text-secondary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-text-secondary/60 select-none">
                  ›
                </span>
              )}

              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    isLast
                      ? 'text-text-primary font-medium'
                      : 'text-text-secondary',
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'text-text-secondary hover:text-text-primary transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded',
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
