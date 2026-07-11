import type { Metadata } from 'next'
import BrandForm from '@/components/dashboard/marcas/BrandForm'

export const metadata: Metadata = { title: 'Nueva marca — Admin' }

export default function NuevaMarcaPage() {
  return (
    <div>
      <BrandForm />
    </div>
  )
}
