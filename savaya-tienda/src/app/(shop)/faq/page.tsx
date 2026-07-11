import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes | Savaya',
  description:
    'Resolvemos tus dudas sobre pagos (Zelle, Binance, USDT), envíos a Venezuela, pedidos, devoluciones y garantías en Savaya.',
  alternates: { canonical: `${APP_URL}/faq` },
  openGraph: {
    title: 'Preguntas Frecuentes | Savaya',
    description: 'Resolvemos tus dudas sobre pagos, envíos, pedidos, devoluciones y garantías en Savaya Venezuela.',
    url: `${APP_URL}/faq`,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'FAQ — Savaya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ — Preguntas Frecuentes | Savaya',
  },
}

const faqs = [
  // ─── Términos y Condiciones ────────────────────────────────────────────────
  {
    category: 'Términos y Condiciones',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    items: [
      {
        q: '¿Qué es Savaya?',
        a: 'Savaya es una marca venezolana de calzado femenino fundada en Valencia, Carabobo. Llevamos más de 4 años vistiendo los pasos de la mujer venezolana con modelos casuales, deportivos y de vestir. Operamos en línea a través de savayavzla.com con envíos a todo el territorio nacional.',
      },
      {
        q: '¿Quiénes pueden comprar en Savaya?',
        a: 'El sitio está disponible para cualquier persona mayor de edad con capacidad legal para contratar. Al realizar una compra, el usuario confirma que acepta nuestros términos y condiciones.',
      },
      {
        q: '¿Cuál es mi responsabilidad al registrarme?',
        a: 'Eres responsable de mantener la confidencialidad de tus credenciales de acceso. Savaya puede suspender cuentas que infrinjan estos términos o realicen un uso indebido de la plataforma. Si detectas acceso no autorizado a tu cuenta, contáctanos de inmediato.',
      },
      {
        q: '¿Está permitida la reventa de los productos?',
        a: 'Los productos adquiridos en Savaya son para uso personal. Se prohíbe la reventa masiva, cesión o uso comercial no autorizado. Si tienes interés en una relación comercial, contáctanos directamente.',
      },
      {
        q: '¿Puede Savaya modificar sus políticas?',
        a: 'Sí. Nos reservamos el derecho de actualizar o modificar estos términos y condiciones en cualquier momento. Los cambios se publicarán en esta página y entran en vigencia desde su publicación. Te recomendamos revisarla periódicamente.',
      },
      {
        q: '¿Qué pasa con la propiedad intelectual del sitio?',
        a: 'Todos los contenidos de savayavzla.com (textos, imágenes, logos, diseños, etc.) son propiedad de Savaya y están protegidos por las leyes venezolanas de propiedad intelectual. Queda prohibida su reproducción o uso sin autorización expresa.',
      },
    ],
  },

  // ─── Políticas de Pago ─────────────────────────────────────────────────────
  {
    category: 'Pagos y Políticas de Pago',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
    items: [
      {
        q: '¿Qué métodos de pago aceptan?',
        a: 'Aceptamos Zelle, Binance Pay, USDT (red TRC20), transferencia bancaria venezolana (Banesco, Mercantil, Venezuela, entre otros), pago móvil interbancario y efectivo en dólares o bolívares (tasa BCV del día). Todos los precios se expresan en USD.',
      },
      {
        q: '¿Cómo es el proceso de pago?',
        a: 'Al finalizar tu pedido en savayavzla.com, seleccionas el método de pago de tu preferencia. Recibirás los datos de pago correspondientes (número de cuenta, Pay ID, dirección de wallet, etc.). Una vez realizado el pago, envíanos el comprobante vía WhatsApp junto a tu número de pedido (#TUL-XXXX-XXXXX). Procesamos tu orden en cuanto verificamos la transferencia, normalmente en menos de 2 horas hábiles.',
      },
      {
        q: '¿Cómo pago con Zelle?',
        a: 'Al confirmar tu pedido recibirás los datos Zelle de nuestra cuenta. Realiza la transferencia por el monto exacto y envíanos la captura del comprobante por WhatsApp junto a tu número de pedido.',
      },
      {
        q: '¿Cómo pago con Binance Pay o USDT?',
        a: 'Te enviamos nuestro Pay ID de Binance o la dirección de wallet TRC20 al momento del checkout. Realiza la transferencia y envíanos el hash o captura de comprobante por WhatsApp. Solo aceptamos USDT en red TRC20.',
      },
      {
        q: '¿Puedo pagar con pago móvil o transferencia bancaria venezolana?',
        a: 'Sí. Aceptamos pago móvil interbancario y transferencias a nuestras cuentas en bolívares. Los datos bancarios (banco, número de cuenta, cédula y nombre) te los proporcionamos al confirmar el pedido. El monto en Bs. se calcula a la tasa BCV del día.',
      },
      {
        q: '¿Puedo pagar en efectivo?',
        a: 'Sí, aceptamos efectivo en dólares o bolívares (tasa BCV) para pedidos de retiro en tienda o con método de entrega "pago en destino". Para envíos nacionales el pago debe realizarse antes del despacho.',
      },
      {
        q: '¿Mis datos de pago están seguros?',
        a: 'En Savaya nos tomamos la seguridad de tu información muy en serio. Toda la comunicación de datos de pago se realiza por canales directos y cifrados (WhatsApp). No almacenamos datos de tarjetas ni credenciales bancarias. Los comprobantes se usan únicamente para verificar el pago y son eliminados una vez confirmada la transacción.',
      },
    ],
  },

  // ─── Envíos ────────────────────────────────────────────────────────────────
  {
    category: 'Métodos y Políticas de Envíos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M8.25 5.25h6M8.25 5.25V3.75m0 1.5h6m0 0V3.75m0 1.5v12.75m-6 0V5.25" />
      </svg>
    ),
    items: [
      {
        q: '¿Cuáles son las opciones de envío?',
        a: 'Ofrecemos tres opciones: (1) Envío a domicilio/delivery en el área de Carabobo, (2) Envío nacional por agencia de paquetería (Zoom, Tealca o MRW) y (3) Pick-up — retiro en nuestra oficina sin costo adicional. Elige la opción que más te convenga en el checkout.',
      },
      {
        q: '¿A dónde hacen envíos?',
        a: 'Realizamos envíos a todo el territorio venezolano a través de Zoom, Tealca y MRW. Puedes elegir la empresa disponible en tu ciudad al momento del checkout.',
      },
      {
        q: '¿Cuánto tiempo tarda el envío?',
        a: 'Los envíos tienen un tiempo estimado de 3 a 5 días hábiles luego de confirmado y facturado el pedido. Para envío express (disponible en algunas ciudades) el tiempo es de 1 a 2 días hábiles. Los plazos corren desde que verificamos tu pago y despachamos el paquete.',
      },
      {
        q: '¿Cuánto cuesta el envío?',
        a: 'El costo varía según la empresa de paquetería, la ciudad de destino y el peso del paquete. El costo exacto se calcula al ingresar tu dirección en el checkout. Ofrecemos envío gratuito en pedidos superiores a $50.',
      },
      {
        q: '¿Puedo retirar mi pedido en tienda / pick-up?',
        a: 'Sí. El retiro en nuestra oficina no tiene costo adicional. Una vez listo tu pedido, te notificamos por WhatsApp para coordinar el retiro. El tiempo de preparación es de 1 a 2 días hábiles tras confirmar el pago.',
      },
      {
        q: '¿Cómo hago seguimiento de mi envío?',
        a: 'Una vez despachado tu pedido te enviamos el número de guía por WhatsApp y por email. Con ese número puedes rastrear tu paquete directamente en la web de Zoom, Tealca o MRW. También puedes usar nuestro rastreador en savayavzla.com/rastrear.',
      },
      {
        q: '¿Qué pasa si no estoy cuando llegue el paquete?',
        a: 'El mensajero o la empresa de paquetería intentará contactarte para coordinar la entrega. Si no es posible, se realizará un segundo intento. En caso de que fallen ambos intentos, el paquete queda retenido en la agencia más cercana por 5 días hábiles. Contáctanos si tienes algún inconveniente.',
      },
      {
        q: '¿Savaya se responsabiliza por retrasos en la entrega?',
        a: 'Nos esforzamos por cumplir los plazos estimados. Sin embargo, no nos hacemos responsables por retrasos causados por factores externos como huelgas, condiciones climáticas, fallas del operador logístico u otras causas de fuerza mayor. En esos casos te mantenemos informado de inmediato.',
      },
    ],
  },

  // ─── Pedidos ───────────────────────────────────────────────────────────────
  {
    category: 'Pedidos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9 2 2 4-4" />
      </svg>
    ),
    items: [
      {
        q: '¿Cómo compro en Savaya?',
        a: 'Navega por nuestro catálogo, selecciona talla y color, agrega el artículo al carrito y finaliza la compra. Ingresa tus datos de envío, elige el método de entrega y el método de pago, y confirma el pedido. Recibirás un email y mensaje de WhatsApp de confirmación.',
      },
      {
        q: '¿Cómo sé el estado de mi pedido?',
        a: 'Puedes ver el estado actualizado de tus pedidos en la sección "Mis Pedidos" de tu cuenta en savayavzla.com. También te notificamos por WhatsApp cada vez que tu pedido cambia de estado: confirmado, en preparación, despachado y entregado.',
      },
      {
        q: '¿Dónde encuentro mi número de pedido?',
        a: 'Tu número de pedido (formato #TUL-2026-XXXXX) aparece en la pantalla de confirmación al finalizar la compra, en el email de confirmación y en tu cuenta bajo "Mis Pedidos". Inclúyelo siempre al contactarnos.',
      },
      {
        q: '¿Puedo modificar o cancelar un pedido?',
        a: 'Puedes solicitar modificaciones o cancelación mientras el estado sea "Pendiente" o "Confirmado". Una vez que el pedido pase a "En preparación" o "Despachado" no es posible modificarlo. Escríbenos por WhatsApp lo antes posible.',
      },
      {
        q: '¿Cómo sé si un producto está disponible?',
        a: 'La disponibilidad de tallas y colores se muestra en la página de cada producto. Si una talla aparece deshabilitada, significa que está agotada. Si tienes alguna duda, escríbenos por WhatsApp y consultamos disponibilidad en tiempo real.',
      },
      {
        q: '¿Qué hago si mi pedido llega incompleto o con un producto incorrecto?',
        a: 'Contáctanos de inmediato por WhatsApp con fotos del paquete y del contenido. Gestionamos el reenvío del artículo correcto o faltante sin costo adicional para ti en el menor tiempo posible.',
      },
      {
        q: '¿Emiten facturas o comprobantes fiscales?',
        a: 'Emitimos nota de entrega y comprobante de la transacción con cada pedido. Si necesitas una factura formal para persona jurídica, indícalo al realizar tu pedido y coordinaremos con nuestro departamento administrativo.',
      },
    ],
  },

  // ─── Devoluciones y Garantías ──────────────────────────────────────────────
  {
    category: 'Devoluciones y Garantías',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    items: [
      {
        q: '¿Cuál es el plazo de garantía de los productos?',
        a: 'Todos los productos de Savaya cuentan con garantía de 7 días calendario contados desde la fecha de recepción del pedido. Durante ese período aceptamos cambios o devoluciones por defecto de fabricación, producto dañado o producto incorrecto.',
      },
      {
        q: '¿Qué situaciones dan derecho a cambio o devolución?',
        a: 'Aceptamos devoluciones y cambios en los siguientes casos: (1) cambio de talla, (2) producto dañado o con defecto de fabricación, (3) producto recibido no corresponde al solicitado, (4) características del producto son diferentes a las descritas en la web. También aplica en casos de fraude o pago no autorizado.',
      },
      {
        q: '¿Cómo inicio una devolución o cambio?',
        a: 'Escríbenos por WhatsApp al +58 424-4426241 indicando tu número de pedido (#TUL-XXXX-XXXXX), el artículo a devolver o cambiar y el motivo. Nuestro equipo responderá en un máximo de 48 horas hábiles con los pasos a seguir.',
      },
      {
        q: '¿Qué condiciones debe cumplir el producto para ser devuelto?',
        a: 'El artículo debe estar en perfecto estado, sin usar, sin lavar, con todas sus etiquetas originales intactas y en su empaque o caja original, tal como fue despachado. No se aceptan devoluciones de artículos con signos de uso, manchas, deformaciones, olor a perfume o con etiquetas removidas.',
      },
      {
        q: '¿Qué artículos no tienen devolución?',
        a: 'Por razones de higiene, no aceptamos devoluciones de ropa interior, vestidos de baño ni accesorios de contacto directo (aretes, etc.). Tampoco se aceptan devoluciones de artículos adquiridos en sección de Remates o Liquidación, salvo defecto de fabricación comprobado.',
      },
      {
        q: '¿El costo del envío de devolución lo paga el cliente?',
        a: 'Si la devolución es por cambio de talla o de opinión, el costo del envío de regreso corre por cuenta del cliente. El costo del envío original tampoco se reembolsa. Si el motivo es defecto de fabricación o error nuestro (producto incorrecto), Savaya cubre el costo del envío de vuelta.',
      },
      {
        q: '¿Cuándo recibo mi reembolso?',
        a: 'Una vez recibido y verificado el producto devuelto (máximo 48 horas hábiles desde la recepción), procesamos el reembolso por el mismo método de pago utilizado. El tiempo de acreditación varía según el método: transferencias bancarias y pago móvil se acreditan el mismo día hábil; Zelle y cripto en 24-48 horas.',
      },
    ],
  },

  // ─── Cuenta y Privacidad ──────────────────────────────────────────────────
  {
    category: 'Cuenta y Privacidad',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    items: [
      {
        q: '¿Es obligatorio crear una cuenta para comprar?',
        a: 'No. Puedes comprar como invitado sin crear una cuenta. Sin embargo, tener una cuenta te permite ver el historial de pedidos, guardar direcciones de envío, administrar tu lista de favoritos y recibir ofertas exclusivas.',
      },
      {
        q: '¿Cómo cambio mi contraseña?',
        a: 'Ve a "Mi Cuenta" → "Perfil" → "Cambiar contraseña". Si olvidaste tu contraseña, en la pantalla de inicio de sesión haz clic en "¿Olvidaste tu contraseña?" e ingresa tu email para recibir el enlace de recuperación.',
      },
      {
        q: '¿Qué datos personales guardan de mí?',
        a: 'Los datos personales recopilados se utilizan únicamente para procesar tus pedidos y mejorar tu experiencia de compra. Guardamos nombre, email, teléfono y dirección de entrega. No compartimos tu información con terceros excepto con las empresas de paquetería (Zoom, Tealca, MRW) para gestionar tu envío.',
      },
      {
        q: '¿Puedo eliminar mi cuenta?',
        a: 'Sí. Puedes solicitar la eliminación de tu cuenta y todos tus datos personales escribiéndonos a Savayarrss@gmail.com o por WhatsApp al +58 424-4426241. Procesamos las solicitudes en un plazo máximo de 10 días hábiles.',
      },
      {
        q: '¿Me enviarán publicidad o spam?',
        a: 'Solo te enviamos comunicaciones relacionadas con tus pedidos (confirmación, estado, envío). Si te suscribes a nuestro newsletter recibirás novedades y ofertas. Puedes darte de baja en cualquier momento desde el enlace al pie de cualquier email o escribiéndonos directamente.',
      },
    ],
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    }))
  ),
}

