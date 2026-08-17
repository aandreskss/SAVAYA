import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/domains/auth/auth'
import { LoginForm } from '@/domains/customers/components/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión | SAVAYA',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ redirect?: string }>
}

export default async function IniciarSesionPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user) {
    const { redirect: redirectTo } = await searchParams
    redirect(redirectTo ?? '/mi-cuenta')
  }

  const { redirect: redirectTo } = await searchParams

  return (
    <main className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-2 text-center">
          Iniciar sesión
        </h1>
        <p className="text-text-secondary text-sm text-center mb-8">
          ¿No tienes cuenta?{' '}
          <a href="/crear-cuenta" className="text-accent-gold underline underline-offset-2">
            Crear cuenta
          </a>
        </p>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  )
}
