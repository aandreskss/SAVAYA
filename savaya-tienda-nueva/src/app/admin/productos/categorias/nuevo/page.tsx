import { getAllCategoryOptions } from '@/domains/admin/catalog/repository'
import { listGenders } from '@/domains/admin/cms/repository'
import { CategoryEditor } from '@/domains/admin/catalog/components/CategoryEditor'

export default async function NuevaCategoriaPage() {
  const [categories, genders] = await Promise.all([
    getAllCategoryOptions(),
    listGenders(),
  ])

  return (
    <div className="p-6 md:p-8">
      <CategoryEditor parentOptions={categories} genderOptions={genders} />
    </div>
  )
}
