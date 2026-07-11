import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PATHS = new Set([
  '/', '/mujer', '/hombre', '/ninos', '/zapatos', '/accesorios',
  '/nuevas-colecciones', '/descuentos', '/remates', '/marcas',
])

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.REVALIDATE_SECRET

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') ?? '/'

  const isAllowed =
    ALLOWED_PATHS.has(path) ||
    path.startsWith('/producto/') ||
    path.startsWith('/marcas/') ||
    path.startsWith('/coleccion/') ||
    path.startsWith('/dashboard/')

  if (!isAllowed) {
    return NextResponse.json({ error: 'Path no permitido.' }, { status: 400 })
  }

  revalidatePath(path)
  return NextResponse.json({ revalidated: true, path })
}
