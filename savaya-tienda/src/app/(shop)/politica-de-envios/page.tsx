import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Envíos | Savaya',
  description:
    'Información sobre envíos a todo Venezuela vía Zoom, Tealca y MRW. Tiempos, costos y seguimiento de pedidos.',
}

export default function PoliticaEnviosPage() {
  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <section className="bg-accent py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
            Información de la tienda
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Política de Envíos
          </h1>
          <p className="mt-4 text-white/70 font-body text-base max-w-xl mx-auto">
            Hacemos llegar tu pedido a cualquier rincón de Venezuela con seguridad y rapidez.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* Empresas de paquetería */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Nuestras empresas de paquetería
            </h2>
            <p className="font-body text-gray-text text-sm leading-relaxed mb-5">
              Trabajamos con las principales empresas de paquetería del país para ofrecerte la mejor
              cobertura y confiabilidad. Al finalizar tu compra puedes elegir la empresa de tu preferencia
              o la que tengas disponible en tu ciudad.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  name: 'Zoom',
                  detail: 'Cobertura nacional. Una de las redes más amplias de Venezuela.',
                  url: 'https://www.zoom.com.ve',
                },
                {
                  name: 'Tealca',
                  detail: 'Amplia red de agencias en todo el país con seguimiento en línea.',
                  url: 'https://www.tealca.com',
                },
                {
                  name: 'MRW',
                  detail: 'Servicio confiable con múltiples sucursales en Venezuela.',
                  url: 'https://www.mrw.com.ve',
                },
              ].map((carrier) => (
                <div
                  key={carrier.name}
                  className="border border-gray-light rounded p-5 bg-gray-bg"
                >
                  <p className="font-heading font-bold text-black text-base mb-1">{carrier.name}</p>
                  <p className="font-body text-xs text-gray-text leading-relaxed mb-3">
                    {carrier.detail}
                  </p>
                  <a
                    href={carrier.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-heading text-xs font-semibold text-gold hover:underline"
                  >
                    Rastrear en {carrier.name} →
                  </a>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-light" />

          {/* Tiempos de entrega */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Tiempos de entrega
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed mb-5">
              Los tiempos de entrega se cuentan en <strong className="text-black">días hábiles</strong> y
              comienzan a correr una vez que verificamos tu pago y despachamos el paquete (generalmente
              el mismo día o el siguiente día hábil).
            </p>
            <div className="border border-gray-light rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent text-white">
                    <th className="font-heading font-semibold text-left px-4 py-3 text-xs tracking-wide">
                      Modalidad
                    </th>
                    <th className="font-heading font-semibold text-left px-4 py-3 text-xs tracking-wide">
                      Tiempo estimado
                    </th>
                    <th className="font-heading font-semibold text-left px-4 py-3 text-xs tracking-wide">
                      Disponibilidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-light">
                    <td className="font-body px-4 py-3 text-black font-medium">
                      Estándar
                    </td>
                    <td className="font-body px-4 py-3 text-gray-text">3 – 5 días hábiles</td>
                    <td className="font-body px-4 py-3 text-gray-text">Todo el país</td>
                  </tr>
                  <tr className="border-t border-gray-light bg-gray-bg">
                    <td className="font-body px-4 py-3 text-black font-medium">
                      Express
                    </td>
                    <td className="font-body px-4 py-3 text-gray-text">1 – 2 días hábiles</td>
                    <td className="font-body px-4 py-3 text-gray-text">Ciudades principales</td>
                  </tr>
                  <tr className="border-t border-gray-light">
                    <td className="font-body px-4 py-3 text-black font-medium">
                      Retiro en tienda
                    </td>
                    <td className="font-body px-4 py-3 text-gray-text">1 – 2 días hábiles</td>
                    <td className="font-body px-4 py-3 text-gray-text">Sin costo</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="font-body text-xs text-gray-text mt-3">
              * Los tiempos son estimados y pueden variar por condiciones internas de cada empresa de paquetería.
              No nos hacemos responsables por retrasos causados por las empresas transportistas.
            </p>
          </div>

          <hr className="border-gray-light" />

          {/* Costos */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Costos de envío
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed mb-4">
              El costo de envío depende de la empresa de paquetería, la ciudad de destino y el peso
              del paquete. El monto exacto se calcula automáticamente al ingresar tu dirección durante
              el proceso de compra.
            </p>
            <div className="bg-gray-bg border border-gray-light rounded p-5">
              <div className="flex items-start gap-3">
                <span className="text-gold flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="font-heading font-bold text-black text-sm mb-1">
                    Envío gratis en pedidos mayores a $50
                  </p>
                  <p className="font-body text-xs text-gray-text">
                    Aplica para envío estándar a cualquier punto del país. El beneficio se aplica
                    automáticamente en el checkout cuando tu carrito supera los $50 USD.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-light" />

          {/* Dirección de envío */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              ¿A oficina o a domicilio?
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed mb-4">
              Puedes elegir recibir tu pedido de dos formas:
            </p>
            <div className="space-y-3">
              <div className="border border-gray-light rounded p-4">
                <p className="font-heading font-semibold text-black text-sm mb-1">
                  Entrega en agencia (oficina)
                </p>
                <p className="font-body text-xs text-gray-text leading-relaxed">
                  Tu pedido queda retenido en la agencia de Zoom, Tealca o MRW más cercana a ti.
                  Recibirás una notificación cuando esté disponible. Generalmente más económico y rápido
                  de procesar. Lleva tu cédula de identidad al retirarlo.
                </p>
              </div>
              <div className="border border-gray-light rounded p-4">
                <p className="font-heading font-semibold text-black text-sm mb-1">
                  Entrega a domicilio
                </p>
                <p className="font-body text-xs text-gray-text leading-relaxed">
                  El mensajero de la empresa de paquetería lleva el pedido directamente a tu dirección.
                  Asegúrate de proporcionar una dirección completa y precisa (calle, edificio, piso,
                  urbanización, municipio, estado) y de tener disponibilidad para recibirlo.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-light" />

          {/* Seguimiento */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Seguimiento de tu pedido
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed mb-4">
              Una vez que tu pedido es despachado recibirás:
            </p>
            <ul className="space-y-2 mb-4">
              {[
                'Notificación por WhatsApp con el número de guía y empresa de paquetería.',
                'Email de confirmación de envío con el mismo número de guía.',
                'Enlace directo al rastreador en línea de la empresa.',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gold font-body font-bold text-sm mt-0.5">✓</span>
                  <span className="font-body text-sm text-gray-text">{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-body text-sm text-gray-text leading-relaxed">
              También puedes consultar el estado de tu envío en cualquier momento desde{' '}
              <strong className="text-black">Mi Cuenta → Mis Pedidos</strong> en savayavzla.com.
            </p>
          </div>

          <hr className="border-gray-light" />

          {/* Paquetes dañados */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Paquetes dañados o extraviados
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed">
              Si recibes un paquete visiblemente dañado, fírmalo como{' '}
              <em>&ldquo;recibido con daño visible&rdquo;</em> ante el mensajero y contáctanos de
              inmediato con fotos del empaque y del contenido. Gestionaremos el reclamo ante la empresa
              de paquetería y buscaremos la mejor solución para ti. En caso de extravío comprobado,
              repondremos el pedido o emitiremos un reembolso completo.
            </p>
          </div>

          <p className="text-xs text-gray-text font-body text-center pt-4">
            Última actualización: Mayo 2026
          </p>
        </div>
      </section>
    </main>
  )
}
