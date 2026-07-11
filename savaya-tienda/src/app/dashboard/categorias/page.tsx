import { createAdminClient } from '@/lib/supabase/server'
import CategoriasForm from '@/components/dashboard/categorias/CategoriasForm'
import CategoryImagesManager from '@/components/dashboard/categorias/CategoryImagesManager'
import RepairButton from '@/components/dashboard/categorias/RepairButton'
import CustomSectionsEditor from '@/components/dashboard/categorias/CustomSectionsEditor'
import type { CustomSectionData } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const supabase = createAdminClient()

  const [
    { data: visibility },
    { data: topCatsData, error: topCatsError },
    { data: sectionsData },
  ] = await Promise.all([
    supabase.from('category_visibility').select('key, is_visible').order('key'),
    supabase
      .from('categories')
      .select('id, name, slug, image_url, order')
      .is('parent_id', null)
      .not('product_type', 'is', null)
      .order('order', { ascending: true }),
    supabase
      .from('custom_sections')
      .select('id, slot, title, is_active')
      .order('slot', { ascending: true }),
  ])

  // Fetch cards for all sections
  const sectionIds = (sectionsData ?? []).map((s) => s.id as string)
  const { data: cardsData } = sectionIds.length > 0
    ? await supabase
        .from('custom_section_cards')
        .select('id, section_id, label, image_url, href, display_order')
        .in('section_id', sectionIds)
        .order('display_order', { ascending: true })
    : { data: [] }

  type RawCard = { id: string; section_id: string; label: string; image_url: string | null; href: string; display_order: number }
  const cards = (cardsData ?? []) as RawCard[]

  const customSections: CustomSectionData[] = (sectionsData ?? []).map((s) => ({
    id: s.id as string,
    slot: s.slot as number,
    title: (s.title as string | null),
    is_active: s.is_active as boolean,
    cards: cards.filter((c) => c.section_id === s.id),
  }))

  type TopCategory = { id: string; name: string; slug: string; image_url: string | null; order: number }
  const topCats: TopCategory[] = topCatsError ? [] : ((topCatsData ?? []) as unknown as TopCategory[])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-black">Categorías</h1>
        <p className="text-gray-text text-sm mt-1">
          Gestiona las imágenes, visibilidad y secciones personalizadas de la homepage
        </p>
      </div>

      <div className="space-y-10 max-w-4xl">
        {/* Top-level category images */}
        <div className="bg-white border border-gray-light rounded-lg p-5">
          <h2 className="text-sm font-heading font-semibold text-black mb-1">
            Imágenes de categorías principales
          </h2>
          <p className="text-xs text-gray-text font-body mb-5">
            Estas imágenes aparecen en la sección &ldquo;Compra por categoría&rdquo; de la homepage.
          </p>
          <CategoryImagesManager categories={topCats} />
        </div>

        {/* Visibility toggles */}
        <CategoriasForm categories={visibility ?? []} topCategories={topCats} />

        {/* Custom sections */}
        <div>
          <div className="mb-4">
            <h2 className="font-heading font-semibold text-base text-black">Categorías cambiantes</h2>
            <p className="text-xs text-gray-text mt-0.5">
              Tres secciones de cards personalizadas en la homepage. Cada card puede tener nombre, imagen y enlace a una colección o categoría. Ideal para subcategorías especiales: &ldquo;Para Runners&rdquo;, &ldquo;Para Mamás&rdquo;, &ldquo;Looks de Negocios&rdquo;, etc.
            </p>
          </div>
          {customSections.length === 0 ? (
            <div className="p-4 border border-dashed border-gray-light rounded-lg text-center text-sm text-gray-text">
              Ejecuta el SQL inicial para crear las tablas <code className="bg-gray-bg px-1 rounded">custom_sections</code> y <code className="bg-gray-bg px-1 rounded">custom_section_cards</code>.
            </div>
          ) : (
            <CustomSectionsEditor sections={customSections} />
          )}
        </div>

        {/* Hierarchy repair tool */}
        <div className="bg-white border border-gray-light rounded-lg p-5">
          <h2 className="text-sm font-heading font-semibold text-black mb-1">Reparar jerarquía</h2>
          <p className="text-xs text-gray-text font-body mb-4">
            Si ves subcategorías (ej: &ldquo;Zapato Deportivo&rdquo;) apareciendo en la sección
            &ldquo;Compra por categoría&rdquo; de la homepage, usa este botón para corregirlas
            automáticamente.
          </p>
          <RepairButton />
        </div>
      </div>
    </div>
  )
}
