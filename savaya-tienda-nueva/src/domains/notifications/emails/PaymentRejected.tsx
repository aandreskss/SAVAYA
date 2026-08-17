import * as React from 'react'

type Props = {
  orderNumber: string
  customerName: string
  reason: string
}

export function PaymentRejectedEmail({ orderNumber, customerName, reason }: Props) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Pago rechazado — {orderNumber}</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F0EDE6', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F0EDE6' }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '32px 16px' }}>
                <table width="600" cellPadding={0} cellSpacing={0} style={{ maxWidth: '600px', width: '100%', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }}>
                  <tbody>
                    <tr>
                      <td style={{ backgroundColor: '#0C0C08', padding: '32px', textAlign: 'center' }}>
                        <p style={{ margin: 0, color: '#CA8C31', fontSize: '28px', fontWeight: 'bold', letterSpacing: '6px' }}>SAVAYA</p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '40px 32px' }}>
                        <table cellPadding={0} cellSpacing={0} style={{ marginBottom: '24px' }}>
                          <tbody>
                            <tr>
                              <td style={{ backgroundColor: '#FEE2E2', borderRadius: '999px', padding: '6px 16px' }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#991B1B' }}>✕ Pago no verificado</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 'bold', color: '#0C0C08' }}>
                          {customerName}, no pudimos verificar tu pago
                        </p>
                        <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#4A4A45', lineHeight: '1.6' }}>
                          El comprobante de pago de tu pedido <strong>{orderNumber}</strong> fue revisado y no pudo ser aprobado por el siguiente motivo:
                        </p>

                        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#FEF2F2', borderLeft: '3px solid #F87171', borderRadius: '4px', marginBottom: '24px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '16px 20px' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#7F1D1D' }}>{reason}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#4A4A45', lineHeight: '1.6' }}>
                          Si crees que hay un error, escríbenos por WhatsApp e indicamos el número de pedido <strong>{orderNumber}</strong> para resolverlo juntos.
                        </p>

                        <p style={{ margin: 0, fontSize: '14px', color: '#7C7872' }}>
                          La reserva de tu pedido puede cancelarse automáticamente si el pago no es confirmado. Te recomendamos contactarnos a la brevedad.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: '#F7F5F0', padding: '24px 32px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#7C7872' }}>SAVAYA · @Savayavzla · Valencia, Carabobo</p>
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
