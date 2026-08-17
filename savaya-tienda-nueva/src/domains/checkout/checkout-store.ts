'use client'

import { create } from 'zustand'
import type {
  CheckoutStep,
  PersonalData,
  ShippingData,
  PaymentData,
  OrderResult,
  AppliedCoupon,
} from './types'

type CheckoutStore = {
  step: CheckoutStep
  idempotencyKey: string
  personalData: PersonalData | null
  shippingData: ShippingData | null
  shippingCostUsd: number
  paymentData: PaymentData | null
  orderResult: OrderResult | null
  isSubmitting: boolean
  submitError: string | null
  appliedCoupon: AppliedCoupon | null

  setStep: (step: CheckoutStep) => void
  setPersonalData: (data: PersonalData) => void
  setShippingData: (data: ShippingData, costUsd: number) => void
  setPaymentData: (data: PaymentData) => void
  setOrderResult: (result: OrderResult) => void
  setSubmitting: (v: boolean) => void
  setSubmitError: (err: string | null) => void
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void
  goBack: () => void
}

function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  step: 1,
  idempotencyKey: generateIdempotencyKey(),
  personalData: null,
  shippingData: null,
  shippingCostUsd: 0,
  paymentData: null,
  orderResult: null,
  isSubmitting: false,
  submitError: null,
  appliedCoupon: null,

  setStep: (step) => set({ step }),

  setPersonalData: (data) => set({ personalData: data, step: 2 }),

  setShippingData: (data, costUsd) =>
    set({ shippingData: data, shippingCostUsd: costUsd, step: 3 }),

  setPaymentData: (data) => set({ paymentData: data }),

  setOrderResult: (result) => set({ orderResult: result, step: 4 }),

  setSubmitting: (v) => set({ isSubmitting: v }),

  setSubmitError: (err) => set({ submitError: err }),

  setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),

  goBack: () => {
    const { step } = get()
    if (step > 1 && step < 4) {
      set({ step: (step - 1) as CheckoutStep, submitError: null })
    }
  },
}))
