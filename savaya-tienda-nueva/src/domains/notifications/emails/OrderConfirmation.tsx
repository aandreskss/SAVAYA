import * as React from 'react'

type Props = {
  orderNumber: string
  customerName: string
  totalUsd: number
  totalBs: number
  items: Array<{ name: string; sku: string; qty: number; unitPriceUsd: number }>
  hasProof: boolean
}

export function OrderConfirmationEmail({ orderNumber, customerName, totalUsd, totalBs, items, hasProof }: Props) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pedido {orderNumber} — SAVAYA</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F0EDE6', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F0EDE6' }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '32px 16px' }}>
                <table width="600" cellPadding={0} cellSpacing={0} style={{ maxWidth: '600px', width: '100%', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }}>
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td style={{ backgroundColor: '#0C0C08', padding: '32px', textAlign: 'center' }}>
                        <p style={{ margin: 0, color: '#CA8C31', fontSize: '28px', fontWeight: 'bold', letterSpacing: '6px' }}>SAVAYA</p>
                        <p style={{ margin: '8px 0 0', color: '#7C7872', fontSize: '13px' }}>Calzado venezolano · Valencia, Carabobo</p>
                      </td>
                    </tr>

                    {/* Body */}
                    <tr>
                      <td style={{ padding: '40px 32px' }}>
                        <p style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 'bold', color: '#0C0C08' }}>
                          ¡Pedido recibido, {customerName}!
                        </p>
                        <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#4A4A45', lineHeight: '1.6' }}>
                          {hasProof
                            ? 'Recibimos tu comprobante de pago. Nuestro equipo lo revisará y te notificaremos en breve.'
                            : 'Tu pedido fue creado exitosamente. Te contactaremos para coordinar el pago.'}
                        </p>

                        {/* Order number */}
                        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F7F5F0', borderRadius: '8px', marginBottom: '24px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '16px 20px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#7C7872', textTransform: 'uppercase', letterSpacing: '1px' }}>Número de pedido</p>
                                <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 'bold', color: '#CA8C31' }}>{orderNumber}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Items */}
                        <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 'bold', color: '#0C0C08', textTransform: 'uppercase', letterSpacing: '1px' }}>Resumen de tu pedido</p>
                        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderTop: '1px solid #E5E2DC', marginBottom: '16px' }}>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.sku}>
                                <td style={{ padding: '12px 0', borderBottom: '1px solid #E5E2DC' }}>
                                  <p style={{ margin: 0, fontSize: '14px', color: '#0C0C08' }}>{item.name}</p>
                                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7C7872' }}>SKU: {item.sku} · Cant: {item.qty}</p>
                                </td>
                                <td style={{ padding: '12px 0', textAlign: 'right', borderBottom: '1px solid #E5E2DC', whiteSpace: 'nowrap' }}>
                                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0C0C08' }}>${(item.unitPriceUsd * item.qty).toFixed(2)}</p>
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td style={{ paddingTop: '16px' }}>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0C0C08' }}>Total</p>
                              </td>
                              <td style={{ paddingTop: '16px', textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0C0C08' }}>${totalUsd.toFixed(2)}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7C7872' }}>Bs. {totalBs.toFixed(2)}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={{ margin: '24px 0 0', fontSize: '14px', color: '#4A4A45', lineHeight: '1.6' }}>
                          ¿Tienes dudas? Escríbenos por WhatsApp al número que aparece en nuestra web — respondemos de lunes a sábado de 9 am a 6 pm.
                        </p>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td style={{ backgroundColor: '#F7F5F0', padding: '24px 32px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#7C7872' }}>
                          SAVAYA · CC Multi Tienda God is Good, local A-4 · Valencia, Carabobo, Venezuela
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7C7872' }}>
                          @Savayavzla · savayarrss@gmail.com
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}
