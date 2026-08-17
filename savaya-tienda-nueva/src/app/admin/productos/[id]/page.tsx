import { notFound } from 'next/navigation'
import {
  getAdminProductForEdit,
  getAllColors,
  getAllSizes,
  getAllCategoryOptions,
  getAllCollectionOptions,
} from '@/domains/admin/catalog/repository'
import { ProductEditor } from '@/domains/admin/catalog/components/ProductEditor'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [product, colors, sizes, categories, collections] = await Promise.all([
    getAdminProductForEdit(id),
    getAllColors(),
    getAllSizes(),
    getAllCategoryOptions(),
    getAllCollectionOptions(),
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
      />
    </div>
  )
}
