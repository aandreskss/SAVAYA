import type { ReactElement } from 'react'
import type { BlockContent } from '../block-schemas'

// ---------------------------------------------------------------------------
// SVG icons — inline for zero extra requests
// ---------------------------------------------------------------------------

function TruckIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path
        d="M2 8h16v12H2V8zM18 11h5l3 4v5h-8V11z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="20.5" r="1.5" fill="currentColor" />
      <circle cx="21" cy="20.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3L4 7v7c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V7L14 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10 14l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path
        d="M4 14a10 10 0 0 1 17.07-7.07M24 4v6h-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 14a10 10 0 0 1-17.07 7.07M4 24v-6h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3l3.09 6.26L24 10.27l-5 4.87 1.18 6.88L14 18.77l-6.18 3.25L9 15.14 4 10.27l6.91-1.01L14 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3C8.48 3 4 7.48 4 13c0 1.93.55 3.73 1.5 5.25L4 25l6.96-1.45A10.96 10.96 0 0 0 14 24c5.52 0 10-4.48 10-10S19.52 3 14 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 12.5c.5 1.5 1.5 2.5 3 3l1-1c.5-.5 1.5-.5 2 0l1.5 1.5c.5.5.5 1 0 1.5l-.5.5c-.5.5-1.5.5-2 0C13 16 11 14 10.5 12.5c-.5-.5-.5-1.5 0-2l.5-.5c.5-.5 1.5-.5 2 0l.5.5c.5.5.5 1.5 0 2l-3-3z"
        fill="currentColor"
      />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 28 28" fill="none">
      <rect
        x="3"
        y="7"
        width="22"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M3 12h22" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M7 17h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ICONS: Partial<Record<string, () => ReactElement>> = {
  truck: TruckIcon,
  shield: ShieldIcon,
  refresh: RefreshIcon,
  star: StarIcon,
  whatsapp: WhatsAppIcon,
  'credit-card': CreditCardIcon,
}

function BenefitIconEl({ icon }: { icon: string }) {
  const Icon = ICONS[icon]
  if (Icon) return <Icon />
  return <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = BlockContent<'benefits_block'>

export function BenefitsBlock({ title, benefits }: Props) {
  const colCount = benefits.length <= 4 ? benefits.length : 3

  return (
    <section className="px-4 md:px-10 py-3 pb-9">
      {title && (
        <h2 className="mb-7 text-center font-display font-bold text-xl text-text-primary uppercase">
          {title}
        </h2>
      )}

      <div
        className="grid grid-cols-2 gap-x-4 gap-y-6"
        style={{
          gridTemplateColumns: `repeat(${Math.min(colCount, 4)}, minmax(0, 1fr))`,
        }}
      >
        {benefits.map((benefit, i) => (
          <div
            key={`${benefit.icon}-${i}`}
            className="flex flex-col items-center text-center gap-2.5"
          >
            <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center text-accent-gold shrink-0">
              <BenefitIconEl icon={benefit.icon} />
            </div>
            <p className="font-sans text-[13px] font-bold text-text-primary leading-snug">{benefit.title}</p>
            {benefit.description && (
              <p className="font-sans text-xs text-text-secondary leading-relaxed">
                {benefit.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
