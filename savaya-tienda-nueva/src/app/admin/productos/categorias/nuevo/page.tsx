import { getAllCategoryOptions } from '@/domains/admin/catalog/repository'
import { CategoryEditor } from '@/domains/admin/catalog/components/CategoryEditor'

export default async function NuevaCategoriaPage() {
  const categories = await getAllCategoryOptions()

  return (
    <div className="p-6 md:p-8">
      <CategoryEditor parentOptions={categories} />
    </div>
  )
}
