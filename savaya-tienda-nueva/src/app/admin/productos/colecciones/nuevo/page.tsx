import { getAllColors, getAllSizes } from '@/domains/admin/catalog/repository'
import { CollectionEditor } from '@/domains/admin/catalog/components/CollectionEditor'

export default async function NuevaColeccionPage() {
  const [colors, sizes] = await Promise.all([getAllColors(), getAllSizes()])

  return (
    <div className="p-6 md:p-8">
      <CollectionEditor colors={colors} sizes={sizes} />
    </div>
  )
}
