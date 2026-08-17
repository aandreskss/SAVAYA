import Image from 'next/image'
import { cn } from '@/shared/lib/utils'

type Props = {
  /** full = wings + wordmark | mark = wings only */
  variant?: 'full' | 'mark'
  className?: string
}

/**
 * Pure CSS logo switch — no client JS, no flash.
 * When `data-gender="hombre"` is present on <html> (set by hombre/layout.tsx
 * anti-flash script), the SVY white logo appears and the SAVAYA logo hides.
 * GenderSync keeps the attribute in sync on client-side navigation.
 */
export function SavayaLogo({ variant = 'full', className }: Props) {
  if (variant === 'mark') {
    return (
      <span className={cn('relative block w-10 h-10', className)}>
        <Image
          src="/images/savaya-mark.png"
          alt="SAVAYA"
          fill
          className="object-contain"
          priority
        />
      </span>
    )
  }

  return (
    <span className={className}>
      {/* Default (women): visible, hidden when data-gender="hombre" on <html> */}
      <span className="relative block w-[110px] h-[38px] [[data-gender=hombre]_&]:hidden">
        <Image
          src="/images/savaya-logo.png"
          alt="SAVAYA"
          fill
          className="object-contain object-left"
          priority
        />
      </span>
      {/* Men's SVY logo: hidden by default, shown when data-gender="hombre" */}
      <span className="relative hidden w-[120px] h-[38px] [[data-gender=hombre]_&]:block">
        <Image
          src="/images/svy-logo-white.png"
          alt="SVY FOR MEN"
          fill
          className="object-contain object-left"
          style={{ filter: 'brightness(0) invert(1)' }}
          priority
        />
      </span>
    </span>
  )
}
