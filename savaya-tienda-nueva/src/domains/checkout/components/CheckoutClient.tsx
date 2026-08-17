'use client'

import Link from 'next/link'
import { useCheckoutStore } from '../checkout-store'
import { CheckoutStepper } from './CheckoutStepper'
import { StepPersonalData } from './StepPersonalData'
import { StepShipping } from './StepShipping'
import { StepPayment } from './StepPayment'
import { StepConfirmation } from './StepConfirmation'
import type { CheckoutInitialData } from '../types'

type Props = {
  initialData: CheckoutInitialData
}

export function CheckoutClient({ initialData }: Props) {
  const { step, shippingCostUsd } = useCheckoutStore()

  const {
    paymentMethods,
    shippingOptions,
    exchangeRate,
    partialPaymentOptions,
    cartSubtotalUsd,
    cartItemCount,
  } = initialData

  const totalUsd = cartSubtotalUsd + shippingCostUsd

  if (cartItemCount === 0 && step !== 4) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg text-[var(--color-text-secondary)]">Tu carrito está vacío.</p>
        <Link href="/categoria/sandalias" className="btn-primary">
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Stepper */}
      {step < 4 && (
        <div className="mb-8 flex justify-center">
          <CheckoutStepper current={step} />
        </div>
      )}

      {/* Subtotal header */}
      {step < 4 && cartSubtotalUsd > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 text-sm">
          <span className="text-[var(--color-text-secondary)]">
            {cartItemCount} {cartItemCount === 1 ? 'artículo' : 'artículos'}
          </span>
          <span className="font-semibold">${cartSubtotalUsd.toFixed(2)} USD</span>
        </div>
      )}

      {/* Step content */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        {step === 1 && <StepPersonalData />}
        {step === 2 && (
          <StepShipping
            shippingOptions={shippingOptions}
            cartSubtotalUsd={cartSubtotalUsd}
          />
        )}
        {step === 3 && (
          <StepPayment
            paymentMethods={paymentMethods}
            partialPaymentOptions={partialPaymentOptions}
            totalUsd={totalUsd}
            exchangeRate={exchangeRate}
          />
        )}
        {step === 4 && <StepConfirmation />}
      </div>
    </div>
  )
}
