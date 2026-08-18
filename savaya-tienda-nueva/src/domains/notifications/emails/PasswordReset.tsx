import * as React from 'react'

type Props = {
  resetUrl: string
}

export function PasswordResetEmail({ resetUrl }: Props) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Recupera tu contraseña — SAVAYA</title>
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
                          Recupera tu contraseña
                        </p>
                        <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#4A4843', lineHeight: '1.6' }}>
                          Recibimos una solicitud para restablecer la contraseña de tu cuenta SAVAYA.
                          Haz clic en el botón de abajo para crear una nueva contraseña.
                        </p>
                        <p style={{ margin: '0 0 32px', fontSize: '13px', color: '#7C7872' }}>
                          Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste esto, puedes ignorar este correo.
                        </p>
                        <table cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ borderRadius: '100px', backgroundColor: '#CA8C31' }}>
                                <a
                                  href={resetUrl}
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
                                  Restablecer contraseña
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style={{ margin: '32px 0 0', fontSize: '12px', color: '#7C7872' }}>
                          O copia y pega este enlace en tu navegador:
                          <br />
                          <a href={resetUrl} style={{ color: '#CA8C31', wordBreak: 'break-all' }}>{resetUrl}</a>
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ backgroundColor: '#F8F6F2', padding: '24px 32px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#7C7872' }}>
                          © {new Date().getFullYear()} SAVAYA · Valencia, Carabobo, Venezuela
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
