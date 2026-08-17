import { describe, it, expect } from 'vitest'
import { parsePLPSearchParams, shouldNoindex } from '../search-params'

// ---------------------------------------------------------------------------
// parsePLPSearchParams
// ---------------------------------------------------------------------------

describe('parsePLPSearchParams()', () => {
  it('returns defaults when called with empty object', () => {
    const result = parsePLPSearchParams({})
    expect(result.orden).toBe('destacados')
    expect(result.pagina).toBe(1)
    expect(result.color).toBeUndefined()
    expect(result.talla).toBeUndefined()
    expect(result.precio_min).toBeUndefined()
    expect(result.precio_max).toBeUndefined()
    expect(result.disponible).toBeUndefined()
    expect(result.nuevo).toBeUndefined()
    expect(result.oferta).toBeUndefined()
  })

  it('returns default orden when given invalid orden value', () => {
    const result = parsePLPSearchParams({ orden: 'invalido' })
    expect(result.orden).toBe('destacados')
  })

  it('returns default pagina=1 when given non-numeric pagina', () => {
    const result = parsePLPSearchParams({ pagina: 'abc' })
    expect(result.pagina).toBe(1)
  })

  it('returns pagina=1 when pagina is zero', () => {
    const result = parsePLPSearchParams({ pagina: '0' })
    expect(result.pagina).toBe(1)
  })

  it('correctly parses valid params', () => {
    const result = parsePLPSearchParams({
      orden: 'precio-asc',
      pagina: '3',
      color: 'id1,id2',
      talla: 'id3',
      nuevo: 'true',
    })
    expect(result.orden).toBe('precio-asc')
    expect(result.pagina).toBe(3)
    expect(result.color).toBe('id1,id2')
    expect(result.talla).toBe('id3')
    expect(result.nuevo).toBe('true')
  })

  it('flattens array values to first element', () => {
    const result = parsePLPSearchParams({ color: ['id1', 'id2'] })
    expect(result.color).toBe('id1')
  })

  it('returns default on completely invalid input', () => {
    // precio_min as invalid string forces fallback
    const result = parsePLPSearchParams({ precio_min: 'not-a-number' })
    expect(result.pagina).toBe(1)
    expect(result.orden).toBe('destacados')
  })
})

// ---------------------------------------------------------------------------
// shouldNoindex
// ---------------------------------------------------------------------------

describe('shouldNoindex()', () => {
  const base = parsePLPSearchParams({})

  it('returns false when no filters are active', () => {
    expect(shouldNoindex(base)).toBe(false)
  })

  it('returns false with exactly 1 active filter (color)', () => {
    const params = parsePLPSearchParams({ color: 'uuid-1' })
    expect(shouldNoindex(params)).toBe(false)
  })

  it('returns false with exactly 1 active filter (nuevo)', () => {
    const params = parsePLPSearchParams({ nuevo: 'true' })
    expect(shouldNoindex(params)).toBe(false)
  })

  it('returns false with exactly 1 active filter (oferta)', () => {
    const params = parsePLPSearchParams({ oferta: 'true' })
    expect(shouldNoindex(params)).toBe(false)
  })

  it('returns true with 2 active filters (color + nuevo)', () => {
    const params = parsePLPSearchParams({ color: 'uuid-1', nuevo: 'true' })
    expect(shouldNoindex(params)).toBe(true)
  })

  it('returns true with 2 active filters (color + talla)', () => {
    const params = parsePLPSearchParams({ color: 'uuid-1', talla: 'uuid-2' })
    expect(shouldNoindex(params)).toBe(true)
  })

  it('returns true when price filter is active (precio_min only)', () => {
    const params = parsePLPSearchParams({ precio_min: '30' })
    expect(shouldNoindex(params)).toBe(true)
  })

  it('returns true when price filter is active (precio_max only)', () => {
    const params = parsePLPSearchParams({ precio_max: '100' })
    expect(shouldNoindex(params)).toBe(true)
  })

  it('returns true when availability filter is active', () => {
    const params = parsePLPSearchParams({ disponible: 'true' })
    expect(shouldNoindex(params)).toBe(true)
  })

  it('returns true when explicit sort param is set', () => {
    const params = parsePLPSearchParams({ orden: 'precio-asc' })
    expect(shouldNoindex(params)).toBe(true)
  })

  it('returns false when orden is the default (destacados)', () => {
    const params = parsePLPSearchParams({ orden: 'destacados' })
    expect(shouldNoindex(params)).toBe(false)
  })
})
