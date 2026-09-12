import * as React from 'react'

type Props = {
  email: string
}

export function NewsletterWelcomeEmail({ email }: Props) {
  const unsubscribeUrl = `https://www.savayavzla.com/newsletter/baja?email=${encodeURIComponent(email)}`

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Bienvenida a SAVAYA</title>
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
                        <p style={{ margin: '8px 0 0', color: '#7C7872', fontSize: '13px' }}>Calzado venezolano · Valencia, Carabobo</p>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '40px 32px' }}>
                        <p style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 'bold', color: '#0C0C08' }}>
                          ¡Bienvenida a la familia SAVAYA!
                        </p>
                        <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#4A4843', lineHeight: '1.6' }}>
                          Gracias por suscribirte. Eres la primera en enterarte de nuestros lanzamientos,
                          colecciones exclusivas y ofertas especiales — antes que nadie.
                        </p>
                        <p style={{ margin: '0 0 32px', fontSize: '15px', color: '#4A4843', lineHeight: '1.6' }}>
                          Mientras tanto, te invitamos a explorar nuestra colección actual en la tienda.
                        </p>
                        <table cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ borderRadius: '100px', backgroundColor: '#CA8C31' }}>
                                <a
                                  href="https://www.savayavzla.com/mujer"
                                  style={{
                                    display: 'inline-block',
                                    padding: '14px 32px',
                                    color: '#ffffff',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    borderRadius: '100px',
                                  }}
                                >
                                  Ver colección
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ backgroundColor: '#F8F6F2', padding: '24px 32px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#7C7872' }}>
                          © {new Date().getFullYear()} SAVAYA · Valencia, Carabobo, Venezuela
                          <br />
                          <a href={unsubscribeUrl} style={{ color: '#9C9690', fontSize: '11px' }}>
                            Cancelar suscripción
                          </a>
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
