import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Accordion } from '../Accordion'

const items = [
  {
    id: 'shipping',
    trigger: 'Política de envíos',
    content: 'Enviamos a todo Venezuela en 3-5 días hábiles.',
  },
  {
    id: 'returns',
    trigger: 'Devoluciones',
    content: 'Tienes 15 días para devolver tu pedido.',
  },
]

describe('Accordion', () => {
  it('click en trigger abre el panel', () => {
    const { container } = render(<Accordion items={items} />)

    const trigger = screen.getByRole('button', { name: /Política de envíos/i })

    // Obtenemos el panel usando el aria-controls del trigger
    const panelId = trigger.getAttribute('aria-controls') as string
    const panel = container.querySelector(`#${panelId}`) as HTMLElement

    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('hidden')

    fireEvent.click(trigger)

    expect(panel).not.toHaveAttribute('hidden')
    expect(panel).toHaveTextContent('Enviamos a todo Venezuela')
  })

  it('aria-expanded cambia de false a true al abrir', () => {
    render(<Accordion items={items} />)

    const trigger = screen.getByRole('button', { name: /Política de envíos/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
