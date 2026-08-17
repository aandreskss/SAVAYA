'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { logout } from '@/domains/auth/actions'
import { AdminSidebar, type NavItem } from '@/shared/ui/AdminSidebar'
import { AdminHeader } from '@/shared/ui/AdminHeader'

interface Props {
  navItems: NavItem[]
  userPermissions: string[]
  userName: string
  children: React.ReactNode
}

export function AdminShell({ navItems, userPermissions, userName, children }: Props) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleMobile = useCallback(() => setIsMobileOpen((prev) => !prev), [])
  const closeMobile = useCallback(() => setIsMobileOpen(false), [])

  async function handleLogout() {
    await logout()
    window.location.href = '/admin/login'
  }

  return (
    <div data-theme="dark" className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <AdminSidebar
        navItems={navItems}
        userPermissions={userPermissions}
        currentPath={pathname}
      />

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 bottom-0">
            <AdminSidebar
              navItems={navItems}
              userPermissions={userPermissions}
              currentPath={pathname}
              visible
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader
          userName={userName}
          onMenuToggle={toggleMobile}
          onLogout={handleLogout}
        />
        <main id="admin-main" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
