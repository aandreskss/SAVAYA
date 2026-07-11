import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Savaya',
  description:
    'Lee los términos y condiciones de uso de Savaya. Precios en USD, pagos manuales, envíos y jurisdicción venezolana.',
}

export default function TerminosPage() {
  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <section className="bg-accent py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
            Legal
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-white/70 font-body text-base">
            Al usar Savaya aceptas los siguientes términos.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="bg-gray-bg border border-gray-light rounded p-4 mb-10">
            <p className="font-body text-xs text-gray-text leading-relaxed">
              <strong className="text-black">Última actualización:</strong> Mayo 2026. Al acceder o realizar una compra en
              savayavzla.com, aceptas quedar vinculado por los presentes Términos y Condiciones. Si no
              estás de acuerdo con alguno de estos términos, por favor no uses nuestra tienda.
            </p>
          </div>

          <div className="space-y-10 font-body text-sm text-gray-text leading-relaxed">

            {/* 1. Identificación */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                1. Identificación del vendedor
              </h2>
              <p>
                Savaya es una tienda de moda en línea operada por Savaya Venezuela, con sede
                en la República Bolivariana de Venezuela. Para consultas puedes escribirnos a{' '}
                <a href="mailto:Savayarrss@gmail.com" className="text-black font-medium hover:text-gold transition-colors underline">
                  Savayarrss@gmail.com
                </a>{' '}
                o al WhatsApp +58 424-4426241.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 2. Aceptación */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                2. Aceptación de los términos
              </h2>
              <p className="mb-3">
                El uso de este sitio web y la realización de cualquier compra implica la aceptación
                plena y sin reservas de los presentes Términos y Condiciones, así como de nuestra
                Política de Privacidad y Política de Envíos y Devoluciones.
              </p>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
                entrarán en vigor desde su publicación en el sitio. Es responsabilidad del usuario
                revisar periódicamente estas condiciones.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 3. Productos y precios */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                3. Productos y precios
              </h2>
              <p className="mb-3">
                Todos los precios publicados en savayavzla.com están expresados en{' '}
                <strong className="text-black">dólares estadounidenses (USD)</strong>. Cuando el pago
                se realiza en bolívares venezolanos (Bs.), el monto se calcula a la tasa oficial
                publicada por el Banco Central de Venezuela (BCV) vigente en la fecha de la transacción.
              </p>
              <p className="mb-3">
                Nos esforzamos por mantener la información de los productos (descripción, imágenes,
                tallas disponibles) actualizada y precisa. Sin embargo, no garantizamos que la
                información sea completamente libre de errores. En caso de error en el precio publicado,
                nos comunicaremos con el cliente antes de procesar el pedido.
              </p>
              <p>
                Las imágenes de productos son referenciales y pueden existir ligeras variaciones de
                color con respecto al producto físico debido a la configuración de pantallas.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 4. Proceso de compra */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                4. Proceso de compra
              </h2>
              <p className="mb-3">
                El proceso de compra en Savaya consta de los siguientes pasos:
              </p>
              <ol className="space-y-2 list-none">
                {[
                  'Selección de productos y tallas/colores en el catálogo.',
                  'Revisión del carrito de compras.',
                  'Ingreso de datos de envío y selección de empresa de paquetería.',
                  'Selección del método de pago y revisión del resumen del pedido.',
                  'Confirmación del pedido y recepción del número de pedido (formato TUL-XXXX-XXXXX).',
                  'Realización del pago y envío del comprobante a nuestro WhatsApp.',
                  'Verificación del pago y despacho del pedido.',
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="font-heading font-bold text-gold text-xs flex-shrink-0 w-4 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4">
                El contrato de compraventa se perfecciona cuando confirmamos el pago recibido y el
                pedido cambia al estado "Confirmado". La simple recepción del número de pedido no
                constituye aceptación definitiva del pedido.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 5. Pagos */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                5. Métodos de pago
              </h2>
              <p className="mb-3">
                Savaya opera con pagos manuales verificados. Los métodos de pago aceptados son:
              </p>
              <ul className="space-y-1.5 mb-3">
                {[
                  'Zelle (transferencia bancaria desde EE. UU.)',
                  'Binance Pay (pago con criptomonedas vía Binance)',
                  'USDT en red TRC20 (Tether USD)',
                  'Transferencia bancaria venezolana (Banesco, Mercantil, Venezuela, etc.)',
                  'Pago móvil interbancario',
                  'Efectivo en USD o bolívares (tasa BCV del día)',
                ].map((method, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gold font-bold flex-shrink-0 mt-0.5">·</span>
                    <span>{method}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-3">
                El cliente es responsable de realizar el pago del monto exacto indicado y de enviar
                el comprobante correspondiente vía WhatsApp dentro de las 24 horas siguientes a la
                realización del pedido. Pedidos sin pago confirmado dentro de ese plazo podrán ser
                cancelados automáticamente.
              </p>
              <p>
                Savaya no almacena datos bancarios ni de billeteras digitales de los clientes.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 6. Disponibilidad y stock */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                6. Disponibilidad de stock
              </h2>
              <p className="mb-3">
                La disponibilidad de productos se muestra en tiempo real según nuestro inventario.
                En casos excepcionales de quiebre de stock simultáneo, nos comunicaremos de inmediato
                con el cliente para ofrecer alternativas (cambio de producto, talla diferente disponible
                o reembolso completo).
              </p>
              <p>
                No garantizamos la disponibilidad permanente de ningún producto en catálogo. Los precios
                y disponibilidad están sujetos a cambios sin previo aviso.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 7. Envíos */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                7. Envíos y entrega
              </h2>
              <p className="mb-3">
                Los envíos se realizan a todo el territorio venezolano a través de Zoom, Tealca y MRW.
                Los tiempos de entrega son estimados y no están garantizados, ya que dependen de factores
                externos a Savaya como la operatividad de las empresas de paquetería.
              </p>
              <p>
                Para información detallada sobre tiempos, costos y proceso de seguimiento, consulta
                nuestra{' '}
                <a href="/politica-de-envios" className="text-black font-medium hover:text-gold transition-colors underline">
                  Política de Envíos
                </a>.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 8. Devoluciones */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                8. Devoluciones y cambios
              </h2>
              <p>
                Las devoluciones y cambios están regulados por nuestra{' '}
                <a href="/politica-de-devoluciones" className="text-black font-medium hover:text-gold transition-colors underline">
                  Política de Devoluciones y Cambios
                </a>
                , la cual forma parte integral de estos Términos y Condiciones.
                En resumen: se aceptan devoluciones dentro de los 7 días posteriores a la recepción,
                siempre que el artículo esté sin uso y con etiquetas originales.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 9. Responsabilidad */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                9. Limitación de responsabilidad
              </h2>
              <p className="mb-3">
                Savaya no será responsable por daños indirectos, incidentales, especiales o
                consecuentes derivados del uso de nuestros productos o servicios. Nuestra
                responsabilidad máxima se limita al monto pagado por el producto en cuestión.
              </p>
              <p>
                No asumimos responsabilidad por demoras, pérdidas o daños causados por las empresas
                de paquetería una vez que el pedido ha sido entregado a dichas empresas con guía
                emitida. Sin embargo, colaboramos activamente con el cliente para gestionar los
                reclamos correspondientes.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 10. Propiedad intelectual */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                10. Propiedad intelectual
              </h2>
              <p>
                Todo el contenido de savayavzla.com (logotipos, imágenes, textos, diseño, código)
                es propiedad de Savaya o está licenciado para su uso. Queda prohibida la
                reproducción, distribución o uso comercial de cualquier elemento sin autorización
                previa y expresa por escrito.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 11. Privacidad */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                11. Privacidad de datos
              </h2>
              <p>
                El tratamiento de tus datos personales se rige por nuestra{' '}
                <a href="/politica-de-privacidad" className="text-black font-medium hover:text-gold transition-colors underline">
                  Política de Privacidad
                </a>
                , que cumple con los principios de la Ley Orgánica de Protección de Datos Personales
                de la República Bolivariana de Venezuela.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 12. Jurisdicción */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                12. Jurisdicción y ley aplicable
              </h2>
              <p className="mb-3">
                Estos Términos y Condiciones se rigen por las leyes vigentes en la{' '}
                <strong className="text-black">República Bolivariana de Venezuela</strong>. Cualquier
                disputa o controversia que surja del uso de este sitio o de una relación comercial
                con Savaya será sometida a los tribunales competentes de Venezuela.
              </p>
              <p>
                Antes de iniciar cualquier acción legal, el cliente se compromete a contactar a
                Savaya para intentar resolver el conflicto de manera amistosa.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 13. Contacto */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                13. Contacto
              </h2>
              <p>
                Para cualquier consulta sobre estos términos puedes escribirnos a{' '}
                <a href="mailto:Savayarrss@gmail.com" className="text-black font-medium hover:text-gold transition-colors underline">
                  Savayarrss@gmail.com
                </a>
                {' '}o al WhatsApp{' '}
                <a href="https://wa.me/584141100100" target="_blank" rel="noopener noreferrer" className="text-black font-medium hover:text-gold transition-colors underline">
                  +58 414-1100100
                </a>.
              </p>
            </div>

          </div>

          <p className="text-xs text-gray-text font-body text-center mt-12">
            Última actualización: Mayo 2026
          </p>
        </div>
      </section>
    </main>
  )
}
