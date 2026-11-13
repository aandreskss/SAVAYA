// @vitest-environment node
import { expect, it } from 'vitest'
import { buildGooglePurchase } from '../google-purchase-payload'

// Opt in explicitly. Google's debug endpoint validates only; it does not collect
// the synthetic purchase or pollute the production Analytics/Ads reports.
it.skipIf(process.env.GA4_VALIDATE_PAYLOAD !== 'true')('Google accepts the confirmed-purchase payload schema without collecting it', async () => {
  const measurementId = process.env.NEXT_PUBLIC_GA4_ID
  const secret = process.env.GA4_API_SECRET
  expect(measurementId).toBeTruthy()
  expect(secret).toBeTruthy()
  // Desktop clocks can be skewed. Production uses the DB's payment timestamp.
  const clockResponse = await fetch('https://www.google-analytics.com', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
  const googleNow = new Date(clockResponse.headers.get('date')!)
  expect(Number.isFinite(googleNow.getTime())).toBe(true)
  const payload = buildGooglePurchase({
    orderNumber: 'VALIDATION-ONLY-DO-NOT-COLLECT', subtotalUsd: 60,
    discountUsd: 10, shippingUsd: 5, totalUsd: 55,
    items: [{ id: 'TEST-SKU', name: 'Validation only', price: 20, quantity: 3 }],
  }, { measurementId: measurementId!, clientId: '123456789.1794580000', sessionId: String(Math.floor(googleNow.getTime() / 1000)) }, googleNow)
  const url = new URL('https://www.google-analytics.com/debug/mp/collect')
  url.searchParams.set('measurement_id', measurementId!)
  url.searchParams.set('api_secret', secret!)
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, validation_behavior: 'ENFORCE_RECOMMENDATIONS' }),
    signal: AbortSignal.timeout(10000),
  })
  expect(response.ok).toBe(true)
  expect((await response.json()).validationMessages).toEqual([])
}, 15000)
