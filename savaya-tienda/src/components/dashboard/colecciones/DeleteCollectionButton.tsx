'use client'

import { useState, useTransition } from 'react'
import { deleteCollection } from '@/app/dashboard/colecciones/actions'

export default function DeleteCollectionButton({ id, name }: { id: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteCollection(id)
      setConfirm(false)
    })
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs font-heading font-semibold text-sale/70 hover:text-sale transition-colors"
      >
        Eliminar
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-text font-body">¿Eliminar &ldquo;{name}&rdquo;?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs font-heading font-semibold text-sale hover:underline disabled:opacity-50"
      >
        {isPending ? '…' : 'Sí'}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="text-xs font-heading font-semibold text-gray-text hover:text-black"
      >
        No
      </button>
    </div>
  )
}
