import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/domains/auth/auth'
import { RegisterForm } from '@/domains/customers/components/RegisterForm'

export const metadata: Metadata = {
  title: 'Crear cuenta | SAVAYA',
  robots: { index: false, follow: false },
}

export default async function CrearCuentaPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/mi-cuenta')
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-2 text-center">
          Crear cuenta
        </h1>
        <p className="text-text-secondary text-sm text-center mb-8">
          ¿Ya tienes cuenta?{' '}
          <a href="/iniciar-sesion" className="text-accent-gold underline underline-offset-2">
            Iniciar sesión
          </a>
        </p>
        <RegisterForm />
      </div>
    </main>
  )
}
