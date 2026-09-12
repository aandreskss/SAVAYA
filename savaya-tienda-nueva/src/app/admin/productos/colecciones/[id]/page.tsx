import { notFound } from 'next/navigation'
import {
  getAdminCollection,
  getAdminCollectionProducts,
  getAllColors,
  getAllSizes,
  getAllCategoryOptions,
} from '@/domains/admin/catalog/repository'
import { CollectionEditor } from '@/domains/admin/catalog/components/CollectionEditor'
import type { CollectionFilterRules } from '@/domains/admin/catalog/validators'

export default async function EditarColeccionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [collection, collectionProducts, colors, sizes, categories] = await Promise.all([
    getAdminCollection(id),
    getAdminCollectionProducts(id),
    getAllColors(),
    getAllSizes(),
    getAllCategoryOptions(),
  ])

  if (!collection) notFound()

  return (
    <div className="p-6 md:p-8">
      <CollectionEditor
        collection={{
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          imageUrl: collection.imageUrl,
          isActive: collection.isActive,
          isFeatured: collection.isFeatured,
          filterRules: collection.filterRules as CollectionFilterRules,
          startsAt: collection.startsAt,
          endsAt: collection.endsAt,
        }}
        initialProducts={collectionProducts}
        colors={colors}
        sizes={sizes}
        categories={categories}
      />
    </div>
  )
}
