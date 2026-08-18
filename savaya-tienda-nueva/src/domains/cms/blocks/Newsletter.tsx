'use client'

import { useActionState, useTransition } from 'react'
import { subscribeToNewsletter } from '../actions'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'newsletter'>

export function Newsletter({ eyebrow, headline, subheadline, placeholder, ctaText }: Props) {
  const [state, formAction] = useActionState(subscribeToNewsletter, null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <section className="px-4 md:px-10 pb-10">
      <div className="bg-surface-2 rounded-[32px] py-10 md:py-14 px-8 md:px-14">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-9 md:gap-16">
          {/* Left: copy */}
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <div className="flex items-center gap-2 mb-3">
                <span className="block w-4 h-px bg-accent-gold shrink-0" aria-hidden="true" />
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-accent-gold">
                  {eyebrow}
                </span>
              </div>
            )}
            <h2 className="font-display font-black text-[clamp(24px,3.5vw,36px)] uppercase tracking-tight text-text-primary leading-[1.05]">
              {headline}
            </h2>
            {subheadline && (
              <p className="mt-2 font-sans text-sm text-text-secondary leading-relaxed max-w-[360px]">
                {subheadline}
              </p>
            )}
          </div>

          {/* Right: form */}
          <div className="w-full md:w-auto md:flex-none md:min-w-[340px]">
            {state?.success ? (
              <p className="font-sans text-base font-medium text-accent-gold" role="status">
                ¡Gracias por suscribirte!
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2.5"
                noValidate
              >
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    {placeholder}
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={placeholder}
                    disabled={isPending}
                    className="
                      h-12 w-full rounded-pill border border-border
                      bg-surface px-5 font-sans text-sm text-text-primary
                      placeholder:text-text-secondary/60
                      focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2
                      disabled:opacity-50
                    "
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="
                    h-12 shrink-0 rounded-pill bg-accent-gold px-6 font-sans text-sm font-bold
                    text-brand-black transition-opacity hover:opacity-90 active:opacity-80
                    focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2
                    disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap
                  "
                >
                  {isPending ? 'Procesando...' : ctaText}
                </button>
              </form>
            )}

            {state && !state.success && (
              <p className="font-sans text-sm text-error mt-3" role="alert">
                {state.error}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
