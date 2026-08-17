import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Términos y condiciones | SAVAYA',
  description:
    'Términos y condiciones de uso del sitio web y tienda en línea de SAVAYA.',
  alternates: { canonical: `${BASE_URL}/terminos` },
}

export default function TerminosPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">
        Términos y condiciones
      </h1>
      <p className="text-text-secondary mb-2">Última actualización: agosto de 2026</p>
      <p className="text-text-secondary mb-10">
        Al acceder o usar savayavzla.com, aceptas los presentes Términos y Condiciones. Si no estás
        de acuerdo con alguno de ellos, te pedimos que no uses el sitio.
      </p>

      <div className="space-y-10 text-sm text-text-secondary">
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            1. Uso del sitio
          </h2>
          <p className="mb-3">
            Este sitio es operado por SAVAYA, marca venezolana de calzado con sede en Valencia,
            Carabobo, Venezuela. Su uso está permitido para personas mayores de 18 años o menores
            con supervisión de un adulto responsable.
          </p>
          <p>
            Queda prohibido usar el sitio para actividades ilegales, fraudulentas o que puedan
            dañar a SAVAYA o a terceros.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            2. Cuenta de usuario
          </h2>
          <p className="mb-3">
            Al crear una cuenta, eres responsable de mantener la confidencialidad de tu contraseña
            y de todas las actividades realizadas desde tu cuenta. Notifícanos de inmediato si
            sospechas un acceso no autorizado a tu cuenta.
          </p>
          <p>
            Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos,
            incurran en fraude o sean inactivas por un período prolongado.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            3. Productos y precios
          </h2>
          <ul className="space-y-2 list-disc list-inside mb-3">
            <li>
              Los precios se muestran en dólares (USD) y se convierten a bolívares usando la tasa
              BCV vigente al momento de la compra.
            </li>
            <li>
              Nos reservamos el derecho de modificar precios en cualquier momento sin previo aviso.
              El precio aplicable es el vigente al momento de confirmar el pedido.
            </li>
            <li>
              Las imágenes de los productos son referenciales. Los colores exactos pueden variar
              según el monitor o dispositivo.
            </li>
            <li>
              La disponibilidad de inventario se verifica en tiempo real. Si un producto se agota
              después de que lo añadas al carrito, te notificaremos antes de confirmar el pedido.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            4. Pedidos y pagos
          </h2>
          <p className="mb-3">
            Un pedido se confirma únicamente cuando el pago ha sido verificado por nuestro equipo.
            Nos reservamos el derecho de cancelar pedidos en los siguientes casos:
          </p>
          <ul className="space-y-2 list-disc list-inside mb-3">
            <li>Comprobante de pago no válido o fraudulento.</li>
            <li>Error en el precio causado por falla técnica.</li>
            <li>Incumplimiento de estas condiciones.</li>
            <li>Pedidos que no han recibido el pago dentro del plazo de reserva.</li>
          </ul>
          <p>
            En caso de cancelación por nuestra parte, procesamos el reembolso íntegro del monto
            pagado por el mismo método.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            5. Envíos y entrega
          </h2>
          <p>
            Los tiempos de entrega son estimados y pueden variar por factores externos (disponibilidad
            de la agencia, condiciones de la ruta, feriados, etc.). SAVAYA no se hace responsable
            por retrasos causados por terceros, pero gestionamos activamente cada incidencia.
            Consulta nuestra{' '}
            <a href="/envios" className="underline underline-offset-2 text-accent-gold">
              política de envíos
            </a>{' '}
            para más detalles.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            6. Cambios y devoluciones
          </h2>
          <p>
            Los cambios y devoluciones se rigen por nuestra{' '}
            <a href="/cambios-y-devoluciones" className="underline underline-offset-2 text-accent-gold">
              política de cambios y devoluciones
            </a>
            , que forma parte integral de estos términos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            7. Propiedad intelectual
          </h2>
          <p>
            Todo el contenido de este sitio — incluyendo textos, imágenes, logotipos, diseños y
            código — es propiedad de SAVAYA o está licenciado por terceros. No se permite su
            reproducción, distribución ni uso comercial sin autorización escrita.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            8. Limitación de responsabilidad
          </h2>
          <p>
            SAVAYA no será responsable por daños indirectos, incidentales o consecuentes derivados
            del uso del sitio o de sus productos, más allá del monto pagado en la transacción que
            generó el reclamo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            9. Privacidad
          </h2>
          <p>
            El tratamiento de tus datos personales se rige por nuestra{' '}
            <a href="/privacidad" className="underline underline-offset-2 text-accent-gold">
              política de privacidad
            </a>
            , que forma parte integral de estos términos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            10. Modificaciones
          </h2>
          <p>
            Podemos actualizar estos términos en cualquier momento. Los cambios entran en vigor
            desde su publicación en esta página. El uso continuado del sitio implica la aceptación
            de los términos vigentes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            11. Contacto
          </h2>
          <p>
            Para consultas sobre estos términos, escríbenos a{' '}
            <a
              href="mailto:Savayarrss@gmail.com"
              className="underline underline-offset-2 text-accent-gold"
            >
              Savayarrss@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
