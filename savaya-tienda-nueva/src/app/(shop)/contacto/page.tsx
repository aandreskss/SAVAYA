import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Contacto | SAVAYA',
  description:
    'Comunícate con SAVAYA por WhatsApp, correo o visítanos en nuestra tienda en Valencia, Carabobo.',
  alternates: { canonical: `${BASE_URL}/contacto` },
}

export default function ContactoPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">Contacto</h1>
      <p className="text-text-secondary mb-12">
        Estamos aquí para ayudarte. Escríbenos por WhatsApp para respuesta inmediata.
      </p>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* WhatsApp */}
        <ContactCard
          title="WhatsApp"
          description="La forma más rápida. Te respondemos en minutos."
          action={
            <a
              href="https://wa.me/584141100100"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1ebe5d] transition-colors"
            >
              +58 414-1100100
            </a>
          }
        />

        {/* Instagram */}
        <ContactCard
          title="Instagram"
          description="Síguenos y escríbenos por DM."
          action={
            <a
              href="https://instagram.com/savayavzla"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border text-text-primary px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-2 hover:border-border-hover transition-colors"
            >
              @savayavzla
            </a>
          }
        />

        {/* Email */}
        <ContactCard
          title="Correo electrónico"
          description="Para consultas formales o sobre ventas al mayor."
          action={
            <a
              href="mailto:Savayarrss@gmail.com"
              className="text-accent-gold underline underline-offset-2 text-sm hover:opacity-70 transition-opacity"
            >
              Savayarrss@gmail.com
            </a>
          }
        />

        {/* Tienda */}
        <ContactCard
          title="Tienda física"
          description="Visítanos en Valencia, Carabobo."
          action={
            <address className="not-italic text-sm text-text-secondary">
              <p>CC Multi Tienda God is Good, local A-4</p>
              <p>Calle 73, Valencia, Carabobo</p>
            </address>
          }
        />
      </div>

      {/* Wholesale CTA */}
      <div className="mt-14 border border-border rounded-xl p-8 text-center">
        <p className="font-medium mb-2">¿Quieres vender SAVAYA en tu tienda?</p>
        <p className="text-text-secondary text-sm mb-4">
          Conoce nuestro programa de ventas al mayor.
        </p>
        <a
          href="/ventas-al-mayor"
          className="inline-block bg-accent-gold text-text-primary-inverse px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent-gold-hover transition-colors"
        >
          Ventas al mayor
        </a>
      </div>
    </main>
  )
}

function ContactCard({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="border border-border rounded-xl p-6">
      <h2 className="font-medium mb-1">{title}</h2>
      <p className="text-text-secondary text-sm mb-4">{description}</p>
      {action}
    </div>
  )
}
