import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CATEGORY_KEYS: Record<string, string> = {
  '/mujer': 'mujer',
  '/hombre': 'hombre',
  '/ninos': 'ninos',
  '/zapatos': 'zapatos',
  '/accesorios': 'accesorios',
  '/nuevas-colecciones': 'nuevas-colecciones',
  '/descuentos': 'descuentos',
  '/remates': 'remates',
}

export async function updateSession(request: NextRequest) {
  // Skip when running without Supabase (local mock mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove, required for SSR auth to work
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtectedRoute = pathname.startsWith('/cuenta') || pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/dashboard')

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (role === 'admin' || role === 'sub_admin') {
      // Full dashboard access — no redirect needed
    } else if (role === 'editor') {
      if (pathname !== '/dashboard' && !pathname.startsWith('/dashboard/productos')) {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
      }
    } else if (role === 'gestor_pedidos') {
      if (pathname !== '/dashboard' && !pathname.startsWith('/dashboard/pedidos')) {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
      }
    } else {
      return NextResponse.redirect(new URL('/acceso-denegado', request.nextUrl))
    }
  }

  // Category visibility redirect
  const categoryKey = CATEGORY_KEYS[pathname]
  if (categoryKey) {
    try {
      const { data } = await supabase
        .from('category_visibility')
        .select('is_visible')
        .eq('key', categoryKey)
        .single()

      if (data && !data.is_visible) {
        return NextResponse.redirect(new URL('/', request.nextUrl))
      }
    } catch {
      // Table doesn't exist yet — fail open
    }
  }

  return supabaseResponse
}
