import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GoogleAnalyticsDashboard, dailySeries } from './GoogleAnalyticsDashboard'
import { GoogleAnalyticsFilters } from './GoogleAnalyticsFilters'
import type { GoogleReport } from './google-report-model'
const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => mocks, useSearchParams: () => new URLSearchParams('days=7') }))
afterEach(() => { cleanup(); vi.clearAllMocks() })
const report: GoogleReport = {
  range: { from: '2026-11-01', to: '2026-11-03' }, previousRange: { from: '2026-10-29', to: '2026-10-31' },
  generatedAt: '2026-11-03T12:00:00Z', timeZone: 'America/Caracas', summary: [10, 20, 30, 1, 25], previous: [0, 10, 10, 0, 0], warnings: [],
  tables: [
    { title: 'Evolución diaria', headers: ['Fecha', 'Usuarios', 'Sesiones', 'Vistas', 'Compras', 'Ingresos USD'], rows: [['2026-11-01', 10, 20, 30, 1, 25]] },
    { title: 'Dispositivos', headers: ['Dispositivo', 'Sesiones'], rows: [['mobile', 20]] },
    { title: 'Fuentes y campañas', headers: ['Fuente', 'Sesiones'], rows: [['google / organic', 20]] },
    { title: 'Productos más vistos', headers: ['Producto', 'Vistas'], rows: [['Vestido Savaya', 10]] },
  ],
}
it('fills missing dates with zero without adding duplicate days', () => {
  expect(dailySeries(report, 2)).toEqual([{ day: '2026-11-01', value: 20 }, { day: '2026-11-02', value: 0 }, { day: '2026-11-03', value: 0 }])
})
it('switches chart metrics and report sections without export controls', () => {
  render(<GoogleAnalyticsDashboard report={report} />)
  expect(screen.getByRole('img', { name: /Sesiones por día/ })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Ingresos' }))
  expect(screen.getByRole('img', { name: /Ingresos \(USD\) por día/ })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Productos y compras' }))
  expect(screen.getByText('Vestido Savaya')).toBeTruthy()
  expect(screen.queryByText('google / organic')).toBeNull()
  expect(screen.queryByRole('button', { name: /descargar|exportar|sheets/i })).toBeNull()
})
it('applies inclusive presets and preserves the internal traffic filter', () => {
  render(<GoogleAnalyticsFilters range={report.range} today="2026-11-13" />)
  fireEvent.click(screen.getByRole('button', { name: '7 días' }))
  expect(mocks.push).toHaveBeenCalledWith('/admin/analytics?days=7&from=2026-11-07&to=2026-11-13', { scroll: false })
})
it('refreshes the current period and blocks ranges over 366 days', () => {
  render(<GoogleAnalyticsFilters range={report.range} today="2026-11-13" />)
  fireEvent.submit(screen.getByRole('button', { name: 'Consultar período' }).closest('form')!)
  expect(mocks.refresh).toHaveBeenCalledOnce()
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2020-01-01' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Consultar período' }).closest('form')!)
  expect(screen.getByRole('alert').textContent).toContain('366 días')
  expect(mocks.push).not.toHaveBeenCalled()
})
