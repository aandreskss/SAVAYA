import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SizeSelector } from '../SizeSelector'

const mockSizes = [
  { id: '35', name: '35', isAvailable: true },
  { id: '36', name: '36', isAvailable: true },
  { id: '37', name: '37', isAvailable: false },
  { id: '38', name: '38', isAvailable: true },
]

describe('SizeSelector', () => {
  it('no llama onChange al hacer clic en una talla agotada', () => {
    const onChange = vi.fn()

    render(
      <SizeSelector
        sizes={mockSizes}
        onChange={onChange}
      />,
    )

    const size37 = screen.getByRole('button', {
      name: /Talla 37, agotada/i,
    })
    fireEvent.click(size37)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('el botón de talla agotada está deshabilitado', () => {
    render(
      <SizeSelector
        sizes={mockSizes}
        onChange={() => {}}
      />,
    )

    const size37 = screen.getByRole('button', {
      name: /Talla 37, agotada/i,
    })
    expect(size37).toBeDisabled()
  })

  it('llama onChange con el id correcto al seleccionar una talla disponible', () => {
    const onChange = vi.fn()

    render(
      <SizeSelector
        sizes={mockSizes}
        onChange={onChange}
      />,
    )

    const size38 = screen.getByRole('button', {
      name: /Talla 38, disponible/i,
    })
    fireEvent.click(size38)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('38')
  })

  it('la talla seleccionada tiene aria-pressed="true"', () => {
    render(
      <SizeSelector
        sizes={mockSizes}
        selectedSizeId="36"
        onChange={() => {}}
      />,
    )

    const size36 = screen.getByRole('button', {
      name: /Talla 36, disponible/i,
    })
    expect(size36).toHaveAttribute('aria-pressed', 'true')
  })

  it('muestra el link de guía de tallas si onGuideClick está presente', () => {
    render(
      <SizeSelector
        sizes={mockSizes}
        onChange={() => {}}
        onGuideClick={() => {}}
      />,
    )

    expect(screen.getByText(/Guía de tallas/i)).toBeInTheDocument()
  })

  it('no muestra el link de guía de tallas si onGuideClick no está presente', () => {
    render(
      <SizeSelector
        sizes={mockSizes}
        onChange={() => {}}
      />,
    )

    expect(screen.queryByText(/Guía de tallas/i)).not.toBeInTheDocument()
  })
})