export default function FaqPage() {
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Hero header */}
      <section className="bg-accent py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
            Soporte
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Preguntas Frecuentes
          </h1>
          <p className="mt-4 text-white/70 font-body text-base max-w-xl mx-auto">
            Encuentra respuestas sobre nuestras políticas, pagos, envíos, pedidos y devoluciones.
            Si no encuentras lo que buscas, escríbenos por WhatsApp.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              {/* Section heading */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-gold">{section.icon}</span>
                <h2 className="font-heading font-bold text-lg text-black tracking-wide uppercase">
                  {section.category}
                </h2>
              </div>
              <div className="border border-gray-light rounded">
                {section.items.map((item, idx) => (
                  <details
                    key={idx}
                    className="group border-b border-gray-light last:border-b-0"
                  >
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-gray-bg transition-colors">
                      <span className="font-heading font-semibold text-sm text-black">
                        {item.q}
                      </span>
                      <span className="flex-shrink-0 text-gray-text group-open:rotate-45 transition-transform duration-200">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-5 pb-5 pt-1">
                      <p className="font-body text-sm text-gray-text leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* CTA WhatsApp */}
          <div className="bg-gray-bg rounded p-6 text-center border border-gray-light">
            <p className="font-heading font-semibold text-black mb-1">
              ¿No encontraste tu respuesta?
            </p>
            <p className="font-body text-sm text-gray-text mb-4">
              Nuestro equipo está disponible de lunes a viernes de 9 am a 6 pm (VET, UTC-4).
            </p>
            <a
              href="https://wa.me/584141100100"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent text-white font-heading font-semibold text-sm px-6 py-3 rounded hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Escríbenos por WhatsApp
            </a>
          </div>

          <p className="text-center text-xs text-gray-text font-body">
            Última actualización: Mayo 2026
          </p>
        </div>
      </section>
    </main>
  )
}
