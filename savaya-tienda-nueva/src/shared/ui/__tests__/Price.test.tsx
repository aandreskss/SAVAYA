import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Price, formatPrice } from '../Price'

describe('Price', () => {
  it('formatea $45 correctamente', () => {
    render(<Price amount={45} currency="USD" />)
    // Verifica que el precio aparece formateado en el DOM
    expect(screen.getByText(/45/)).toBeInTheDocument()
  })

  it('muestra precio anterior tachado cuando compareAtAmount > amount', () => {
    render(<Price amount={45} currency="USD" compareAtAmount={60} />)
    const compareEl = screen.getByText(/60/)
    expect(compareEl).toBeInTheDocument()
    expect(compareEl).toHaveClass('line-through')
  })

  it('no muestra precio anterior si compareAtAmount <= amount', () => {
    const { container } = render(
      <Price amount={45} currency="USD" compareAtAmount={30} />,
    )
    const struckThrough = container.querySelector('.line-through')
    expect(struckThrough).toBeNull()
  })

  it('no muestra precio anterior si compareAtAmount es igual a amount', () => {
    const { container } = render(
      <Price amount={45} currency="USD" compareAtAmount={45} />,
    )
    const struckThrough = container.querySelector('.line-through')
    expect(struckThrough).toBeNull()
  })
})

describe('formatPrice', () => {
  it('retorna un string con el monto formateado', () => {
    const result = formatPrice(45, 'USD')
    expect(typeof result).toBe('string')
    expect(result).toContain('45')
  })

  it('incluye símbolo o código de moneda en el output', () => {
    const result = formatPrice(45, 'USD')
    // Intl puede usar $ o USD dependiendo del locale
    expect(result.toLowerCase()).toMatch(/\$|usd/i)
  })
})
