import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getGoogleContext } from '../google-context-client'

beforeEach(() => { vi.stubEnv('NEXT_PUBLIC_GA4_ID', 'G-TEST1234'); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); delete window.gtag })

it('captures the actual Google visitor/session IDs', async () => {
  window.gtag = vi.fn((...args: unknown[]) => {
    const callback = args[3] as (value: unknown) => void
    callback(args[2] === 'client_id' ? '123.456' : 1794580000)
  })
  expect(await getGoogleContext()).toEqual({ measurementId: 'G-TEST1234', clientId: '123.456', sessionId: '1794580000' })
})

it('times out if analytics is blocked instead of blocking the checkout', async () => {
  window.gtag = vi.fn()
  const result = getGoogleContext()
  await vi.advanceTimersByTimeAsync(800)
  expect(await result).toBeUndefined()
})

it('allows checkout with a client ID even when session lookup times out', async () => {
  window.gtag = vi.fn((...args: unknown[]) => {
    if (args[2] === 'client_id') (args[3] as (value: unknown) => void)('123.456')
  })
  const result = getGoogleContext()
  await vi.advanceTimersByTimeAsync(800)
  expect(await result).toEqual({ measurementId: 'G-TEST1234', clientId: '123.456', sessionId: undefined })
})

it('does not invent identifiers when Google is unavailable', async () => {
  expect(await getGoogleContext()).toBeUndefined()
})
