'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAddress, setAddressDefault } from '../actions'
import { AddressFormModal } from './AddressFormModal'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui/toast-store'
import type { CustomerAddress } from '../types'

interface Props {
  addresses: CustomerAddress[]
}

export function DireccionesView({ addresses: initial }: Props) {
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function openNew() {
    setEditingAddress(undefined)
    setIsFormOpen(true)
  }

  function openEdit(address: CustomerAddress) {
    setEditingAddress(address)
    setIsFormOpen(true)
  }

  function handleSuccess() {
    setIsFormOpen(false)
    router.refresh()
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAddress(id)
      if (res.success) {
        toast.success('Dirección eliminada.')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const res = await setAddressDefault(id)
      if (res.success) {
        toast.success('Dirección principal actualizada.')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-base">
            {initial.length} {initial.length === 1 ? 'dirección' : 'direcciones'}
          </h2>
          <Button size="sm" onClick={openNew}>
            + Agregar dirección
          </Button>
        </div>

        {initial.length === 0 ? (
          <div className="border border-border rounded-lg p-10 text-center">
            <p className="text-text-secondary text-sm mb-4">
              Aún no tienes direcciones guardadas.
            </p>
            <Button size="sm" onClick={openNew}>
              Agregar dirección
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {initial.map((addr) => (
              <li
                key={addr.id}
                className="border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium capitalize">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-xs bg-accent-gold text-text-primary-inverse px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                  <address className="not-italic text-sm text-text-secondary space-y-0.5">
                    <p className="text-text-primary">{addr.recipientName}</p>
                    <p>{addr.address}</p>
                    {addr.municipality && <p>{addr.municipality}{addr.parish ? `, ${addr.parish}` : ''}</p>}
                    <p>
                      {[addr.city, addr.state].filter(Boolean).join(', ')}
                    </p>
                    {addr.reference && (
                      <p className="text-text-secondary italic">Ref: {addr.reference}</p>
                    )}
                  </address>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={isPending}
                      className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Hacer principal
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={isPending}
                    className="text-xs text-text-secondary hover:text-error transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddressFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
        address={editingAddress}
      />
    </>
  )
}
