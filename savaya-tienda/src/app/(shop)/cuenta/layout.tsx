import type { ReactNode } from 'react'
import AccountNav from '@/components/cuenta/AccountNav'

export default function CuentaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 items-start">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
