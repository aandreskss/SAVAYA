import { cn } from '@/lib/utils'

type BadgeVariant = 'new' | 'sale' | 'bestseller' | 'featured'

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

const config: Record<BadgeVariant, { label: string; className: string }> = {
  new: { label: 'NUEVO', className: 'bg-black text-white' },
  sale: { label: 'OFERTA', className: 'bg-sale text-white' },
  bestseller: { label: 'BEST SELLER', className: 'bg-gold text-white' },
  featured: { label: 'DESTACADO', className: 'bg-accent text-white' },
}

export default function Badge({ variant, label, className }: BadgeProps) {
  const { label: defaultLabel, className: variantClass } = config[variant]
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-[10px] font-heading font-bold tracking-widest uppercase rounded-sm',
        variantClass,
        className
      )}
    >
      {label ?? defaultLabel}
    </span>
  )
}
