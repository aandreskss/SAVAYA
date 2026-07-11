import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// Folders accessible without admin auth (e.g. guest payment proof upload)
const PUBLIC_FOLDERS = new Set(['savaya/comprobantes'])

// All allowed upload destinations — blocks path traversal / arbitrary folder writes
const ALLOWED_FOLDERS = new Set([
  'savaya/productos',
  'savaya/comprobantes',
  'savaya/pagos',
  'savaya/hero',
  'savaya/envios',
  'savaya/banners',
  'savaya/popup',
  'savaya/custom-sections',
])

// Verify real image format via magic bytes (not spoofable via Content-Type)
async function hasValidImageBytes(file: File): Promise<boolean> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  // GIF87a / GIF89a: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true
  // AVIF/HEIC: ftyp box — bytes 4-7 are "ftyp"
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return true
  return false
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary no configurado' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') ?? 'savaya/productos'

  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: 'Destino no permitido.' }, { status: 400 })
  }

  // Admin-only folders require authentication
  if (!PUBLIC_FOLDERS.has(folder)) {
    // Stricter rate limit for admin uploads (still generous for batch product uploads)
    if (!rateLimit(`upload-admin:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Demasiadas subidas. Intenta en un momento.' }, { status: 429 })
    }
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin' && profile?.role !== 'sub_admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    } catch {
      return NextResponse.json({ error: 'Error de autenticación.' }, { status: 401 })
    }
  } else {
    // Public folder (comprobantes): tighter limit — prevents proof-upload spam
    if (!rateLimit(`upload-public:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Demasiadas subidas. Intenta en un momento.' }, { status: 429 })
    }
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }

  // Validate declared MIME type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Solo se aceptan imágenes' }, { status: 400 })
  }

  // Validate file size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 5MB' }, { status: 400 })
  }

  // Validate real file format via magic bytes — prevents MIME type spoofing
  if (!(await hasValidImageBytes(file))) {
    return NextResponse.json({ error: 'El archivo no es una imagen válida.' }, { status: 400 })
  }

  const timestamp = Math.floor(Date.now() / 1000)

  // Cloudinary signed upload — params sorted alphabetically
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = createHash('sha1').update(paramsToSign + apiSecret).digest('hex')

  const uploadForm = new FormData()
  uploadForm.append('file', file)
  uploadForm.append('api_key', apiKey)
  uploadForm.append('timestamp', String(timestamp))
  uploadForm.append('signature', signature)
  uploadForm.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: uploadForm }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { error?: { message?: string } }).error?.message ?? 'Error al subir imagen' },
      { status: 500 }
    )
  }

  const result = await response.json() as { secure_url: string }
  return NextResponse.json({ url: result.secure_url })
}
