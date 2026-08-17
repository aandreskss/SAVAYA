import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorSelector } from '../ColorSelector'

const mockColors = [
  { id: 'negro', name: 'Negro', hex: '#0A0A0A', isAvailable: true },
  { id: 'beige', name: 'Beige', hex: '#F5F0E8', isAvailable: true },
  { id: 'rojo', name: 'Rojo', hex: '#C0362C', isAvailable: false },
]

describe('ColorSelector', () => {
  it('no llama onChange al hacer clic en un color no disponible', () => {
    const onChange = vi.fn()

    render(
      <ColorSelector
        colors={mockColors}
        onChange={onChange}
      />,
    )

    const redButton = screen.getByRole('button', {
      name: /Color: Rojo, no disponible/i,
    })
    fireEvent.click(redButton)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('el botón de color no disponible está deshabilitado', () => {
    render(
      <ColorSelector
        colors={mockColors}
        onChange={() => {}}
      />,
    )

    const redButton = screen.getByRole('button', {
      name: /Color: Rojo, no disponible/i,
    })
    expect(redButton).toBeDisabled()
  })

  it('el color seleccionado tiene aria-pressed="true"', () => {
    render(
      <ColorSelector
        colors={mockColors}
        selectedColorId="negro"
        onChange={() => {}}
      />,
    )

    const negroButton = screen.getByRole('button', {
      name: /Color: Negro, disponible/i,
    })
    expect(negroButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('los colores no seleccionados tienen aria-pressed="false"', () => {
    render(
      <ColorSelector
        colors={mockColors}
        selectedColorId="negro"
        onChange={() => {}}
      />,
    )

    const beigeButton = screen.getByRole('button', {
      name: /Color: Beige, disponible/i,
    })
    expect(beigeButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('llama onChange con el id correcto al hacer clic en un color disponible', () => {
    const onChange = vi.fn()

    render(
      <ColorSelector
        colors={mockColors}
        onChange={onChange}
      />,
    )

    const beigeButton = screen.getByRole('button', {
      name: /Color: Beige, disponible/i,
    })
    fireEvent.click(beigeButton)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('beige')
  })
})
