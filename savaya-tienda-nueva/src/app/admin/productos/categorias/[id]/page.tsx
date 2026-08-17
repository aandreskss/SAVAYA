import { notFound } from 'next/navigation'
import { getAdminCategory, getAllCategoryOptions } from '@/domains/admin/catalog/repository'
import { CategoryEditor } from '@/domains/admin/catalog/components/CategoryEditor'

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [category, categories] = await Promise.all([
    getAdminCategory(id),
    getAllCategoryOptions(),
  ])

  if (!category) notFound()

  return (
    <div className="p-6 md:p-8">
      <CategoryEditor
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          parentId: category.parentId,
          imageUrl: category.imageUrl,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
        }}
        parentOptions={categories}
      />
    </div>
  )
}
