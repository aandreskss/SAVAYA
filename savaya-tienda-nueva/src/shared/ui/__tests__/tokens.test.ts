import { describe, it, expect } from 'vitest'
import { colors, radius, spacing } from '../tokens'

describe('design tokens', () => {
  it('brand black es el color correcto', () => {
    expect(colors.brand.black).toBe('#0A0A0A')
  })
  it('accent gold es el color correcto', () => {
    expect(colors.accent.gold).toBe('#C9A227')
  })
  it('radius pill es 9999px', () => {
    expect(radius.pill).toBe('9999px')
  })
  it('spacing escala existe completa', () => {
    expect(Object.keys(spacing)).toHaveLength(9)
  })
})
