import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'announcement_bar'>

export function AnnouncementBar({ text, linkText, linkHref, bgColor }: Props) {
  const isGold = bgColor === 'accent-gold'

  return (
    <div
      className={cn(
        'w-full',
        isGold ? 'bg-accent-gold' : 'bg-brand-black',
      )}
      role="banner"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2.5">
        <p
          className={cn(
            'truncate text-center font-sans text-sm tracking-wide',
            isGold ? 'text-brand-black' : 'text-brand-offwhite',
          )}
        >
          {text}
        </p>

        {linkText && linkHref && (
          <Link
            href={linkHref}
            className={cn(
              'shrink-0 font-sans text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-75',
              isGold ? 'text-brand-black' : 'text-brand-offwhite',
            )}
          >
            {linkText}
          </Link>
        )}
      </div>
    </div>
  )
}
