import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuantityStepper } from '../QuantityStepper'

describe('QuantityStepper', () => {
  it('botón − está deshabilitado cuando value === min', () => {
    render(
      <QuantityStepper value={1} min={1} max={10} onChange={() => {}} />,
    )

    const decrementBtn = screen.getByRole('button', { name: /Reducir cantidad/i })
    expect(decrementBtn).toBeDisabled()
  })

  it('botón + está deshabilitado cuando value === max', () => {
    render(
      <QuantityStepper value={10} min={1} max={10} onChange={() => {}} />,
    )

    const incrementBtn = screen.getByRole('button', { name: /Aumentar cantidad/i })
    expect(incrementBtn).toBeDisabled()
  })

  it('botón − está habilitado cuando value > min', () => {
    render(
      <QuantityStepper value={5} min={1} max={10} onChange={() => {}} />,
    )

    const decrementBtn = screen.getByRole('button', { name: /Reducir cantidad/i })
    expect(decrementBtn).not.toBeDisabled()
  })

  it('botón + está habilitado cuando value < max', () => {
    render(
      <QuantityStepper value={5} min={1} max={10} onChange={() => {}} />,
    )

    const incrementBtn = screen.getByRole('button', { name: /Aumentar cantidad/i })
    expect(incrementBtn).not.toBeDisabled()
  })

  it('click en + llama onChange con value + 1', () => {
    const onChange = vi.fn()

    render(
      <QuantityStepper value={3} min={1} max={10} onChange={onChange} />,
    )

    const incrementBtn = screen.getByRole('button', { name: /Aumentar cantidad/i })
    fireEvent.click(incrementBtn)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('click en − llama onChange con value - 1', () => {
    const onChange = vi.fn()

    render(
      <QuantityStepper value={3} min={1} max={10} onChange={onChange} />,
    )

    const decrementBtn = screen.getByRole('button', { name: /Reducir cantidad/i })
    fireEvent.click(decrementBtn)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('muestra el valor actual', () => {
    render(
      <QuantityStepper value={7} min={1} max={10} onChange={() => {}} />,
    )

    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('usa min=1 y max=99 por defecto', () => {
    render(<QuantityStepper value={1} onChange={() => {}} />)

    const decrementBtn = screen.getByRole('button', { name: /Reducir cantidad/i })
    expect(decrementBtn).toBeDisabled()

    const incrementBtn = screen.getByRole('button', { name: /Aumentar cantidad/i })
    expect(incrementBtn).not.toBeDisabled()
  })
})
