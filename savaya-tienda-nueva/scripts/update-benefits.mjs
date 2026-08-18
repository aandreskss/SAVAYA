import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const content = {
  benefits: [
    {
      icon: 'truck',
      title: 'Envíos nacionales',
      description: 'Zoom, Tealca y MRW desde Valencia, Carabobo.',
    },
    {
      icon: 'whatsapp',
      title: 'Atención por WhatsApp',
      description: 'Respuesta rápida de lunes a sábado de 9 am a 6 pm.',
    },
    {
      icon: 'refresh',
      title: 'Cambios en 7 días',
      description: 'Si el calzado no es tu talla, realizamos el cambio sin costo adicional.',
    },
    {
      icon: 'shield',
      title: 'Compra segura',
      description: 'Múltiples métodos de pago verificados. Tu pedido está protegido.',
    },
  ],
}

await sql`
  UPDATE page_sections
  SET content = ${JSON.stringify(content)}, updated_at = NOW()
  WHERE id = '12bac4dc-6494-44f2-8ff3-af03d3b2a158'
`
console.log('✓ benefits_block actualizado')
