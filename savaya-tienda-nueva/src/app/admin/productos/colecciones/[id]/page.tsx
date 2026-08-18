import { notFound } from 'next/navigation'
import {
  getAdminCollection,
  getAdminCollectionProducts,
} from '@/domains/admin/catalog/repository'
import { CollectionEditor } from '@/domains/admin/catalog/components/CollectionEditor'

export default async function EditarColeccionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [collection, collectionProducts] = await Promise.all([
    getAdminCollection(id),
    getAdminCollectionProducts(id),
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
          startsAt: collection.startsAt,
          endsAt: collection.endsAt,
        }}
        initialProducts={collectionProducts}
      />
    </div>
  )
}
