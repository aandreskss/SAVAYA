import { describe, it, expect } from 'vitest'
import { slugify } from '../slugify'

describe('slugify()', () => {
  it('lowercases ASCII text', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('calzado femenino')).toBe('calzado-femenino')
  })

  it('strips accents from vowels (á é í ó ú)', () => {
    expect(slugify('sándalo')).toBe('sandalo')
    expect(slugify('café')).toBe('cafe')
    expect(slugify('íntimo')).toBe('intimo')
    expect(slugify('módulo')).toBe('modulo')
    expect(slugify('único')).toBe('unico')
  })

  it('strips the tilde from ñ → n', () => {
    expect(slugify('año nuevo')).toBe('ano-nuevo')
    expect(slugify('NIÑA')).toBe('nina')
  })

  it('strips special characters', () => {
    expect(slugify('precio: $50 USD!')).toBe('precio-50-usd')
    expect(slugify('¡Bienvenidos!')).toBe('bienvenidos')
    expect(slugify('90% descuento')).toBe('90-descuento')
  })

  it('collapses multiple spaces into one hyphen', () => {
    expect(slugify('a  b   c')).toBe('a-b-c')
  })

  it('collapses multiple hyphens into one', () => {
    expect(slugify('hola--mundo')).toBe('hola-mundo')
  })

  it('trims leading and trailing spaces', () => {
    expect(slugify('  sandalias  ')).toBe('sandalias')
  })

  it('handles numbers correctly', () => {
    expect(slugify('talla 38')).toBe('talla-38')
    expect(slugify('2025 colección')).toBe('2025-coleccion')
  })

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('handles real Venezuelan shoe product names', () => {
    expect(slugify('Sandalia Dorada Con Plataforma')).toBe('sandalia-dorada-con-plataforma')
    expect(slugify('Tacón Stiletto Café Oscuro')).toBe('tacon-stiletto-cafe-oscuro')
    expect(slugify('Plataforma Años 90')).toBe('plataforma-anos-90')
  })
})
