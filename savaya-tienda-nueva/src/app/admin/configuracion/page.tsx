import { Suspense } from 'react'
import { auth } from '@/domains/auth/auth'
import { listSettings } from '@/domains/admin/settings/repository'
import { SettingsManager } from '@/domains/admin/settings/components/SettingsManager'

async function ConfiguracionContent() {
  const [settings, session] = await Promise.all([listSettings(), auth()])
  const permissions = (session?.user?.permissions ?? []) as string[]
  const canEdit = permissions.includes('settings:write')
  return <SettingsManager initialSettings={settings} canEdit={canEdit} />
}

export default function ConfiguracionAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-text-secondary text-sm">
            Cargando configuración…
          </div>
        }
      >
        <ConfiguracionContent />
      </Suspense>
    </div>
  )
}
