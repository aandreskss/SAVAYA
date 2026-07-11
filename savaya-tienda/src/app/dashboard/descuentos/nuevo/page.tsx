import type { Metadata } from 'next'
import DiscountForm from '@/components/dashboard/descuentos/DiscountForm'

export const metadata: Metadata = { title: 'Nuevo código de descuento — Admin' }

export default function NuevoDescuentoPage() {
  return (
    <div className="max-w-4xl">
      <DiscountForm />
    </div>
  )
}
