import type { Metadata } from 'next'
import { getPopupConfig } from './actions'
import PopupForm from '@/components/dashboard/popup/PopupForm'

export const metadata: Metadata = { title: 'Popup promocional — Admin' }

export default async function PopupPage() {
  const config = await getPopupConfig()

  return (
    <div className="max-w-4xl">
      <PopupForm config={config} />
    </div>
  )
}
