import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes | SAVAYA',
  description:
    'Resuelve tus dudas sobre pedidos, pagos, envíos, tallas y devoluciones en SAVAYA.',
  alternates: { canonical: `${BASE_URL}/preguntas-frecuentes` },
}

const FAQ_SECTIONS = [
  {
    title: 'Pedidos y pagos',
    items: [
      {
        q: '¿Cuáles son los métodos de pago disponibles?',
        a: 'Aceptamos Pago Móvil (Bolívares), Zelle (USD), USDT TRC-20, Binance Pay y efectivo en tienda. El método de pago y los datos bancarios se muestran durante el proceso de checkout.',
      },
      {
        q: '¿Puedo reservar un par sin pagar el total?',
        a: 'Sí. Ofrecemos reservas con pago parcial (20%, 35% o 50% del total). La reserva se mantiene activa 24 horas desde la confirmación del pago. El saldo restante se cancela antes de la entrega.',
      },
      {
        q: '¿Cómo confirmo mi pago?',
        a: 'Al finalizar el checkout, puedes subir el comprobante de transferencia directamente desde la app. También puedes enviarlo por WhatsApp al +58 414-1100100.',
      },
      {
        q: '¿En qué moneda se muestra el precio?',
        a: 'Los precios se muestran en dólares (USD) y se convierten automáticamente a bolívares (Bs.) usando la tasa BCV vigente al momento de la compra.',
      },
    ],
  },
  {
    title: 'Envíos',
    items: [
      {
        q: '¿A qué estados hacen envíos?',
        a: 'Hacemos envíos a todo el territorio venezolano a través de agencias de encomiendas nacionales (MRW, Zoom, TealCA, entre otras). Para Valencia y Carabobo también ofrecemos entrega a domicilio.',
      },
      {
        q: '¿Cuánto tiempo tarda el envío?',
        a: 'Entrega local (Valencia): 24–48 horas. Envíos nacionales: 2–5 días hábiles dependiendo del destino y la agencia. Calculamos el costo exacto durante el checkout según tu ciudad.',
      },
      {
        q: '¿El costo de envío está incluido en el precio?',
        a: 'No. El costo de envío se calcula por separado y se muestra antes de confirmar el pedido.',
      },
    ],
  },
  {
    title: 'Tallas y producto',
    items: [
      {
        q: '¿Cómo sé qué talla me queda?',
        a: 'Consulta nuestra Guía de tallas para encontrar tu número según la medida de tu pie en centímetros. Si tienes dudas, escríbenos por WhatsApp antes de hacer tu pedido.',
      },
      {
        q: '¿Los colores del producto son exactos a las fotos?',
        a: 'Hacemos todo lo posible para que las fotos representen fielmente los colores. Sin embargo, puede haber variaciones pequeñas según el monitor o el dispositivo. Si necesitas ver el producto en persona, puedes visitarnos en Valencia.',
      },
    ],
  },
  {
    title: 'Devoluciones y cambios',
    items: [
      {
        q: '¿Puedo devolver un producto?',
        a: 'Aceptamos cambios y devoluciones dentro de los 7 días siguientes a la recepción, siempre que el producto esté en perfectas condiciones, sin uso y en su empaque original. Consulta los detalles en nuestra política de cambios y devoluciones.',
      },
      {
        q: '¿Qué hago si recibo un producto defectuoso?',
        a: 'Escríbenos inmediatamente por WhatsApp con fotos del defecto. Los productos con fallas de fabricación se cambian sin costo adicional dentro del plazo de garantía.',
      },
    ],
  },
]

export default function PreguntasFrecuentesPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">
        Preguntas frecuentes
      </h1>
      <p className="text-text-secondary mb-12">
        ¿No encuentras tu respuesta? Escríbenos por{' '}
        <a
          href="https://wa.me/584141100100"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          WhatsApp
        </a>
        .
      </p>

      <div className="space-y-10">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl uppercase tracking-wide mb-5">
              {section.title}
            </h2>
            <dl className="space-y-5">
              {section.items.map((item) => (
                <div key={item.q} className="border-b border-border pb-5">
                  <dt className="font-medium mb-2">{item.q}</dt>
                  <dd className="text-text-secondary text-sm leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </main>
  )
}
