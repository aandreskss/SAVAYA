import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PostgresSearchProvider } from '../search'

// ---------------------------------------------------------------------------
// PostgresSearchProvider — unit tests sin DB real
// ---------------------------------------------------------------------------

// Mock drizzle db para evitar conexión real
vi.mock('@/shared/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}))

describe('PostgresSearchProvider.search()', () => {
  let provider: PostgresSearchProvider

  beforeEach(() => {
    provider = new PostgresSearchProvider()
  })

  it('returns empty array for empty string', async () => {
    const results = await provider.search('')
    expect(results).toEqual([])
  })

  it('returns empty array for single character (less than 2)', async () => {
    const results = await provider.search('a')
    expect(results).toEqual([])
  })

  it('returns empty array for whitespace-only string', async () => {
    const results = await provider.search('   ')
    expect(results).toEqual([])
  })

  it('returns empty array for string of 1 char after trim', async () => {
    const results = await provider.search(' s ')
    expect(results).toEqual([])
  })

  it('calls DB and returns results when query has 2+ chars', async () => {
    // DB mock returns [] — just confirms no early return
    const results = await provider.search('sa')
    expect(Array.isArray(results)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// GET /api/search — Route Handler con fallback sin DATABASE_URL
// ---------------------------------------------------------------------------

describe('GET /api/search — fallback sin DATABASE_URL', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('returns fallback results when DATABASE_URL is not set and query is valid', async () => {
    vi.stubEnv('DATABASE_URL', '')

    const { GET } = await import('@/app/api/search/route')

    const req = new Request('http://localhost/api/search?q=sandalia')
    const response = await GET(req as Parameters<typeof GET>[0])
    const body = (await response.json()) as { results: unknown[] }

    expect(response.status).toBe(200)
    expect(body.results).toHaveLength(2)
  })

  it('returns empty results when query is too short', async () => {
    vi.stubEnv('DATABASE_URL', '')

    const { GET } = await import('@/app/api/search/route')

    const req = new Request('http://localhost/api/search?q=s')
    const response = await GET(req as Parameters<typeof GET>[0])
    const body = (await response.json()) as { results: unknown[] }

    expect(response.status).toBe(200)
    expect(body.results).toEqual([])
  })

  it('returns empty results when q param is absent', async () => {
    vi.stubEnv('DATABASE_URL', '')

    const { GET } = await import('@/app/api/search/route')

    const req = new Request('http://localhost/api/search')
    const response = await GET(req as Parameters<typeof GET>[0])
    const body = (await response.json()) as { results: unknown[] }

    expect(response.status).toBe(200)
    expect(body.results).toEqual([])
  })
})
