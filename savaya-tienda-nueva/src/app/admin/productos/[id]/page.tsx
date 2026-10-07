import { notFound } from 'next/navigation'
import {
  getAdminProductForEdit,
  getAllColors,
  getAllSizes,
  getAllCategoryOptions,
  getAllCollectionOptions,
} from '@/domains/admin/catalog/repository'
import { listGenders } from '@/domains/admin/cms/repository'
import { ProductEditor } from '@/domains/admin/catalog/components/ProductEditor'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [product, colors, sizes, categories, collections, genders] = await Promise.all([
    getAdminProductForEdit(id),
    getAllColors(),
    getAllSizes(),
    getAllCategoryOptions(),
    getAllCollectionOptions(),
    listGenders(),
  ])

  if (!product) notFound()

  return (
    <div className="p-6 md:p-8">
      <ProductEditor
        product={product}
        colors={colors}
        sizes={sizes}
        categories={categories}
        collections={collections}
        genders={genders}
      />
    </div>
  )
}
