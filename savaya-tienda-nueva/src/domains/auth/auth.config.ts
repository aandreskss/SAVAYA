// ---------------------------------------------------------------------------
// Auth.js base config — NO database imports.
// Safe to import in Edge runtime (middleware.ts).
// ---------------------------------------------------------------------------

import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdminRoute = nextUrl.pathname.startsWith('/admin')
      const isAccountRoute = nextUrl.pathname.startsWith('/mi-cuenta')

      if (isAdminRoute) {
        if (isLoggedIn) return true
        return false // redirect to pages.signIn = '/admin/login'
      }

      if (isAccountRoute) {
        if (isLoggedIn) return true
        const loginUrl = new URL('/iniciar-sesion', nextUrl.origin)
        loginUrl.searchParams.set('redirect', nextUrl.pathname)
        return Response.redirect(loginUrl)
      }

      return true // public routes always allowed
    },
  },
  providers: [], // added in auth.ts
}
