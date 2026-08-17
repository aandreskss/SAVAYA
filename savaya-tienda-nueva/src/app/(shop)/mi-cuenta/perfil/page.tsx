import type { Metadata } from 'next'
import { auth } from '@/domains/auth/auth'
import { getCustomerByEmail } from '@/domains/customers/repository'
import { PerfilView } from '@/domains/customers/components/PerfilView'

export const metadata: Metadata = {
  title: 'Mi perfil | SAVAYA',
  robots: { index: false, follow: false },
}

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.email) return null

  const customer = process.env.DATABASE_URL
    ? await getCustomerByEmail(session.user.email)
    : null

  return (
    <PerfilView
      email={session.user.email}
      firstName={customer?.firstName ?? session.user.name?.split(' ')[0] ?? ''}
      lastName={customer?.lastName ?? session.user.name?.split(' ').slice(1).join(' ') ?? ''}
      phone={customer?.phone ?? ''}
      whatsapp={customer?.whatsapp ?? ''}
    />
  )
}
