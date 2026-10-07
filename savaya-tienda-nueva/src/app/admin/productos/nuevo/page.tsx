import { getAllColors, getAllSizes, getAllCategoryOptions, getAllCollectionOptions } from '@/domains/admin/catalog/repository'
import { listGenders } from '@/domains/admin/cms/repository'
import { ProductEditor } from '@/domains/admin/catalog/components/ProductEditor'

export default async function NuevoProductoPage() {
  const [colors, sizes, categories, collections, genders] = await Promise.all([
    getAllColors(),
    getAllSizes(),
    getAllCategoryOptions(),
    getAllCollectionOptions(),
    listGenders(),
  ])

  return (
    <div className="p-6 md:p-8">
      <ProductEditor
        colors={colors}
        sizes={sizes}
        categories={categories}
        collections={collections}
        genders={genders}
      />
    </div>
  )
}
