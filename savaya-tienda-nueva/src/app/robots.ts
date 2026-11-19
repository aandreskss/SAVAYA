import type { MetadataRoute } from 'next'
import { SITE_URL as BASE_URL } from '@/shared/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/mi-cuenta/',
          '/checkout/',
          '/dev/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
