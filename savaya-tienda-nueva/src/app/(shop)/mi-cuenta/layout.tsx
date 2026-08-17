import { redirect } from 'next/navigation'
import { auth } from '@/domains/auth/auth'
import { getCustomerByEmail } from '@/domains/customers/repository'
import { AccountShell } from '@/domains/customers/components/AccountShell'

export default async function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/iniciar-sesion?redirect=/mi-cuenta')
  }

  const customer = process.env.DATABASE_URL
    ? await getCustomerByEmail(session.user.email)
    : null

  const displayName =
    customer
      ? `${customer.firstName} ${customer.lastName}`
      : session.user.name ?? session.user.email

  return (
    <AccountShell displayName={displayName} email={session.user.email}>
      {children}
    </AccountShell>
  )
}
