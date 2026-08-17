import * as React from 'react'

type Props = {
  orderNumber: string
  customerName: string
  totalUsd: number
  totalBs: number
}

export function PaymentApprovedEmail({ orderNumber, customerName, totalUsd, totalBs }: Props) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Pago aprobado — {orderNumber}</title>
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
                        {/* Status badge */}
                        <table cellPadding={0} cellSpacing={0} style={{ marginBottom: '24px' }}>
                          <tbody>
                            <tr>
                              <td style={{ backgroundColor: '#D1FAE5', borderRadius: '999px', padding: '6px 16px' }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#065F46' }}>✓ Pago aprobado</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 'bold', color: '#0C0C08' }}>
                          ¡Tu pago fue verificado, {customerName}!
                        </p>
                        <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#4A4A45', lineHeight: '1.6' }}>
                          Confirmamos el pago de tu pedido <strong>{orderNumber}</strong>. Estamos preparando tu calzado para el despacho.
                        </p>

                        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F7F5F0', borderRadius: '8px', marginBottom: '24px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '16px 20px' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#7C7872' }}>Pedido</p>
                                <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 'bold', color: '#CA8C31' }}>{orderNumber}</p>
                                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#0C0C08' }}>Total: <strong>${totalUsd.toFixed(2)}</strong> · Bs. {totalBs.toFixed(2)}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={{ margin: 0, fontSize: '14px', color: '#4A4A45', lineHeight: '1.6' }}>
                          Te avisaremos cuando tu pedido sea despachado. Puedes seguir el estado en tu cuenta en nuestro sitio web.
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
