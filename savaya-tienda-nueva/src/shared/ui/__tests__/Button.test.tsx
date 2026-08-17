import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renderiza con texto', () => {
    render(<Button>Agregar al carrito</Button>)
    expect(screen.getByRole('button', { name: /Agregar al carrito/i })).toBeInTheDocument()
  })

  it('muestra spinner cuando isLoading es true', () => {
    render(<Button isLoading>Guardar</Button>)
    // El texto accesible del spinner
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('está deshabilitado cuando isLoading es true', () => {
    render(<Button isLoading>Guardar</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('aplica aria-disabled cuando disabled es true', () => {
    render(<Button disabled>Confirmar</Button>)
    const btn = screen.getByRole('button', { name: /Confirmar/i })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-disabled', 'true')
  })
})
