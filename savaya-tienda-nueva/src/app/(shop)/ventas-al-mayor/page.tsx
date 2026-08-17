import type { Metadata } from 'next'
import { WholesaleForm } from '@/domains/wholesale/components/WholesaleForm'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Ventas al mayor | SAVAYA',
  description:
    'Programa mayorista de SAVAYA para distribuidores y tiendas de calzado en Venezuela. Conoce los beneficios y regístrate.',
  alternates: { canonical: `${BASE_URL}/ventas-al-mayor` },
}

const BENEFITS = [
  {
    title: 'Precios competitivos',
    description:
      'Acceso a precios mayoristas diferenciados según volumen de compra mensual.',
  },
  {
    title: 'Catálogo completo',
    description:
      'Todas las referencias disponibles — dama y caballero — antes del lanzamiento al público.',
  },
  {
    title: 'Soporte comercial',
    description:
      'Asesor dedicado por WhatsApp para pedidos, seguimiento y atención postventa.',
  },
  {
    title: 'Material de ventas',
    description:
      'Fotos profesionales, fichas técnicas y contenido para redes sociales listo para usar.',
  },
  {
    title: 'Despacho directo',
    description:
      'Envíos a todo Venezuela por encomienda. También retiro en tienda en Valencia.',
  },
  {
    title: 'Condiciones flexibles',
    description:
      'Pedidos mínimos accesibles para tiendas nuevas. Escalamos juntos.',
  },
]

export default function VentasAlMayorPage() {
  return (
    <main className="max-w-screen-lg mx-auto px-4 py-14 md:py-20">
      {/* Hero */}
      <div className="max-w-2xl mb-14">
        <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wide mb-6">
          Vende SAVAYA en tu tienda
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed">
          Si tienes una tienda de calzado o moda y quieres sumar una marca venezolana con identidad
          propia, el programa mayorista de SAVAYA está diseñado para ti.
        </p>
      </div>

      {/* Beneficios */}
      <section className="mb-16">
        <h2 className="font-display text-2xl uppercase tracking-wide mb-8">
          ¿Por qué SAVAYA?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="border border-border rounded-xl p-6">
              <h3 className="font-medium mb-2">{b.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mb-16">
        <h2 className="font-display text-2xl uppercase tracking-wide mb-6">Cómo funciona</h2>
        <ol className="space-y-6">
          {[
            {
              n: '01',
              title: 'Completa el formulario',
              desc: 'Cuéntanos sobre tu negocio: dónde estás, qué vendes y cuánto mueves al mes.',
            },
            {
              n: '02',
              title: 'Te contactamos',
              desc: 'En menos de 24 horas un asesor SAVAYA te escribe por WhatsApp para darte todos los detalles y precios mayoristas.',
            },
            {
              n: '03',
              title: 'Primer pedido',
              desc: 'Si estás listo, hacemos tu primer pedido. Sin burocracia, sin contratos complicados.',
            },
            {
              n: '04',
              title: 'Creces con nosotros',
              desc: 'A mayor volumen, mejores condiciones. Nuestros distribuidores más grandes empezaron igual que tú.',
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-5">
              <span className="font-display text-3xl text-border leading-none shrink-0 w-10">
                {step.n}
              </span>
              <div>
                <p className="font-medium mb-1">{step.title}</p>
                <p className="text-sm text-text-secondary">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Formulario */}
      <section>
        <h2 className="font-display text-2xl uppercase tracking-wide mb-2">
          Regístrate como distribuidor
        </h2>
        <p className="text-text-secondary mb-8">
          Llena el formulario y nos pondremos en contacto en menos de 24 horas.
        </p>
        <div className="max-w-xl">
          <WholesaleForm />
        </div>
      </section>
    </main>
  )
}
