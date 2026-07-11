import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contáctanos | Savaya',
  description:
    'Comunícate con Savaya vía WhatsApp, email o Instagram. Atención L-V 9am–6pm y S 9am–1pm (VET, UTC-4).',
}

export default function ContactoPage() {
  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <section className="bg-accent py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
            Estamos aquí para ayudarte
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Contáctanos
          </h1>
          <p className="mt-4 text-white/70 font-body text-base max-w-xl mx-auto">
            Nuestro canal principal es WhatsApp. Respondemos rápido durante el horario de atención.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Canal principal: WhatsApp */}
          <div className="border-2 border-gold rounded p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gold">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-heading font-bold text-black text-lg">WhatsApp</h2>
                  <span className="font-heading text-xs font-semibold bg-gold text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Canal principal
                  </span>
                </div>
                <p className="font-body text-sm text-gray-text mb-3 leading-relaxed">
                  La forma más rápida de comunicarte con nosotros para pedidos, consultas,
                  seguimiento y devoluciones. Respondemos durante el horario de atención.
                </p>
                <p className="font-heading font-bold text-black text-xl mb-4">
                  +58 414-1100100
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
                  Abrir WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Otros canales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Email */}
            <div className="border border-gray-light rounded p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-bg rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-black">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-black text-sm mb-1">Email</h3>
                  <p className="font-body text-xs text-gray-text mb-3 leading-relaxed">
                    Para consultas formales, facturas o privacidad. Respondemos en 24-48 horas hábiles.
                  </p>
                  <a
                    href="mailto:Savayarrss@gmail.com"
                    className="font-heading font-semibold text-sm text-black hover:text-gold transition-colors"
                  >
                    Savayarrss@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div className="border border-gray-light rounded p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-bg rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-black text-sm mb-1">Instagram</h3>
                  <p className="font-body text-xs text-gray-text mb-3 leading-relaxed">
                    Síguenos para ver novedades, outfits y promociones exclusivas.
                  </p>
                  <a
                    href="https://instagram.com/savayavzla"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-heading font-semibold text-sm text-black hover:text-gold transition-colors"
                  >
                    @savayavzla
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tienda física */}
          <div className="border border-gray-light rounded p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-bg rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-black text-sm mb-1">Tienda física</h3>
                <p className="font-body text-xs text-gray-text mb-1 leading-relaxed">
                  Calle 73, CC Multi Tienda God is Good
                </p>
                <p className="font-body text-xs text-gray-text leading-relaxed">
                  Planta baja, local A-4 · Valencia, Carabobo
                </p>
              </div>
            </div>
          </div>

          {/* Horario */}
          <div className="bg-gray-bg border border-gray-light rounded p-6">
            <h2 className="font-heading font-bold text-black text-base mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Horario de atención
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-gray-light pb-2">
                <span className="font-heading font-semibold text-sm text-black">Lunes a Viernes</span>
                <span className="font-body text-sm text-gray-text">9:00 am – 6:00 pm</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-light pb-2">
                <span className="font-heading font-semibold text-sm text-black">Sábado</span>
                <span className="font-body text-sm text-gray-text">9:00 am – 1:00 pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-heading font-semibold text-sm text-black">Domingo y feriados</span>
                <span className="font-body text-sm text-sale font-medium">Cerrado</span>
              </div>
            </div>
            <p className="font-body text-xs text-gray-text mt-4">
              Horario en hora venezolana (VET, UTC-4). Los mensajes recibidos fuera del horario
              serán respondidos el siguiente día hábil en orden de llegada.
            </p>
          </div>

          {/* Nota */}
          <div className="text-center pt-2">
            <p className="font-body text-sm text-gray-text leading-relaxed">
              Para consultas sobre privacidad de datos escríbenos a{' '}
              <a href="mailto:Savayarrss@gmail.com" className="text-black font-medium hover:text-gold transition-colors">
                Savayarrss@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
