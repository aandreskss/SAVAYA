import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import DeleteCollectionButton from '@/components/dashboard/colecciones/DeleteCollectionButton'
import ToggleHomeButton from '@/components/dashboard/colecciones/ToggleHomeButton'

export const dynamic = 'force-dynamic'

const SQL = `-- Run once in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  show_on_home boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_collections" ON collections FOR SELECT USING (true);
CREATE POLICY "service_role_all_collections" ON collections USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS collection_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  custom_tag text,
  tag_style text NOT NULL DEFAULT 'sale',
  display_order int NOT NULL DEFAULT 0,
  UNIQUE(collection_id, product_id)
);
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_collection_products" ON collection_products FOR SELECT USING (true);
CREATE POLICY "service_role_all_collection_products" ON collection_products USING (true) WITH CHECK (true);`

export default async function ColeccionesPage() {
  const supabase = createAdminClient()
  let collections: Array<{
    id: string; name: string; slug: string
    is_active: boolean; show_on_home: boolean; nav_gender: string | null
  }> = []

  try {
    const { data } = await supabase
      .from('collections')
      .select('id, name, slug, is_active, show_on_home, nav_gender')
      .order('created_at', { ascending: false })
    collections = (data ?? []) as typeof collections
  } catch {
    // table may not exist yet
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-black">Colecciones</h1>
          <p className="text-gray-text text-sm mt-1">
            Colecciones curadas con tags promocionales para la homepage y páginas especiales
          </p>
        </div>
        <Link
          href="/dashboard/colecciones/nueva"
          className="bg-black text-white font-heading font-semibold text-sm px-4 py-2 rounded hover:bg-accent transition-colors shrink-0"
        >
          + Nueva colección
        </Link>
      </div>

      {/* SQL setup instructions */}
      <details className="mb-6 bg-amber-50 border border-amber-200 rounded-lg">
        <summary className="px-4 py-3 text-sm font-heading font-semibold text-amber-800 cursor-pointer select-none">
          ⚙ Primera vez: ejecutar SQL en Supabase
        </summary>
        <div className="px-4 pb-4">
          <p className="text-xs text-amber-700 font-body mb-2">
            Copia y pega este SQL en el <strong>SQL Editor</strong> de Supabase (solo se ejecuta una vez):
          </p>
          <pre className="text-[11px] bg-amber-100 text-amber-900 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">
            {SQL}
          </pre>
        </div>
      </details>

      {/* Collections list */}
      {collections.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-light rounded-lg">
          <p className="text-gray-text font-body text-sm mb-3">No hay colecciones todavía</p>
          <Link href="/dashboard/colecciones/nueva" className="text-sm font-heading font-semibold text-accent hover:underline">
            Crear primera colección →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((col) => (
            <div key={col.id} className="bg-white border border-gray-light rounded-lg px-4 py-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${col.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />

              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm truncate">{col.name}</p>
                <p className="text-xs text-gray-text font-body">/coleccion/{col.slug}</p>
              </div>

              {col.show_on_home && (
                <span className="px-2 py-0.5 bg-gold/20 text-gold text-[10px] font-heading font-bold rounded uppercase shrink-0">
                  En homepage
                </span>
              )}
              {col.nav_gender && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-heading font-bold rounded uppercase shrink-0">
                  Navbar · {col.nav_gender === 'women' ? 'Mujer' : col.nav_gender === 'men' ? 'Hombre' : col.nav_gender === 'kids' ? 'Niños' : 'Unisex'}
                </span>
              )}

              <div className="flex items-center gap-3 shrink-0">
                <ToggleHomeButton id={col.id} showOnHome={col.show_on_home} />
                <Link
                  href={`/dashboard/colecciones/${col.id}`}
                  className="text-xs font-heading font-semibold text-accent hover:underline"
                >
                  Editar
                </Link>
                <DeleteCollectionButton id={col.id} name={col.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
