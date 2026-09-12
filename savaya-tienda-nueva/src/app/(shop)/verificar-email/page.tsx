import { createHash } from 'crypto'
import { db } from '@/shared/lib/db'
import { users, verificationTokens } from '@/domains/auth/schema'
import { and, eq, gt } from 'drizzle-orm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verificar correo — SAVAYA',
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function VerificarEmailPage({ searchParams }: Props) {
  const { token, email } = await searchParams

  if (!token || !email) {
    return <Result ok={false} message="El enlace de verificación es inválido." />
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const identifier = `email-verification:${email}`

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, tokenHash),
        gt(verificationTokens.expires, new Date()),
      ),
    )
    .limit(1)

  if (!record) {
    return <Result ok={false} message="El enlace de verificación es inválido o ya expiró." />
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email))

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier))

  return <Result ok={true} message="¡Tu correo ha sido verificado correctamente!" />
}

function Result({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className={`text-5xl ${ok ? 'text-success' : 'text-error'}`}>
          {ok ? '✓' : '✕'}
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-tight">
          {ok ? 'Correo verificado' : 'Enlace inválido'}
        </h1>
        <p className="text-text-secondary">{message}</p>
        <Link href={ok ? '/mi-cuenta' : '/crear-cuenta'} className="btn-primary inline-flex mt-2">
          {ok ? 'Ir a mi cuenta' : 'Crear cuenta'}
        </Link>
      </div>
    </div>
  )
}
