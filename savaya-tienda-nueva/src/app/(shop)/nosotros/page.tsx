import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Nosotros — SAVAYA, calzado venezolano de Carabobo',
  description:
    'SAVAYA nació en Valencia, Carabobo, con una visión clara: calzado venezolano con identidad propia. Conoce la historia de la marca.',
  alternates: { canonical: `${BASE_URL}/nosotros` },
  openGraph: {
    title: 'Nosotros — SAVAYA',
    description: 'La historia detrás de SAVAYA, la marca de calzado venezolano nacida en Carabobo.',
    url: `${BASE_URL}/nosotros`,
  },
}

export default function NosotrosPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      {/* Hero text */}
      <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wide mb-6">
        Marca tu moda.
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed mb-12">
        SAVAYA es una marca venezolana de calzado nacida en Valencia, Carabobo — con la convicción
        de que el estilo no tiene fronteras geográficas.
      </p>

      {/* Story sections */}
      <section className="space-y-12">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide mb-4">El origen</h2>
          <p className="text-text-secondary leading-relaxed">
            Empezamos como muchas marcas venezolanas: desde el conocimiento del mercado local, del
            gusto de la mujer carabobeña y de la necesidad de ofrecer un producto con carácter
            propio. Nuestra primera colección estaba dirigida a la mujer que busca comodidad sin
            sacrificar estilo — zapatos que acompañan desde la mañana hasta la noche sin hacer
            concesiones.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide mb-4">La evolución</h2>
          <p className="text-text-secondary leading-relaxed">
            Con los años aprendimos que el estilo no tiene género. La misma mujer que nos pedía un
            calzado de alta calidad nos pedía algo igual para su pareja, su hermano, su hijo. Esa
            demanda nos llevó a ampliar la oferta: hoy SAVAYA viste a mujeres y hombres que
            comparten una misma filosofía — vestir bien es una forma de respetarse a uno mismo.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide mb-4">El canal propio</h2>
          <p className="text-text-secondary leading-relaxed">
            Durante años vendimos a través de aliados y redes sociales. Fue una etapa necesaria,
            pero siempre supimos que necesitábamos un espacio nuestro: donde la experiencia de
            compra esté a la altura de nuestro producto. Esta tienda es eso — el canal directo de
            SAVAYA, construido para que cada pedido llegue a tiempo, bien documentado y con el
            respaldo de una marca que pone su nombre en cada par.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide mb-4">Dónde estamos</h2>
          <address className="not-italic text-text-secondary leading-relaxed">
            <p className="font-medium text-text-primary">Tienda física SAVAYA</p>
            <p>CC Multi Tienda God is Good, local A-4</p>
            <p>Calle 73, Valencia, Carabobo, Venezuela</p>
            <p className="mt-3">
              <a
                href="https://wa.me/584141100100"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-gold underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                WhatsApp: +58 414-1100100
              </a>
            </p>
            <p>
              <a
                href="mailto:Savayarrss@gmail.com"
                className="text-accent-gold underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Savayarrss@gmail.com
              </a>
            </p>
          </address>
        </div>
      </section>
    </main>
  )
}
