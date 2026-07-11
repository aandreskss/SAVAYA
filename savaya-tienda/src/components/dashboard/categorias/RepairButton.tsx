'use client'

import { useState, useTransition } from 'react'
import { repairCategoryHierarchy } from './actions'

export default function RepairButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ created: number; fixed: number; error?: string } | null>(null)

  function handleRepair() {
    setResult(null)
    startTransition(async () => {
      const res = await repairCategoryHierarchy()
      setResult(res)
    })
  }

  const parts: string[] = []
  if (result && !result.error) {
    if (result.created > 0) parts.push(`${result.created} categoría${result.created !== 1 ? 's' : ''} principal${result.created !== 1 ? 'es' : ''} creada${result.created !== 1 ? 's' : ''}`)
    if (result.fixed > 0) parts.push(`${result.fixed} subcategoría${result.fixed !== 1 ? 's' : ''} corregida${result.fixed !== 1 ? 's' : ''}`)
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleRepair}
        disabled={isPending}
        className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-4 py-2 rounded hover:bg-accent transition-colors disabled:opacity-50"
      >
        {isPending && (
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {isPending ? 'Configurando…' : 'Crear y reparar categorías'}
      </button>

      {result && (
        <p className={`text-xs font-body ${result.error ? 'text-sale' : 'text-green-700'}`}>
          {result.error
            ? `Error: ${result.error}`
            : parts.length > 0
              ? `✓ ${parts.join(' y ')}. Recarga la página para ver los cambios.`
              : 'Todo en orden, no hubo nada que configurar.'}
        </p>
      )}
    </div>
  )
}
