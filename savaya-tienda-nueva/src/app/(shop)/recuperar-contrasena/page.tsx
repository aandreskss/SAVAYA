import type { Metadata } from 'next'
import { RecuperarContrasenaForm } from '@/domains/auth/components/RecuperarContrasenaForm'

export const metadata: Metadata = {
  title: 'Recuperar contraseña — SAVAYA',
}

export default function RecuperarContrasenaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-sm text-text-secondary">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>
        <RecuperarContrasenaForm />
        <p className="text-center text-sm text-text-secondary mt-6">
          <a href="/iniciar-sesion" className="underline underline-offset-2 hover:text-text-primary transition-colors">
            Volver al inicio de sesión
          </a>
        </p>
      </div>
    </main>
  )
}
