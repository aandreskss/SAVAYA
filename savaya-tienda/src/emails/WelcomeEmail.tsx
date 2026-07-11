import * as React from 'react'
import {
  Html, Head, Preview, Body, Container, Section,
  Text, Heading, Button, Hr,
} from '@react-email/components'

export interface WelcomeEmailProps {
  customerName: string
  discountCode?: string | null
  appUrl: string
}

export default function WelcomeEmail({
  customerName,
  discountCode,
  appUrl,
}: WelcomeEmailProps) {
  const firstName = customerName.split(' ')[0]

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Bienvenid@ a Savaya, {firstName} — descubre las últimas tendencias</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>TULUJOSHOP</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={welcomeLabel}>Bienvenid@ a la familia</Text>
            <Heading style={heroHeading}>
              ¡Hola, {firstName}!
            </Heading>
            <Text style={heroSubtitle}>
              Nos alegra tenerte en Savaya. Encuentra moda de mujer, hombre y niños
              con los mejores precios y una experiencia de compra que te va a encantar.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Features */}
          <Section style={section}>
            <Text style={sectionTitle}>¿Qué encontrarás en Savaya?</Text>
            <Section style={featureItem}>
              <Text style={featureEmoji}>&#128084;</Text>
              <Text style={featureText}>
                <strong>Moda para toda la familia</strong> — Mujer, hombre y niños
              </Text>
            </Section>
            <Section style={featureItem}>
              <Text style={featureEmoji}>&#9989;</Text>
              <Text style={featureText}>
                <strong>Calidad garantizada</strong> — Productos seleccionados con cuidado
              </Text>
            </Section>
            <Section style={featureItem}>
              <Text style={featureEmoji}>&#128666;</Text>
              <Text style={featureText}>
                <strong>Envío a todo el país</strong> — Rápido y seguro
              </Text>
            </Section>
          </Section>

          {/* Discount code (if provided) */}
          {discountCode && (
            <>
              <Hr style={divider} />
              <Section style={discountSection}>
                <Text style={discountLabel}>Tu regalo de bienvenida</Text>
                <Text style={discountDescription}>
                  Usa este código en tu primera compra y obtén un descuento especial:
                </Text>
                <Section style={discountBox}>
                  <Text style={discountCode_}>{discountCode}</Text>
                </Section>
                <Text style={discountNote}>
                  Cópialo y aplícalo en el carrito al momento de pagar.
                </Text>
              </Section>
            </>
          )}

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>¿Lista/o para explorar?</Text>
            <Button href={appUrl} style={ctaButton}>
              Explorar la tienda
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ¿Tienes preguntas? Escríbenos por{' '}
              <a href="https://wa.me/message" style={footerLink}>WhatsApp</a>
              {' '}o visita nuestro{' '}
              <a href={`${appUrl}/faq`} style={footerLink}>centro de ayuda</a>.
            </Text>
            <Text style={footerText}>
              <a href={`${appUrl}/mujer`} style={footerLink}>Mujer</a>
              {' · '}
              <a href={`${appUrl}/hombre`} style={footerLink}>Hombre</a>
              {' · '}
              <a href={`${appUrl}/ninos`} style={footerLink}>Niños</a>
              {' · '}
              <a href={`${appUrl}/nuevas-colecciones`} style={footerLink}>Nuevas colecciones</a>
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

const welcomeLabel: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#C9A84C',
}

const heroHeading: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '28px',
  fontWeight: 700,
  color: '#111111',
  lineHeight: '1.3',
}

const heroSubtitle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.7',
}

const divider: React.CSSProperties = {
  borderTop: '1px solid #EBEBEB',
  margin: '0 40px',
}

const section: React.CSSProperties = {
  padding: '24px 40px',
}

const sectionTitle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#888888',
}

const featureItem: React.CSSProperties = {
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
}

const featureEmoji: React.CSSProperties = {
  margin: '0 8px 0 0',
  fontSize: '16px',
  display: 'inline',
}

const featureText: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.5',
  display: 'inline',
}

const discountSection: React.CSSProperties = {
  padding: '28px 40px',
  textAlign: 'center',
  backgroundColor: '#FFFDF5',
}

const discountLabel: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#C9A84C',
}

const discountDescription: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '14px',
  color: '#555555',
}

const discountBox: React.CSSProperties = {
  display: 'inline-block',
  border: '2px dashed #C9A84C',
  borderRadius: '4px',
  padding: '14px 32px',
  marginBottom: '12px',
  backgroundColor: '#ffffff',
}

const discountCode_: React.CSSProperties = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 800,
  letterSpacing: '3px',
  color: '#1A1A2E',
}

const discountNote: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#888888',
}

const ctaSection: React.CSSProperties = {
  padding: '32px 40px',
  textAlign: 'center',
}

const ctaText: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '16px',
  color: '#111111',
  fontWeight: 600,
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
