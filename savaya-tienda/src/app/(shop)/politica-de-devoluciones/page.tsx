import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Devoluciones y Cambios | Savaya',
  description:
    'Conoce nuestra política de devoluciones y cambios: 7 días desde la recepción del pedido, producto sin uso con etiquetas.',
}

export default function PoliticaDevolucionesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <section className="bg-accent py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
            Información de la tienda
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Devoluciones y Cambios
          </h1>
          <p className="mt-4 text-white/70 font-body text-base max-w-xl mx-auto">
            Tu satisfacción es nuestra prioridad. Conoce los pasos para gestionar
            una devolución o cambio de forma simple.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* Resumen rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '7', label: 'días para solicitar', sub: 'desde que recibes el pedido' },
              { icon: '✓', label: 'sin uso y con etiquetas', sub: 'condición del artículo' },
              { icon: '→', label: 'vía WhatsApp', sub: 'cómo iniciar el proceso' },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-gray-light rounded p-5 text-center bg-gray-bg"
              >
                <p className="font-display text-3xl text-gold mb-1">{item.icon}</p>
                <p className="font-heading font-bold text-black text-sm">{item.label}</p>
                <p className="font-body text-xs text-gray-text mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-light" />

          {/* Plazo */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Plazo para solicitar
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed">
              Tienes <strong className="text-black">7 días calendario</strong> contados desde la fecha
              en que recibes tu pedido para solicitar una devolución o cambio. Una vez transcurrido
              este plazo no podemos aceptar solicitudes, salvo que el artículo presente un defecto de
              fabricación comprobado.
            </p>
            <div className="mt-4 bg-gray-bg border border-gray-light rounded p-4">
              <p className="font-body text-xs text-gray-text">
                <strong className="text-black">Ejemplo:</strong> Si recibes tu pedido el 5 de mayo,
                tienes hasta el 12 de mayo (inclusive) para escribirnos y solicitar la devolución o cambio.
              </p>
            </div>
          </div>

          <hr className="border-gray-light" />

          {/* Cómo iniciar */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Cómo iniciar el proceso
            </h2>
            <ol className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Contáctanos por WhatsApp',
                  desc: 'Escríbenos al +58 424-4426241 dentro del plazo de 7 días. Indica tu número de pedido (#TUL-XXXX-XXXXX), el artículo que deseas devolver o cambiar y el motivo.',
                },
                {
                  step: '02',
                  title: 'Envía fotos del artículo',
                  desc: 'Comparte fotos del producto mostrando su estado actual, las etiquetas y el empaque. Esto nos ayuda a verificar la solicitud rápidamente.',
                },
                {
                  step: '03',
                  title: 'Recibe las instrucciones',
                  desc: 'Nuestro equipo te indicará los datos de envío para devolver el artículo y confirmará la disponibilidad del cambio solicitado (talla, color, modelo diferente).',
                },
                {
                  step: '04',
                  title: 'Envía el paquete',
                  desc: 'Devuelve el artículo en su empaque original con todas las etiquetas intactas vía Zoom, Tealca o MRW. Compártenos el número de guía para hacer el seguimiento.',
                },
                {
                  step: '05',
                  title: 'Procesamos tu cambio o reembolso',
                  desc: 'Una vez recibido y verificado el artículo (1-2 días hábiles), despachamos el cambio o procesamos el reembolso según lo acordado.',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="font-display text-gold text-2xl leading-none flex-shrink-0 w-8">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-heading font-semibold text-black text-sm mb-0.5">
                      {item.title}
                    </p>
                    <p className="font-body text-sm text-gray-text leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <hr className="border-gray-light" />

          {/* Condiciones */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Condiciones del artículo
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed mb-4">
              Para que una devolución o cambio sea aceptado, el artículo debe cumplir
              <strong className="text-black"> todas</strong> las siguientes condiciones:
            </p>
            <ul className="space-y-2">
              {[
                'Sin usar, sin lavar ni planchar.',
                'Con todas las etiquetas originales intactas y sin remover.',
                'En su empaque o bolsa original.',
                'Sin manchas, perfume, desodorante u olores.',
                'Sin deformaciones, roturas ni daños causados por el usuario.',
              ].map((cond, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gold font-bold text-sm mt-0.5 flex-shrink-0">✓</span>
                  <span className="font-body text-sm text-gray-text">{cond}</span>
                </li>
              ))}
            </ul>
            <p className="font-body text-sm text-gray-text leading-relaxed mt-4">
              Nos reservamos el derecho de rechazar artículos que no cumplan estas condiciones y
              devolverlos al cliente a su costo.
            </p>
          </div>

          <hr className="border-gray-light" />

          {/* Excepciones */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Artículos sin devolución
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed mb-4">
              Por razones de higiene y naturaleza del producto, los siguientes artículos{' '}
              <strong className="text-black">no tienen devolución ni cambio</strong>, salvo que
              presenten un defecto de fabricación comprobado:
            </p>
            <div className="border border-sale/20 bg-sale/5 rounded p-5 space-y-2">
              {[
                'Ropa interior (brasieres, pantis, boxers, calzones, etc.)',
                'Vestidos de baño y trajes de baño',
                'Artículos de contacto directo: aretes, piercings, máscaras faciales',
                'Artículos comprados en sección de Remates, Liquidación o marcados como "Venta final"',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-sale font-bold text-sm flex-shrink-0 mt-0.5">✕</span>
                  <span className="font-body text-sm text-gray-text">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-light" />

          {/* Costos de envío */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              ¿Quién cubre el envío de devolución?
            </h2>
            <div className="space-y-3">
              <div className="border border-gray-light rounded p-4">
                <p className="font-heading font-semibold text-black text-sm mb-1">
                  Cambio de talla o preferencia del cliente
                </p>
                <p className="font-body text-xs text-gray-text leading-relaxed">
                  El costo del envío de regreso corre por cuenta del cliente. El reenvío del nuevo
                  artículo también tiene un costo que se calcula al momento del cambio.
                </p>
              </div>
              <div className="border border-gray-light rounded p-4">
                <p className="font-heading font-semibold text-black text-sm mb-1">
                  Defecto de fabricación o error de Savaya
                </p>
                <p className="font-body text-xs text-gray-text leading-relaxed">
                  Savaya cubre el 100% del costo de envío tanto del retorno del artículo
                  defectuoso como del reenvío del artículo correcto o de reposición.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-light" />

          {/* Reembolsos */}
          <div>
            <h2 className="font-heading font-bold text-xl text-black mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gold inline-block rounded-full" />
              Reembolsos
            </h2>
            <p className="font-body text-sm text-gray-text leading-relaxed">
              Los reembolsos se procesan por el mismo método de pago original (Zelle, Binance, USDT,
              transferencia bancaria, etc.) en un plazo de <strong className="text-black">3 a 5 días hábiles</strong>{' '}
              una vez que recibamos y verifiquemos el artículo devuelto. En algunos casos podemos
              ofrecer crédito en tienda (gift card) de forma inmediata como alternativa al reembolso.
            </p>
          </div>

          {/* CTA */}
          <div className="bg-gray-bg border border-gray-light rounded p-6 text-center">
            <p className="font-heading font-semibold text-black mb-1">
              ¿Necesitas iniciar una devolución o cambio?
            </p>
            <p className="font-body text-sm text-gray-text mb-4">
              Escríbenos directamente por WhatsApp y te ayudamos en el proceso.
            </p>
            <a
              href="https://wa.me/584141100100?text=Hola%2C+quiero+gestionar+una+devoluci%C3%B3n+o+cambio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent text-white font-heading font-semibold text-sm px-6 py-3 rounded hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Iniciar devolución por WhatsApp
            </a>
          </div>

          <p className="text-xs text-gray-text font-body text-center pt-2">
            Última actualización: Mayo 2026
          </p>
        </div>
      </section>
    </main>
  )
}
