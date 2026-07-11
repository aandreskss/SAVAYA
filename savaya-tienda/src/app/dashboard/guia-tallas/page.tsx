import { createAdminClient } from '@/lib/supabase/server'
import SizeGuideEditor from '@/components/dashboard/guia-tallas/SizeGuideEditor'
import type { GuideType, GuideData } from '@/components/dashboard/guia-tallas/actions'

export const dynamic = 'force-dynamic'

const EMPTY: GuideData = { headers: [], rows: [] }

const SQL = `-- Ejecutar una sola vez en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS size_guides (
  type        text    PRIMARY KEY,           -- 'clothing' | 'shoes' | 'accessories'
  headers     jsonb   NOT NULL DEFAULT '[]',
  rows        jsonb   NOT NULL DEFAULT '[]',
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON size_guides FOR SELECT USING (true);

INSERT INTO size_guides (type, headers, rows) VALUES
  ('clothing',
   '["Talla","Busto (cm)","Cintura (cm)","Cadera (cm)"]',
   '[["XS","80-84","60-64","86-90"],["S","84-88","64-68","90-94"],["M","88-92","68-72","94-98"],["L","92-98","72-78","98-104"],["XL","98-104","78-84","104-110"]]'),
  ('shoes',
   '["Talla EU","Talla US","CM"]',
   '[["34","4","21.5"],["35","5","22"],["36","6","22.9"],["37","6.5","23.5"],["38","7","24.1"],["39","8","24.8"],["40","9","25.4"],["41","10","26"],["42","11","26.7"],["43","12","27.3"]]'),
  ('accessories',
   '["Talla","Descripción"]',
   '[["Única","Ajustable para todos los tamaños"]]')
ON CONFLICT (type) DO NOTHING;`

export default async function GuiaTallasPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('size_guides').select('type, headers, rows')

  const initial: Record<GuideType, GuideData> = {
    clothing: { ...EMPTY },
    shoes: { ...EMPTY },
    accessories: { ...EMPTY },
  }

  for (const row of data ?? []) {
    const t = row.type as GuideType
    if (t in initial) {
      initial[t] = {
        headers: (row.headers as string[]) ?? [],
        rows: (row.rows as string[][]) ?? [],
      }
    }
  }

  const isEmpty = Object.values(initial).every((g) => g.headers.length === 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-black">Guía de tallas</h1>
        <p className="text-gray-text text-sm mt-1">
          Configura las tablas de medidas que aparecen en cada tipo de producto
        </p>
      </div>

      {isEmpty ? (
        <div className="max-w-3xl space-y-4">
          <div className="p-4 border border-dashed border-gray-light rounded-lg text-center text-sm text-gray-text">
            La tabla <code className="bg-gray-bg px-1 rounded">size_guides</code> no existe todavía. Ejecuta el SQL de abajo y recarga.
          </div>
          <div className="bg-white border border-gray-light rounded-lg p-5">
            <p className="text-xs font-heading font-semibold text-black mb-2">SQL — ejecutar en Supabase</p>
            <pre className="text-xs text-gray-text overflow-x-auto whitespace-pre-wrap bg-gray-bg rounded p-3">{SQL}</pre>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white border border-gray-light rounded-lg p-5">
            <SizeGuideEditor initial={initial} />
          </div>
          <details className="bg-white border border-gray-light rounded-lg p-5">
            <summary className="text-xs font-heading font-semibold text-black cursor-pointer select-none">
              Ver SQL de creación de tabla
            </summary>
            <pre className="text-xs text-gray-text overflow-x-auto whitespace-pre-wrap bg-gray-bg rounded p-3 mt-3">{SQL}</pre>
          </details>
        </div>
      )}
    </div>
  )
}
