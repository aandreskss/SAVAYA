import { Suspense } from 'react'
import type { Metadata } from 'next'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

export default function RecuperarContrasenaPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
