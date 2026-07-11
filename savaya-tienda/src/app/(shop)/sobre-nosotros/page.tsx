import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Savaya',
  description:
    'Conoce la historia de Savaya, marca venezolana de calzado femenino nacida en Valencia, Carabobo. Más de 4 años vistiendo los pasos de la mujer venezolana.',
}

const VALUES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: 'Hecho con amor',
    desc: 'Cada pieza la elegimos pensando en ti. Si no nos enamoraría a nosotros, no llega a la tienda.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: 'Diseñado para ti',
    desc: 'Cada modelo pensado para la mujer venezolana: cómodo, versátil y con el estilo que mereces.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: 'Calidad garantizada',
    desc: 'Trabajamos con proveedores seleccionados para que cada prenda llegue a tus manos en perfecto estado.',
  },
]

export default function SobreNosotrosPage() {
  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="bg-accent py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
            Nuestra historia
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Sobre Nosotros
          </h1>
          <p className="mt-4 text-white/70 font-body text-base max-w-xl mx-auto">
            Una marca nacida en Valencia, Carabobo, para la mujer venezolana.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-4">
            Cómo empezamos
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-black leading-snug mb-6">
            De Valencia al resto de Venezuela
          </h2>
          <div className="space-y-5 font-body text-gray-text leading-relaxed text-[15px]">
            <p>
              Savaya nació en Valencia, Carabobo, con una misión clara: crear calzado femenino que
              combine estilo, comodidad y precio accesible para la mujer venezolana. Más de cuatro
              años en el mercado nos respaldan.
            </p>
            <p>
              Empezamos con pocos modelos y mucha pasión. La respuesta fue inmediata — cada zapato
              encontró a alguien que lo esperaba. Eso nos confirmó que íbamos por el camino correcto
              y nos impulsó a crecer, ampliar el catálogo y llegar a más ciudades de Venezuela.
            </p>
            <p>
              Hoy tenemos presencia en más de 20 ciudades del país, con catálogo de casuales,
              deportivos y de vestir. Pero seguimos siendo los mismos: un equipo venezolano que
              elige cada modelo con cuidado, responde cada mensaje con atención y se emociona cada
              vez que una clienta nos dice{' '}
              <em className="text-black">"me encantó, lo volvería a comprar".</em>
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-gray-bg py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
              Lo que nos mueve
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-black">
              Nuestros valores
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded border border-gray-light p-7">
                <div className="w-11 h-11 rounded-full bg-accent/5 flex items-center justify-center text-accent mb-5">
                  {v.icon}
                </div>
                <h3 className="font-heading font-bold text-black text-base mb-2">{v.title}</h3>
                <p className="font-body text-gray-text text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl text-black mb-4">
            Gracias por elegirnos
          </h2>
          <p className="font-body text-gray-text text-[15px] leading-relaxed mb-8">
            Cada compra que haces nos ayuda a seguir creciendo y a traerte piezas aún mejores.
            Eso no lo olvidamos nunca.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/casuales"
              className="w-full sm:w-auto px-8 py-3 bg-black text-white font-heading font-semibold text-sm rounded hover:bg-accent transition-colors text-center"
            >
              Ver colección
            </Link>
            <Link
              href="/contacto"
              className="w-full sm:w-auto px-8 py-3 border border-black text-black font-heading font-semibold text-sm rounded hover:bg-gray-bg transition-colors text-center"
            >
              Contáctanos
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
