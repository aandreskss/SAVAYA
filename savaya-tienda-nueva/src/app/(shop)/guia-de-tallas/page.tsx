import type { Metadata } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

export const metadata: Metadata = {
  title: 'Guía de tallas | SAVAYA',
  description:
    'Encuentra tu talla de calzado SAVAYA con nuestra guía. Mide tu pie y compara con nuestras tablas para dama y caballero.',
  alternates: { canonical: `${BASE_URL}/guia-de-tallas` },
}

const WOMEN_SIZES = [
  { ve: '35', cm: '22.5', us: '5', eu: '35' },
  { ve: '36', cm: '23.0', us: '5.5', eu: '36' },
  { ve: '37', cm: '23.5', us: '6', eu: '37' },
  { ve: '38', cm: '24.0', us: '7', eu: '38' },
  { ve: '39', cm: '24.5', us: '8', eu: '39' },
  { ve: '40', cm: '25.0', us: '9', eu: '40' },
  { ve: '41', cm: '25.5', us: '10', eu: '41' },
]

const MEN_SIZES = [
  { ve: '39', cm: '25.0', us: '6.5', eu: '39' },
  { ve: '40', cm: '25.5', us: '7', eu: '40' },
  { ve: '41', cm: '26.0', us: '8', eu: '41' },
  { ve: '42', cm: '26.5', us: '9', eu: '42' },
  { ve: '43', cm: '27.0', us: '10', eu: '43' },
  { ve: '44', cm: '27.5', us: '11', eu: '44' },
  { ve: '45', cm: '28.0', us: '12', eu: '45' },
]

export default function GuiaDeTallasPage() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-14 md:py-20">
      <h1 className="font-display text-4xl uppercase tracking-wide mb-4">Guía de tallas</h1>
      <p className="text-text-secondary mb-10">
        Para encontrar tu talla correcta, mide la longitud de tu pie descalzo desde el talón
        hasta el dedo más largo (en centímetros) y busca el número que corresponde en la tabla.
      </p>

      {/* How to measure */}
      <section className="bg-surface border border-border rounded-xl p-6 mb-10">
        <h2 className="font-medium mb-3">Cómo medir tu pie</h2>
        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
          <li>Coloca una hoja de papel en el suelo contra una pared.</li>
          <li>Párate sobre la hoja con el talón tocando la pared.</li>
          <li>Marca con un lápiz la punta del dedo más largo.</li>
          <li>Mide la distancia desde la pared hasta la marca en centímetros.</li>
          <li>Si tienes media talla, elige la talla superior para mayor comodidad.</li>
        </ol>
      </section>

      {/* Women */}
      <section className="mb-10">
        <h2 className="font-display text-xl uppercase tracking-wide mb-4">Dama</h2>
        <SizeTable sizes={WOMEN_SIZES} />
      </section>

      {/* Men */}
      <section className="mb-10">
        <h2 className="font-display text-xl uppercase tracking-wide mb-4">Caballero</h2>
        <SizeTable sizes={MEN_SIZES} />
      </section>

      <p className="text-sm text-text-secondary">
        ¿Tienes dudas sobre tu talla?{' '}
        <a
          href="https://wa.me/584141100100"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Escríbenos por WhatsApp
        </a>{' '}
        y con gusto te asesoramos.
      </p>
    </main>
  )
}

function SizeTable({
  sizes,
}: {
  sizes: { ve: string; cm: string; us: string; eu: string }[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 font-medium">VE</th>
            <th className="text-left py-2 pr-4 font-medium">cm</th>
            <th className="text-left py-2 pr-4 font-medium">US</th>
            <th className="text-left py-2 font-medium">EU</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((s) => (
            <tr key={s.ve} className="border-b border-border/50 hover:bg-surface transition-colors">
              <td className="py-2.5 pr-4 font-medium">{s.ve}</td>
              <td className="py-2.5 pr-4 text-text-secondary">{s.cm}</td>
              <td className="py-2.5 pr-4 text-text-secondary">{s.us}</td>
              <td className="py-2.5 text-text-secondary">{s.eu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
