import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Savaya',
  description:
    'Conoce cómo Savaya recopila, usa y protege tus datos personales en Venezuela.',
}

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <section className="bg-accent py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-heading text-xs tracking-[0.2em] uppercase text-gold mb-3">
            Legal
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Política de Privacidad
          </h1>
          <p className="mt-4 text-white/70 font-body text-base max-w-xl mx-auto">
            Tus datos están seguros con nosotros. Conoce qué información recopilamos y cómo la usamos.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="bg-gray-bg border border-gray-light rounded p-4 mb-10">
            <p className="font-body text-xs text-gray-text leading-relaxed">
              <strong className="text-black">Última actualización:</strong> Mayo 2026. Esta Política de
              Privacidad describe cómo Savaya recopila, usa y protege la información personal que
              nos proporcionas al usar nuestro sitio web y servicios. Cumplimos con los principios de
              la Ley Orgánica de Protección de Datos Personales (LOPDP) de la República Bolivariana
              de Venezuela.
            </p>
          </div>

          <div className="space-y-10 font-body text-sm text-gray-text leading-relaxed">

            {/* 1. Quiénes somos */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                1. Responsable del tratamiento de datos
              </h2>
              <p>
                El responsable del tratamiento de tus datos personales es{' '}
                <strong className="text-black">Savaya Venezuela</strong>, tienda de moda en línea
                con operaciones en la República Bolivariana de Venezuela. Para cualquier asunto
                relacionado con tus datos personales puedes contactarnos en{' '}
                <a href="mailto:Savayarrss@gmail.com" className="text-black font-medium hover:text-gold transition-colors underline">
                  Savayarrss@gmail.com
                </a>.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 2. Qué datos recopilamos */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                2. Datos que recopilamos
              </h2>
              <p className="mb-4">
                Recopilamos únicamente los datos necesarios para prestarte nuestros servicios:
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: 'Datos de identificación',
                    items: ['Nombre completo', 'Número de cédula de identidad (cuando aplique para facturación)', 'Dirección de correo electrónico', 'Número de teléfono / WhatsApp'],
                  },
                  {
                    title: 'Datos de envío',
                    items: ['Dirección de entrega (calle, edificio, urbanización, municipio, estado)', 'Nombre del destinatario si es diferente al comprador'],
                  },
                  {
                    title: 'Datos de uso del sitio',
                    items: ['Dirección IP', 'Tipo de dispositivo y navegador', 'Páginas visitadas y tiempo de navegación (datos anónimos via Google Analytics 4)'],
                  },
                  {
                    title: 'Comunicaciones',
                    items: ['Mensajes enviados vía WhatsApp o email para gestión de pedidos', 'Comprobantes de pago que nos envías para verificar transacciones'],
                  },
                ].map((group) => (
                  <div key={group.title} className="border border-gray-light rounded p-4">
                    <p className="font-heading font-semibold text-black text-sm mb-2">{group.title}</p>
                    <ul className="space-y-1">
                      {group.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gold font-bold flex-shrink-0 mt-0.5">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-light" />

            {/* 3. Cómo usamos los datos */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                3. Cómo usamos tu información
              </h2>
              <p className="mb-4">
                Utilizamos tu información personal exclusivamente para los siguientes fines:
              </p>
              <ul className="space-y-3">
                {[
                  {
                    title: 'Procesar y gestionar tus pedidos',
                    desc: 'Necesitamos tus datos de contacto y dirección para preparar y despachar tu pedido correctamente.',
                  },
                  {
                    title: 'Comunicar el estado del pedido',
                    desc: 'Te notificamos vía WhatsApp y email cuando tu pedido es confirmado, despachado y entregado.',
                  },
                  {
                    title: 'Verificar pagos',
                    desc: 'Usamos los comprobantes que nos envías para confirmar las transacciones y activar el pedido.',
                  },
                  {
                    title: 'Atención al cliente',
                    desc: 'Respondemos consultas sobre pedidos, cambios, devoluciones y cualquier otra duda.',
                  },
                  {
                    title: 'Mejorar nuestra tienda',
                    desc: 'Analizamos datos de navegación anónimos y agregados para optimizar la experiencia de compra.',
                  },
                  {
                    title: 'Enviar comunicaciones de marketing (solo con consentimiento)',
                    desc: 'Si te suscribes a nuestro newsletter, te enviamos novedades y ofertas. Puedes darte de baja en cualquier momento.',
                  },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-gold font-heading font-bold text-xs flex-shrink-0 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-heading font-semibold text-black">{item.title}</p>
                      <p className="mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <hr className="border-gray-light" />

            {/* 4. Con quién compartimos */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                4. Con quién compartimos tu información
              </h2>
              <p className="mb-4">
                No vendemos, alquilamos ni cedemos tus datos personales a terceros con fines
                comerciales. Solo compartimos información cuando es estrictamente necesario:
              </p>
              <div className="space-y-3">
                {[
                  {
                    who: 'Empresas de paquetería (Zoom, Tealca, MRW)',
                    why: 'Compartimos tu nombre, teléfono y dirección de entrega para que puedan gestionar y entregar tu pedido. Estas empresas actúan como nuestros encargados de tratamiento.',
                  },
                  {
                    who: 'Google (Analytics 4)',
                    why: 'Compartimos datos de navegación anónimos para analizar el tráfico y comportamiento en el sitio. Google Analytics no recibe datos de identificación personal.',
                  },
                  {
                    who: 'Resend (servicio de email)',
                    why: 'Utilizamos Resend para enviar emails transaccionales (confirmación de pedido, notificación de envío). Solo recibe tu dirección de email y nombre.',
                  },
                  {
                    who: 'Autoridades competentes',
                    why: 'En caso de requerimiento legal por parte de autoridades venezolanas competentes, podemos divulgar la información necesaria conforme a la ley.',
                  },
                ].map((item) => (
                  <div key={item.who} className="border border-gray-light rounded p-4">
                    <p className="font-heading font-semibold text-black text-sm mb-1">{item.who}</p>
                    <p>{item.why}</p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-light" />

            {/* 5. Almacenamiento y seguridad */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                5. Almacenamiento y seguridad
              </h2>
              <p className="mb-3">
                Tus datos se almacenan en servidores seguros a través de{' '}
                <strong className="text-black">Supabase</strong> (base de datos con cifrado en
                reposo y en tránsito) y <strong className="text-black">Vercel</strong> (plataforma
                de alojamiento con HTTPS obligatorio).
              </p>
              <p className="mb-3">
                Aplicamos medidas técnicas y organizativas para proteger tu información contra
                acceso no autorizado, pérdida o divulgación. El acceso a los datos de clientes
                está restringido al personal de Savaya que los necesita para prestar el servicio.
              </p>
              <p>
                Sin embargo, ningún sistema es 100% infalible. Si detectamos una brecha de seguridad
                que afecte tus datos, te lo notificaremos en el menor tiempo posible conforme a la
                normativa venezolana aplicable.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 6. Cookies */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                6. Cookies y tecnologías de rastreo
              </h2>
              <p className="mb-3">
                Savaya utiliza cookies estrictamente necesarias para el funcionamiento del
                sitio (sesión de usuario, carrito de compras) y cookies analíticas de Google
                Analytics 4 para entender cómo se usa nuestra tienda.
              </p>
              <p>
                Puedes controlar el uso de cookies desde la configuración de tu navegador. Desactivar
                las cookies necesarias puede afectar el funcionamiento del carrito y del área de cuenta.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 7. Conservación */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                7. Tiempo de conservación de datos
              </h2>
              <p>
                Conservamos tus datos personales durante el tiempo necesario para cumplir con los
                fines descritos en esta política y para cumplir obligaciones legales. Los datos de
                pedidos se conservan por un mínimo de 3 años por razones contables y fiscales. Los
                datos de cuentas inactivas pueden ser eliminados tras 2 años de inactividad, previa
                notificación al email registrado.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 8. Derechos del usuario */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                8. Tus derechos sobre tus datos
              </h2>
              <p className="mb-4">
                De acuerdo con la legislación venezolana, tienes los siguientes derechos respecto
                a tus datos personales:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { right: 'Acceso', desc: 'Solicitar una copia de los datos que tenemos sobre ti.' },
                  { right: 'Rectificación', desc: 'Corregir datos incorrectos o desactualizados.' },
                  { right: 'Eliminación', desc: 'Solicitar la eliminación de tus datos personales.' },
                  { right: 'Portabilidad', desc: 'Recibir tus datos en un formato estructurado y legible.' },
                  { right: 'Oposición', desc: 'Oponerte al tratamiento de tus datos para fines de marketing.' },
                  { right: 'Limitación', desc: 'Solicitar que limitemos el tratamiento de tus datos en ciertos casos.' },
                ].map((item) => (
                  <div key={item.right} className="border border-gray-light rounded p-3 bg-gray-bg">
                    <p className="font-heading font-semibold text-black text-xs mb-0.5">
                      {item.right}
                    </p>
                    <p className="text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4">
                Para ejercer cualquiera de estos derechos, escríbenos a{' '}
                <a href="mailto:Savayarrss@gmail.com" className="text-black font-medium hover:text-gold transition-colors underline">
                  Savayarrss@gmail.com
                </a>{' '}
                con el asunto "Solicitud de privacidad" e indicando el derecho que deseas ejercer.
                Responderemos en un plazo máximo de <strong className="text-black">10 días hábiles</strong>.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 9. Menores */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                9. Menores de edad
              </h2>
              <p>
                Savaya no dirige sus servicios a menores de 18 años. No recopilamos
                deliberadamente información personal de menores. Si tienes conocimiento de que
                un menor nos ha proporcionado datos personales sin consentimiento de su tutor,
                contáctanos para eliminar dicha información.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* 10. Cambios */}
            <div>
              <h2 className="font-heading font-bold text-lg text-black mb-3">
                10. Cambios en esta política
              </h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Los cambios se
                publicarán en esta página con la fecha de actualización. Si los cambios son
                significativos, te notificaremos vía email o mediante un aviso destacado en el sitio.
                El uso continuado de savayavzla.com después de la publicación de los cambios implica
                la aceptación de los mismos.
              </p>
            </div>

            <hr className="border-gray-light" />

            {/* Contacto privacidad */}
            <div className="bg-gray-bg border border-gray-light rounded p-6 text-center">
              <p className="font-heading font-semibold text-black mb-1">
                ¿Preguntas sobre tu privacidad?
              </p>
              <p className="text-sm mb-4">
                Nuestro equipo de privacidad está disponible para ayudarte.
              </p>
              <a
                href="mailto:Savayarrss@gmail.com"
                className="inline-flex items-center gap-2 bg-accent text-white font-heading font-semibold text-sm px-6 py-3 rounded hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Savayarrss@gmail.com
              </a>
            </div>

          </div>

          <p className="text-xs text-gray-text font-body text-center mt-10">
            Última actualización: Mayo 2026
          </p>
        </div>
      </section>
    </main>
  )
}
