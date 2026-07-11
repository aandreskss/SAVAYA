import * as React from 'react'
import {
  Html, Head, Preview, Body, Container, Section,
  Row, Column, Text, Heading, Button, Hr, Img,
} from '@react-email/components'

interface OrderItem {
  name: string
  variantInfo: string
  quantity: number
  unitPrice: number
  imageUrl: string | null
}

interface ShippingAddress {
  name: string
  address_line: string
  city: string
  department?: string | null
  phone?: string | null
}

export interface OrderConfirmationProps {
  customerName: string
  orderNumber: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  shippingAddress: ShippingAddress
  paymentMethod: string
  shippingMethod: string
  appUrl: string
}

const SHIPPING_LABELS: Record<string, string> = {
  standard: '3 a 5 días hábiles',
  express: '1 a 2 días hábiles',
  pickup: 'Retiro en tienda (coordinar por WhatsApp)',
  cash_on_delivery: '3 a 5 días hábiles',
}

const PAYMENT_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  binance: 'Binance Pay',
  usdt: 'USDT (TRC20)',
  bank_transfer_ve: 'Transferencia bancaria',
  pago_movil: 'Pago móvil',
  efectivo: 'Efectivo',
  bank_transfer: 'Transferencia bancaria',
}

function fmt(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n)
}

export default function OrderConfirmationEmail({
  customerName,
  orderNumber,
  orderId,
  items,
  subtotal,
  shippingCost,
  discount,
  total,
  shippingAddress,
  paymentMethod,
  shippingMethod,
  appUrl,
}: OrderConfirmationProps) {
  const orderUrl = `${appUrl}/pedido/${orderId}`
  const deliveryTime = SHIPPING_LABELS[shippingMethod] ?? '3 a 5 días hábiles'
  const paymentLabel = PAYMENT_LABELS[paymentMethod] ?? paymentMethod

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Pedido {orderNumber} confirmado — ¡Gracias por tu compra!</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>TULUJOSHOP</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={label}>Confirmación de pedido</Text>
            <Heading style={heroHeading}>
              ¡Gracias por tu compra, {customerName.split(' ')[0]}!
            </Heading>
            <Text style={heroSubtitle}>
              Recibimos tu pedido y lo estamos procesando. Te avisaremos cuando esté en camino.
            </Text>

            {/* Order number badge */}
            <Section style={orderBadge}>
              <Text style={orderBadgeLabel}>Número de pedido</Text>
              <Text style={orderBadgeNumber}>{orderNumber}</Text>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Items */}
          <Section style={section}>
            <Text style={sectionTitle}>Resumen de tu pedido</Text>

            {items.map((item, i) => (
              <Row key={i} style={itemRow}>
                {item.imageUrl ? (
                  <Column style={itemImageCol}>
                    <Img
                      src={item.imageUrl}
                      width={64}
                      height={64}
                      alt={item.name}
                      style={itemImage}
                    />
                  </Column>
                ) : (
                  <Column style={itemImageCol}>
                    <Section style={itemImagePlaceholder} />
                  </Column>
                )}
                <Column style={itemInfoCol}>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemVariant}>{item.variantInfo}</Text>
                  <Text style={itemQty}>Cantidad: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPrice}>{fmt(item.unitPrice * item.quantity)}</Text>
                  {item.quantity > 1 && (
                    <Text style={itemUnitPrice}>{fmt(item.unitPrice)} c/u</Text>
                  )}
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Totals */}
          <Section style={section}>
            <Row style={totalRow}>
              <Column><Text style={totalLabel}>Subtotal</Text></Column>
              <Column style={totalValueCol}><Text style={totalValue}>{fmt(subtotal)}</Text></Column>
            </Row>
            <Row style={totalRow}>
              <Column><Text style={totalLabel}>Envío</Text></Column>
              <Column style={totalValueCol}>
                <Text style={totalValue}>{shippingCost === 0 ? 'Gratis' : fmt(shippingCost)}</Text>
              </Column>
            </Row>
            {discount > 0 && (
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>Descuento</Text></Column>
                <Column style={totalValueCol}><Text style={discountValue}>−{fmt(discount)}</Text></Column>
              </Row>
            )}
            <Hr style={{ ...divider, margin: '8px 0' }} />
            <Row style={totalRow}>
              <Column><Text style={grandTotalLabel}>Total</Text></Column>
              <Column style={totalValueCol}><Text style={grandTotalValue}>{fmt(total)}</Text></Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Shipping & Payment info */}
          <Section style={section}>
            <Row>
              <Column style={infoCol}>
                <Text style={sectionTitle}>Dirección de envío</Text>
                <Text style={infoText}>{shippingAddress.name}</Text>
                <Text style={infoText}>{shippingAddress.address_line}</Text>
                <Text style={infoText}>
                  {shippingAddress.city}
                  {shippingAddress.department ? `, ${shippingAddress.department}` : ''}
                </Text>
                {shippingAddress.phone && (
                  <Text style={infoText}>{shippingAddress.phone}</Text>
                )}
              </Column>
              <Column style={infoCol}>
                <Text style={sectionTitle}>Método de pago</Text>
                <Text style={infoText}>{paymentLabel}</Text>
                <Text style={{ ...sectionTitle, marginTop: '16px' }}>Entrega estimada</Text>
                <Text style={infoText}>{deliveryTime}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href={orderUrl} style={ctaButton}>
              Ver estado de mi pedido
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
              <a href={`${appUrl}/politica-de-envios`} style={footerLink}>Política de envíos</a>
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
}

const label: React.CSSProperties = {
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
  lineHeight: '1.6',
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

const itemRow: React.CSSProperties = {
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid #F5F5F5',
}

const itemImageCol: React.CSSProperties = {
  width: '76px',
  verticalAlign: 'top',
}

const itemImage: React.CSSProperties = {
  borderRadius: '4px',
  objectFit: 'cover',
}

const itemImagePlaceholder: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: '#F5F5F5',
  borderRadius: '4px',
}

const itemInfoCol: React.CSSProperties = {
  verticalAlign: 'top',
  paddingLeft: '4px',
}

const itemName: React.CSSProperties = {
  margin: '0 0 3px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#111111',
}

const itemVariant: React.CSSProperties = {
  margin: '0 0 3px',
  fontSize: '12px',
  color: '#888888',
}

const itemQty: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#888888',
}

const itemPriceCol: React.CSSProperties = {
  width: '100px',
  textAlign: 'right',
  verticalAlign: 'top',
}

const itemPrice: React.CSSProperties = {
  margin: '0 0 2px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#111111',
}

const itemUnitPrice: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  color: '#AAAAAA',
}

const totalRow: React.CSSProperties = {
  marginBottom: '8px',
}

const totalValueCol: React.CSSProperties = {
  textAlign: 'right',
}

const totalLabel: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#555555',
}

const totalValue: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#111111',
}

const discountValue: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#C0392B',
  fontWeight: 600,
}

const grandTotalLabel: React.CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 700,
  color: '#111111',
}

const grandTotalValue: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 700,
  color: '#1A1A2E',
}

const infoCol: React.CSSProperties = {
  width: '50%',
  verticalAlign: 'top',
}

const infoText: React.CSSProperties = {
  margin: '0 0 3px',
  fontSize: '13px',
  color: '#333333',
  lineHeight: '1.5',
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
