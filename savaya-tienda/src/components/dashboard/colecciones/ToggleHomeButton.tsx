'use client'

import { useTransition } from 'react'
import { toggleHomeCollection } from '@/app/dashboard/colecciones/actions'

export default function ToggleHomeButton({ id, showOnHome }: { id: string; showOnHome: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleHomeCollection(id, !showOnHome)
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={showOnHome ? 'Quitar de homepage' : 'Mostrar en homepage'}
      className={`text-xs font-heading font-semibold transition-colors disabled:opacity-50 ${
        showOnHome
          ? 'text-gold hover:text-gold/70'
          : 'text-gray-text hover:text-black'
      }`}
    >
      {isPending ? '…' : showOnHome ? '★ Homepage' : '☆ Homepage'}
    </button>
  )
}
