'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/Button'
import { addCustomerNoteAction } from '../actions'
import { toast } from '@/shared/ui/toast-store'
import type { CustomerNote } from '../types'

type Props = {
  customerId: string
  onNoteAdded: (note: CustomerNote) => void
}

export function AddNoteForm({ customerId, onNoteAdded }: Props) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text) return

    startTransition(async () => {
      const result = await addCustomerNoteAction({ customerId, content: text })
      if (result.success) {
        onNoteAdded(result.data)
        setContent('')
        toast.success('Nota guardada')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="note-content" className="text-xs font-medium text-text-secondary uppercase tracking-wide block">
        Nueva nota
      </label>
      <textarea
        id="note-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Ej: Cliente preguntó por reposición de talla 38 en color negro…"
        className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-gold/20 bg-surface"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-secondary">{content.length}/1000</span>
        <Button
          type="submit"
          size="sm"
          variant="primary"
          isLoading={isPending}
          disabled={content.trim().length === 0}
        >
          Guardar nota
        </Button>
      </div>
    </form>
  )
}
