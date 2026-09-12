'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ProductWithImageItem } from '@/domains/admin/dashboard/types'

// Cloudinary URLs: load a tiny thumbnail instead of the full image to save bandwidth.
// Replaces /upload/ with /upload/c_scale,w_4/ — still returns 404 if the asset is deleted.
function toProbeUrl(url: string): string {
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/c_scale,w_4/')
  }
  return url
}

type CheckStatus = 'checking' | 'done'

export function BrokenImagesBlock({ products }: { products: ProductWithImageItem[] }) {
  const [broken, setBroken] = useState<ProductWithImageItem[]>([])
  const [status, setStatus] = useState<CheckStatus>('checking')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (products.length === 0) {
      setStatus('done')
      return
    }

    let resolved = 0
    const brokenList: ProductWithImageItem[] = []

    products.forEach((product) => {
      const img = new Image()
      const finish = () => {
        resolved++
        if (resolved === products.length) {
          // Sort broken list alphabetically
          brokenList.sort((a, b) => a.name.localeCompare(b.name))
          setBroken([...brokenList])
          setStatus('done')
        }
      }
      img.onload = finish
      img.onerror = () => {
        brokenList.push(product)
        finish()
      }
      img.src = toProbeUrl(product.imageUrl)
    })
  }, [products])

  return (
    <div
      className="bg-surface border border-border rounded-xl p-5"
      style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 720ms both' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Imágenes rotas</h2>
          {status === 'checking' && (
            <span className="text-xs text-text-secondary animate-pulse">Verificando…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'done' && broken.length > 0 && (
            <span className="relative inline-flex">
              <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-40 animate-ping" />
              <span className="relative inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-error text-white text-xs rounded-full font-medium">
                {broken.length > 9 ? '9+' : broken.length}
              </span>
            </span>
          )}
          {status === 'done' && broken.length > 0 && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {collapsed ? 'Mostrar' : 'Ocultar'}
            </button>
          )}
        </div>
      </div>

      {status === 'checking' ? (
        <div className="py-6 flex items-center justify-center gap-2.5 text-sm text-text-secondary">
          <span className="inline-block w-4 h-4 border-2 border-border border-t-accent-gold rounded-full animate-spin" />
          Revisando {products.length} imágene{products.length !== 1 ? 's' : ''}…
        </div>
      ) : broken.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          ✓ Todas las imágenes cargan correctamente.
        </p>
      ) : collapsed ? (
        <p className="text-sm text-text-secondary py-2 text-center">
          {broken.length} imagen{broken.length !== 1 ? 'es' : ''} con problema{broken.length !== 1 ? 's' : ''} — haz clic en &quot;Mostrar&quot; para ver.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border/50 max-h-72 overflow-y-auto">
            {broken.map((product) => (
              <li key={product.id} className="py-2.5">
                <Link
                  href={`/admin/productos/${product.id}`}
                  className="flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:underline truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 truncate font-mono">
                      {product.imageUrl}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-error font-medium bg-error/10 px-2 py-0.5 rounded-full">
                    Rota
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border">
            Haz clic en un producto para ir al editor y actualizar la imagen.
          </p>
        </>
      )}
    </div>
  )
}
