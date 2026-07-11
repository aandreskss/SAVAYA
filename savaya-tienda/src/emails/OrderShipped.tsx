import * as React from 'react'
import {
  Html, Head, Preview, Body, Container, Section,
  Text, Heading, Button, Hr,
} from '@react-email/components'

export interface OrderShippedProps {
  customerName: string
  orderNumber: string
  orderId: string
  trackingNumber: string | null
  appUrl: string
}

export default function OrderShippedEmail({
  customerName,
  orderNumber,
  orderId,
  trackingNumber,
  appUrl,
}: OrderShippedProps) {
  const orderUrl = `${appUrl}/pedido/${orderId}`

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>¡Tu pedido {orderNumber} está en camino!</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>TULUJOSHOP</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Section style={iconWrapper}>
              <Text style={iconText}>&#128666;</Text>
            </Section>
            <Text style={statusLabel}>Estado del pedido</Text>
            <Heading style={heroHeading}>
              ¡Tu pedido está en camino!
            </Heading>
            <Text style={heroSubtitle}>
              Hola {customerName.split(' ')[0]}, tu pedido{' '}
              <strong>{orderNumber}</strong> ha salido de nuestras instalaciones
              y está en camino hacia ti.
            </Text>

            {/* Order number badge */}
            <Section style={orderBadge}>
              <Text style={orderBadgeLabel}>Número de pedido</Text>
              <Text style={orderBadgeNumber}>{orderNumber}</Text>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Tracking */}
          <Section style={section}>
            {trackingNumber ? (
              <>
                <Text style={sectionTitle}>Número de rastreo</Text>
                <Section style={trackingBox}>
                  <Text style={trackingNumber_}>{trackingNumber}</Text>
                  <Text style={trackingNote}>
                    Usa este número en la página de la transportadora para rastrear tu envío.
                  </Text>
                </Section>
              </>
            ) : (
              <>
                <Text style={sectionTitle}>Seguimiento</Text>
                <Text style={infoText}>
                  En breve recibirás el número de rastreo por este mismo correo.
                </Text>
              </>
            )}

            <Text style={deliveryInfo}>
              <strong>Tiempo estimado de llegada:</strong> 3 a 5 días hábiles
            </Text>
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href={orderUrl} style={ctaButton}>
              {trackingNumber ? 'Rastrear mi pedido' : 'Ver mi pedido'}
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ¿Tienes preguntas? Escríbenos por{' '}
              <a href="https://wa.me/message" style={footerLink}>WhatsApp</a>
              {' '}o responde este correo.
            </Text>
            <Text style={footerText}>
              <a href={`${appUrl}/politica-de-devoluciones`} style={footerLink}>Política de devoluciones</a>
              {' · '}
              <a href={`${appUrl}/contacto`} style={footerLink}>Contacto</a>
            </Text>
            <Text style={footerCopy}>
              © {new Date().getFullYear()} Savaya · Todos los derechos reservados
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#F5F5F5',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  backgroundColor: '#1A1A2E',
  padding: '24px 40px',
  textAlign: 'center',
}

const logoText: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 900,
  letterSpacing: '6px',
  color: '#ffffff',
}

const heroSection: React.CSSProperties = {
  padding: '36px 40px 28px',
  textAlign: 'center',
}

const iconWrapper: React.CSSProperties = {
  marginBottom: '12px',
}

const iconText: React.CSSProperties = {
  margin: 0,
  fontSize: '40px',
}

const statusLabel: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#888888',
}

const heroHeading: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: '24px',
  fontWeight: 700,
  color: '#111111',
  lineHeight: '1.3',
}

const heroSubtitle: React.CSSProperties = {
  margin: '0 0 24px',
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.7',
}

const orderBadge: React.CSSProperties = {
  border: '2px solid #1A1A2E',
  borderRadius: '4px',
  padding: '14px 24px',
  display: 'inline-block',
}

const orderBadgeLabel: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#888888',
}

const orderBadgeNumber: React.CSSProperties = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 700,
  color: '#1A1A2E',
  letterSpacing: '1px',
}

const divider: React.CSSProperties = {
  borderTop: '1px solid #EBEBEB',
  margin: '0 40px',
}

const section: React.CSSProperties = {
  padding: '24px 40px',
}

const sectionTitle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#888888',
}

const trackingBox: React.CSSProperties = {
  backgroundColor: '#F5F5F5',
  borderRadius: '4px',
  padding: '16px 20px',
  marginBottom: '16px',
}

const trackingNumber_: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: '18px',
  fontWeight: 700,
  color: '#1A1A2E',
  letterSpacing: '1px',
}

const trackingNote: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#888888',
}

const infoText: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.6',
}

const deliveryInfo: React.CSSProperties = {
  margin: '16px 0 0',
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.6',
}

const ctaSection: React.CSSProperties = {
  padding: '28px 40px',
  textAlign: 'center',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#1A1A2E',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '14px 32px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footer: React.CSSProperties = {
  backgroundColor: '#F5F5F5',
  padding: '20px 40px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '12px',
  color: '#888888',
  lineHeight: '1.6',
}

const footerLink: React.CSSProperties = {
  color: '#555555',
  textDecoration: 'underline',
}

const footerCopy: React.CSSProperties = {
  margin: '12px 0 0',
  fontSize: '11px',
  color: '#BBBBBB',
}
