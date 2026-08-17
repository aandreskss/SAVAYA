'use client'

import { useActionState, useTransition } from 'react'
import { subscribeToNewsletter } from '../actions'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'newsletter'>

export function Newsletter({ headline, subheadline, placeholder, ctaText }: Props) {
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
      <div className="bg-brand-black rounded-[32px] py-14 md:py-16 px-6 text-center">
        <h2 className="font-display font-black text-3xl md:text-[32px] text-white uppercase mb-2.5">
          {headline}
        </h2>

        {subheadline && (
          <p className="font-sans text-sm text-[#B8B4AD] mb-6">{subheadline}</p>
        )}

        {state?.success ? (
          <p className="font-sans text-base font-medium text-accent-gold" role="status">
            ¡Gracias por suscribirte!
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-[420px] mx-auto"
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
                  h-12 w-full rounded-pill border-none
                  bg-white px-5 font-sans text-sm text-brand-black
                  placeholder:text-[#726F6A]
                  focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2
                  disabled:opacity-50
                "
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="
                h-12 shrink-0 rounded-pill bg-accent-gold px-5 font-sans text-sm font-bold
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
    </section>
  )
}
