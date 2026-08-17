import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Cambios y devoluciones | SAVAYA',
  description:
    'Política de cambios y devoluciones de SAVAYA. Conoce los plazos, condiciones y el proceso para cambiar o devolver tu calzado.',
  alternates: { canonical: `${BASE_URL}/cambios-y-devoluciones` },
}

export default function CambiosYDevolucionesPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">
        Cambios y devoluciones
      </h1>
      <p className="text-text-secondary mb-10">
        Tu satisfacción es importante para nosotros. Si algo no quedó bien, aquí explicamos cómo
        proceder.
      </p>

      <div className="space-y-10">
        {/* Plazo */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-medium mb-3">Plazo para cambios y devoluciones</h2>
          <p className="text-sm text-text-secondary">
            Aceptamos cambios y devoluciones dentro de los{' '}
            <strong className="text-text-primary">7 días calendario</strong> siguientes a la fecha de
            recepción del producto. Pasado este plazo, no se podrán gestionar cambios ni
            devoluciones, salvo que el producto tenga falla de fabricación (ver garantía abajo).
          </p>
        </section>

        {/* Condiciones */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">
            Condiciones del producto
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Para que un cambio o devolución sea aceptado, el producto debe cumplir todas estas
            condiciones:
          </p>
          <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside">
            <li>Sin uso: no debe haber sido usado fuera del hogar.</li>
            <li>Sin daños: sin arañazos, manchas, roturas ni deformaciones.</li>
            <li>Empaque original: caja, envoltura y accesorios en perfectas condiciones.</li>
            <li>Etiquetas intactas: no deben haber sido retiradas.</li>
          </ul>
          <p className="text-sm text-text-secondary mt-4">
            No se aceptarán cambios ni devoluciones de productos que evidencien uso, daños por mal
            uso o falta de empaque original.
          </p>
        </section>

        {/* Proceso */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">
            Cómo iniciar un cambio o devolución
          </h2>
          <ol className="text-sm text-text-secondary space-y-4 list-decimal list-inside">
            <li>
              <strong className="text-text-primary">Contáctanos por WhatsApp</strong> al{' '}
              <a
                href="https://wa.me/584141100100"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                +58 414-1100100
              </a>{' '}
              indicando tu número de pedido y el motivo del cambio o devolución.
            </li>
            <li>
              <strong className="text-text-primary">Envía fotos del producto</strong> en su estado
              actual para validar que cumple las condiciones.
            </li>
            <li>
              <strong className="text-text-primary">Coordina el envío</strong>. El costo del envío
              de devolución corre por cuenta del cliente, salvo que el producto tenga falla de
              fabricación.
            </li>
            <li>
              <strong className="text-text-primary">Recepción y revisión</strong>. Una vez recibido
              el producto, lo revisamos en un plazo de 24–48 horas hábiles y te notificamos el
              resultado.
            </li>
            <li>
              <strong className="text-text-primary">Cambio o reembolso</strong>. Si el cambio
              procede, despachamos el nuevo producto o procesamos el reembolso según el método de
              pago original.
            </li>
          </ol>
        </section>

        {/* Garantía */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">
            Garantía por falla de fabricación
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Los productos SAVAYA tienen garantía de{' '}
            <strong className="text-text-primary">30 días</strong> contra fallas de fabricación desde
            la fecha de compra. Si tu producto presenta costuras sueltas, despegue de suela,
            defectos en el material u otra falla no generada por el uso o manejo:
          </p>
          <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside">
            <li>El cambio se realiza sin costo adicional.</li>
            <li>El costo de envío de retorno corre por nuestra cuenta.</li>
            <li>Si el modelo no está disponible, ofrecemos un cambio por otro de igual valor.</li>
          </ul>
          <p className="text-sm text-text-secondary mt-4">
            Escríbenos por WhatsApp con fotos claras del defecto para iniciar el proceso.
          </p>
        </section>

        {/* Exclusiones */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4">
            Exclusiones de la garantía
          </h2>
          <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside">
            <li>Desgaste normal por uso prolongado.</li>
            <li>Daños causados por mal uso, accidentes o exposición a condiciones extremas.</li>
            <li>Alteraciones o reparaciones realizadas por terceros.</li>
            <li>Productos adquiridos en descuento especial o liquidación (se especifica al momento de la venta).</li>
          </ul>
        </section>

        {/* CTA */}
        <p className="text-sm text-text-secondary">
          ¿Tienes dudas sobre tu caso específico?{' '}
          <a
            href="https://wa.me/584141100100"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Escríbenos por WhatsApp
          </a>{' '}
          y te orientamos.
        </p>
      </div>
    </main>
  )
}
