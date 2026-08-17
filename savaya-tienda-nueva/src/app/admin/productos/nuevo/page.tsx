import { getAllColors, getAllSizes, getAllCategoryOptions, getAllCollectionOptions } from '@/domains/admin/catalog/repository'
import { ProductEditor } from '@/domains/admin/catalog/components/ProductEditor'

export default async function NuevoProductoPage() {
  const [colors, sizes, categories, collections] = await Promise.all([
    getAllColors(),
    getAllSizes(),
    getAllCategoryOptions(),
    getAllCollectionOptions(),
  ])

  return (
    <div className="p-6 md:p-8">
      <ProductEditor
        colors={colors}
        sizes={sizes}
        categories={categories}
        collections={collections}
      />
    </div>
  )
}
