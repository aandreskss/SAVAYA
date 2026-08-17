import { describe, it, expect, vi, beforeEach } from 'vitest'

// buildWhatsAppOrderLink reads env vars at call time, so vi.stubEnv works without resetting modules
import { buildWhatsAppOrderLink } from '../service'

// Mock heavy dependencies so the module import doesn't fail in test environment
vi.mock('resend', () => ({ Resend: vi.fn() }))
vi.mock('@react-email/render', () => ({ render: vi.fn() }))
vi.mock('../emails/OrderConfirmation', () => ({ OrderConfirmationEmail: vi.fn() }))
vi.mock('../emails/PaymentApproved', () => ({ PaymentApprovedEmail: vi.fn() }))
vi.mock('../emails/PaymentRejected', () => ({ PaymentRejectedEmail: vi.fn() }))
vi.mock('../repository', () => ({ logNotification: vi.fn() }))

describe('buildWhatsAppOrderLink()', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('produces a wa.me URL with the default number when env is not set', () => {
    const url = buildWhatsAppOrderLink({
      orderNumber: 'SAV-0001',
      customerName: 'María García',
      totalUsd: 45.00,
      paymentMethod: 'Pago Móvil',
    })
    expect(url).toMatch(/^https:\/\/wa\.me\/584141100100\?text=/)
  })

  it('uses NEXT_PUBLIC_WHATSAPP_NUMBER from env when set', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '+58-412-111-2233')
    const url = buildWhatsAppOrderLink({
      orderNumber: 'SAV-0002',
      customerName: 'Ana López',
      totalUsd: 30.00,
      paymentMethod: 'Zelle',
    })
    // strips non-digits
    expect(url).toContain('wa.me/584121112233')
  })

  it('encodes the order number in the text', () => {
    const url = buildWhatsAppOrderLink({
      orderNumber: 'SAV-0042',
      customerName: 'Test',
      totalUsd: 10,
      paymentMethod: 'Efectivo',
    })
    expect(decodeURIComponent(url)).toContain('SAV-0042')
  })

  it('encodes the customer name in the text', () => {
    const url = buildWhatsAppOrderLink({
      orderNumber: 'SAV-0001',
      customerName: 'Sofía Martínez',
      totalUsd: 20,
      paymentMethod: 'USDT',
    })
    expect(decodeURIComponent(url)).toContain('Sofía Martínez')
  })

  it('formats totalUsd to 2 decimal places', () => {
    const url = buildWhatsAppOrderLink({
      orderNumber: 'SAV-0001',
      customerName: 'Test',
      totalUsd: 45,
      paymentMethod: 'Binance Pay',
    })
    expect(decodeURIComponent(url)).toContain('$45.00')
  })

  it('includes the payment method in the text', () => {
    const url = buildWhatsAppOrderLink({
      orderNumber: 'SAV-0001',
      customerName: 'Test',
      totalUsd: 55.5,
      paymentMethod: 'Pago Móvil',
    })
    expect(decodeURIComponent(url)).toContain('Pago Móvil')
  })

  it('strips all non-digit characters from a messy phone number', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '(58) 414-110-0100')
    const url = buildWhatsAppOrderLink({
      orderNumber: 'SAV-0001',
      customerName: 'Test',
      totalUsd: 10,
      paymentMethod: 'Zelle',
    })
    expect(url).toContain('wa.me/584141100100')
  })
})
