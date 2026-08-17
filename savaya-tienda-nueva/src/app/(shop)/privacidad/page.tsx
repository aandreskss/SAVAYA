import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Política de privacidad | SAVAYA',
  description:
    'Política de privacidad de SAVAYA. Conoce cómo recopilamos, usamos y protegemos tu información personal.',
  alternates: { canonical: `${BASE_URL}/privacidad` },
}

export default function PrivacidadPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">
        Política de privacidad
      </h1>
      <p className="text-text-secondary mb-2">Última actualización: agosto de 2026</p>
      <p className="text-text-secondary mb-10">
        SAVAYA (en adelante &ldquo;nosotros&rdquo; o &ldquo;la empresa&rdquo;) opera el sitio web{' '}
        <strong>savayavzla.com</strong>. Esta política explica qué información recopilamos, cómo la
        usamos y qué derechos tienes sobre ella.
      </p>

      <div className="space-y-10 text-sm text-text-secondary">
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            1. Información que recopilamos
          </h2>
          <p className="mb-3">Al usar nuestro sitio o realizar una compra, podemos recopilar:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong className="text-text-primary">Datos de identificación:</strong> nombre y
              apellido, número de cédula (cuando aplique para facturación).
            </li>
            <li>
              <strong className="text-text-primary">Datos de contacto:</strong> correo electrónico,
              número de teléfono o WhatsApp.
            </li>
            <li>
              <strong className="text-text-primary">Datos de dirección:</strong> estado, ciudad,
              municipio, parroquia, dirección de entrega y referencia.
            </li>
            <li>
              <strong className="text-text-primary">Datos de transacción:</strong> productos
              comprados, montos, métodos de pago, comprobantes de transferencia.
            </li>
            <li>
              <strong className="text-text-primary">Datos de navegación:</strong> dirección IP,
              tipo de dispositivo, páginas visitadas, tiempo en el sitio (mediante Vercel Analytics
              — sin cookies de seguimiento de terceros).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            2. Cómo usamos tu información
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Procesar y gestionar tus pedidos y pagos.</li>
            <li>Comunicarte el estado de tu pedido y número de guía de envío.</li>
            <li>Gestionar tu cuenta de cliente y tu historial de compras.</li>
            <li>Atender solicitudes de cambios, devoluciones y soporte.</li>
            <li>Enviarte comunicaciones sobre tus pedidos activos.</li>
            <li>Mejorar la experiencia del sitio y corregir errores.</li>
            <li>
              Cumplir obligaciones legales y fiscales aplicables en Venezuela.
            </li>
          </ul>
          <p className="mt-3">
            No utilizamos tu información para publicidad de terceros ni la vendemos bajo ninguna
            circunstancia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            3. Compartir información con terceros
          </h2>
          <p className="mb-3">
            Compartimos información únicamente con terceros necesarios para ejecutar el servicio:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong className="text-text-primary">Agencias de encomiendas</strong> (MRW, Zoom,
              TealCA u otras): nombre y dirección de entrega para procesar el despacho.
            </li>
            <li>
              <strong className="text-text-primary">Plataformas de infraestructura:</strong> Vercel
              (hosting), Supabase (base de datos), Cloudinary (almacenamiento de imágenes). Todos
              bajo contratos que garantizan el tratamiento seguro de los datos.
            </li>
          </ul>
          <p className="mt-3">
            No compartimos datos con plataformas publicitarias, redes sociales ni brokers de datos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            4. Comprobantes de pago
          </h2>
          <p>
            Los comprobantes de transferencia que subes durante el checkout se almacenan de forma
            privada en Cloudinary con acceso restringido. No son accesibles públicamente y solo el
            equipo de SAVAYA puede visualizarlos para validar el pago. Se conservan durante el
            período mínimo requerido por las obligaciones fiscales venezolanas.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            5. Cookies y almacenamiento local
          </h2>
          <p className="mb-3">
            Utilizamos cookies estrictamente necesarias para el funcionamiento del sitio:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Cookie de sesión (Auth.js, HttpOnly, Secure): identifica tu sesión de usuario.</li>
            <li>Cookie de carrito: mantiene tu carrito entre visitas.</li>
          </ul>
          <p className="mt-3">
            No usamos cookies de publicidad, seguimiento entre sitios ni plataformas de analítica
            basadas en cookies de terceros.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            6. Seguridad de los datos
          </h2>
          <p>
            Implementamos medidas técnicas para proteger tu información: conexiones HTTPS, cifrado
            de contraseñas (bcrypt), cookies HttpOnly y Secure, y acceso restringido a los datos
            de producción. Ningún sistema es 100% seguro, pero tomamos todas las precauciones
            razonables para proteger tu información.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            7. Tus derechos
          </h2>
          <p className="mb-3">Tienes derecho a:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Acceder a los datos personales que tenemos sobre ti.</li>
            <li>Solicitar la corrección de datos incorrectos o desactualizados.</li>
            <li>Solicitar la eliminación de tu cuenta y datos (sujeto a obligaciones legales).</li>
            <li>Retirar tu consentimiento para comunicaciones opcionales.</li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos, escríbenos a{' '}
            <a
              href="mailto:Savayarrss@gmail.com"
              className="underline underline-offset-2 text-accent-gold"
            >
              Savayarrss@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            8. Cambios a esta política
          </h2>
          <p>
            Podemos actualizar esta política periódicamente. Cuando lo hagamos, actualizaremos la
            fecha en la parte superior de esta página. Te recomendamos revisarla ocasionalmente
            para mantenerte informado.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase tracking-wide mb-4 text-text-primary">
            9. Contacto
          </h2>
          <p>
            Para cualquier consulta sobre esta política o el tratamiento de tus datos, contáctanos:{' '}
            <a
              href="mailto:Savayarrss@gmail.com"
              className="underline underline-offset-2 text-accent-gold"
            >
              Savayarrss@gmail.com
            </a>{' '}
            o por{' '}
            <a
              href="https://wa.me/584141100100"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-accent-gold"
            >
              WhatsApp
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
