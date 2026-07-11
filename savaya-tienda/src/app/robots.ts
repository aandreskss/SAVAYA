import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/checkout/',
          '/carrito/',
          '/cuenta/',
          '/pedido/',
          '/rastrear/',
          '/api/',
          '/acceso-denegado/',
          '/auth/',
          '/login',
          '/registro',
          '/recuperar-contrasena',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
