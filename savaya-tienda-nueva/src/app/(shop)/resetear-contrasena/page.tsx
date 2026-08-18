import type { Metadata } from 'next'
import { ResetearContrasenaForm } from '@/domains/auth/components/ResetearContrasenaForm'

export const metadata: Metadata = {
  title: 'Nueva contraseña — SAVAYA',
}

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function ResetearContrasenaPage({ searchParams }: Props) {
  const { token, email } = await searchParams

  if (!token || !email) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Enlace inválido</h1>
          <p className="text-sm text-text-secondary mb-6">
            Este enlace de recuperación no es válido. Solicita uno nuevo.
          </p>
          <a
            href="/recuperar-contrasena"
            className="text-sm underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Solicitar nuevo enlace
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Crear nueva contraseña</h1>
          <p className="text-sm text-text-secondary">
            Elige una contraseña segura de al menos 8 caracteres.
          </p>
        </div>
        <ResetearContrasenaForm token={token} email={email} />
      </div>
    </main>
  )
}
