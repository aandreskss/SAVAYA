export const colors = {
  brand: {
    black: '#0A0A0A',
    offwhite: '#F7F5F0',
    white: '#FFFFFF',
  },
  accent: {
    gold: '#C9A227',
    goldSoft: '#E8D9A8',
  },
  text: {
    primary: '#0A0A0A',
    primaryInverse: '#FFFFFF',
    secondary: '#6B6B6B',
  },
  border: '#E5E2DC',
  surface: '#FFFFFF',
  success: '#1E7F4F',
  warning: '#B8791A',
  error: '#C0362C',
} as const

export const radius = {
  sm: '8px',
  md: '14px',
  lg: '24px',
  xl: '32px',
  pill: '9999px',
} as const

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  24: '96px',
} as const

export const shadows = {
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  md: '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 8px 24px 0 rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
} as const

export const typography = {
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    display: 'Archivo, ui-sans-serif, system-ui, sans-serif',
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const
