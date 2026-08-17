import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

let _counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast(toast) {
    const id = `toast-${++_counter}`
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { ...toast, id }],
    }))
  },

  removeToast(id) {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

function dispatch(variant: ToastVariant, message: string, duration?: number) {
  useToastStore.getState().addToast({ variant, message, duration })
}

export const toast = {
  success: (message: string, duration?: number) =>
    dispatch('success', message, duration),
  error: (message: string, duration?: number) =>
    dispatch('error', message, duration),
  warning: (message: string, duration?: number) =>
    dispatch('warning', message, duration),
  info: (message: string, duration?: number) =>
    dispatch('info', message, duration),
}
