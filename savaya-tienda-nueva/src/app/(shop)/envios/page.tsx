import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Política de envíos | SAVAYA',
  description:
    'Conoce los tiempos, costos y agencias de envío de SAVAYA. Enviamos a todo Venezuela y ofrecemos entrega a domicilio en Valencia, Carabobo.',
  alternates: { canonical: `${BASE_URL}/envios` },
}

export default function EnviosPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">Política de envíos</h1>
      <p className="text-text-secondary mb-10">
        Despachamos a todo el territorio venezolano. Aquí encontrarás todo lo que necesitas saber
        sobre tiempos de entrega, costos y cómo rastrear tu pedido.
      </p>

      <div className="space-y-10">
        {/* Procesamiento */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">
            Procesamiento del pedido
          </h2>
          <div className="bg-surface border border-border rounded-xl p-6 space-y-3 text-sm text-text-secondary">
            <p>
              Los pedidos se procesan una vez confirmado el pago. El tiempo de procesamiento es de
              <strong className="text-text-primary"> 24 horas hábiles</strong> desde la confirmación.
            </p>
            <p>
              Los pedidos realizados después de las 3:00 PM o los días sábado, domingo y feriados se
              procesan el siguiente día hábil.
            </p>
          </div>
        </section>

        {/* Opciones de envío */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">Opciones de envío</h2>
          <div className="space-y-4">
            <div className="border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-medium">Entrega a domicilio — Valencia y Carabobo</h3>
                <span className="text-sm text-text-secondary whitespace-nowrap">24–48 h</span>
              </div>
              <p className="text-sm text-text-secondary">
                Disponible para Valencia y área metropolitana de Carabobo. El costo se calcula según
                tu ubicación durante el checkout.
              </p>
            </div>

            <div className="border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-medium">Encomienda nacional</h3>
                <span className="text-sm text-text-secondary whitespace-nowrap">2–5 días hábiles</span>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                Trabajamos con las principales agencias de encomiendas del país: MRW, Zoom, TealCA,
                entre otras. El costo y la agencia disponible se muestran en el checkout según tu
                ciudad de destino.
              </p>
              <p className="text-sm text-text-secondary">
                Los tiempos de entrega pueden variar según la disponibilidad de la agencia en tu
                localidad y condiciones externas (feriados, cortes de ruta, etc.).
              </p>
            </div>

            <div className="border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-medium">Retiro en tienda — Valencia</h3>
                <span className="text-sm text-text-secondary whitespace-nowrap">Sin costo</span>
              </div>
              <p className="text-sm text-text-secondary">
                Retira tu pedido en nuestra tienda física sin costo de envío. Disponible de lunes a
                sábado en horario de 10:00 AM a 6:00 PM.
              </p>
              <address className="not-italic text-sm text-text-secondary mt-2">
                CC Multi Tienda God is Good, local A-4 · Calle 73, Valencia, Carabobo
              </address>
            </div>
          </div>
        </section>

        {/* Costos */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">Costos de envío</h2>
          <p className="text-sm text-text-secondary mb-4">
            El costo exacto se calcula en el checkout según tu ciudad de destino. No está incluido
            en el precio del producto y se muestra de forma transparente antes de confirmar tu
            pedido.
          </p>
        </section>

        {/* Seguimiento */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">
            Seguimiento del envío
          </h2>
          <p className="text-sm text-text-secondary">
            Una vez despachado tu pedido, recibirás el número de guía por WhatsApp para que puedas
            rastrearlo directamente en la página de la agencia. También puedes consultar el estado
            de tu pedido desde{' '}
            <a href="/mi-cuenta/pedidos" className="underline underline-offset-2 text-accent-gold">
              Mi cuenta → Mis pedidos
            </a>
            .
          </p>
        </section>

        {/* Inconvenientes */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">
            Problemas con tu envío
          </h2>
          <p className="text-sm text-text-secondary">
            Si tu pedido presenta retrasos, daños durante el transporte o no ha llegado dentro del
            tiempo estimado, contáctanos inmediatamente por{' '}
            <a
              href="https://wa.me/584141100100"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-accent-gold"
            >
              WhatsApp
            </a>
            . Gestionamos cada caso de forma directa con la agencia.
          </p>
        </section>
      </div>
    </main>
  )
}
