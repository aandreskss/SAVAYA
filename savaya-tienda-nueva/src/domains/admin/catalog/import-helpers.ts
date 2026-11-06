// Bulk product import — CSV parsing, grouping, and SKU resolution.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedVariantRow {
  color: string
  hexColor: string | null
  size: string
  skuRef: string
  price: number | null // null → inherit product basePrice
  quantity: number
}

export interface ParsedProductGroup {
  name: string
  category: string
  gender: string
  basePrice: number
  compareAtPrice: number | null
  description: string | null
  variants: ParsedVariantRow[]
  lineNumber: number
}

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields (RFC 4180 compatible)
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

// ---------------------------------------------------------------------------
// Gender normalization — maps CSV input to DB gender slugs (Spanish)
// ---------------------------------------------------------------------------

const GENDER_MAP: Record<string, string> = {
  women: 'mujer', mujer: 'mujer', femenino: 'mujer', damas: 'mujer',
  men: 'hombre', hombre: 'hombre', masculino: 'hombre', caballeros: 'hombre',
  unisex: 'unisex',
  ninos: 'ninos', niños: 'ninos', nino: 'ninos', 'niño': 'ninos',
  ninas: 'ninas', niñas: 'ninas', nina: 'ninas', 'niña': 'ninas',
}

function parseGender(raw: string): string {
  return GENDER_MAP[raw.trim().toLowerCase()] ?? 'mujer'
}

// ---------------------------------------------------------------------------
// CSV → ParsedProductGroup[]
// ---------------------------------------------------------------------------

export function parseImportCsv(text: string): ParsedProductGroup[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const rawHeaders = parseCsvLine(lines[0]!)
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/\s+/g, '_'))

  const get = (row: string[], key: string): string => {
    const i = headers.indexOf(key)
    return i >= 0 ? (row[i] ?? '').trim() : ''
  }

  const groups: ParsedProductGroup[] = []
  let current: ParsedProductGroup | null = null

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]!)
    const tipo = get(row, 'tipo').toLowerCase()

    if (tipo === 'producto') {
      const basePrice = parseFloat(get(row, 'precio_base'))
      const comparePrice = parseFloat(get(row, 'precio_comparacion'))
      current = {
        name: get(row, 'nombre'),
        category: get(row, 'categoria'),
        gender: parseGender(get(row, 'genero')),
        basePrice: isNaN(basePrice) ? 0 : basePrice,
        compareAtPrice: isNaN(comparePrice) || comparePrice === 0 ? null : comparePrice,
        description: get(row, 'descripcion') || null,
        variants: [],
        lineNumber: i + 1,
      }
      groups.push(current)
    } else if (tipo === 'variante' && current) {
      const price = parseFloat(get(row, 'precio'))
      const quantity = parseInt(get(row, 'cantidad') || '0', 10)
      current.variants.push({
        color: get(row, 'color'),
        hexColor: get(row, 'hex_color') || null,
        size: get(row, 'talla'),
        skuRef: get(row, 'sku_ref'),
        price: isNaN(price) ? null : price,
        quantity: isNaN(quantity) ? 0 : quantity,
      })
    }
  }

  return groups.filter((g) => g.name && g.variants.length > 0)
}

// ---------------------------------------------------------------------------
// SKU resolution
//
// Rule: if a skuRef is shared across multiple COLORS in the same product
//       → append a 3-char color abbreviation to avoid collisions.
//       If used by one color only → just append the size code.
//
// Examples:
//   SAN-001 used by Rojo AND Azul  → SAN-001-ROJ-36, SAN-001-AZU-36
//   SAN-002 used by Blanco only    → SAN-002-36
// ---------------------------------------------------------------------------

export function resolveVariantSkus(
  variants: ParsedVariantRow[],
  fallbackPrefix: string,
): Map<ParsedVariantRow, string> {
  // Count distinct colors per skuRef
  const refColorSets = new Map<string, Set<string>>()
  for (const v of variants) {
    const ref = (v.skuRef || fallbackPrefix).toUpperCase()
    if (!refColorSets.has(ref)) refColorSets.set(ref, new Set())
    refColorSets.get(ref)!.add(v.color.toLowerCase())
  }

  const result = new Map<ParsedVariantRow, string>()
  const usedSkus = new Set<string>()

  for (const v of variants) {
    const ref = (v.skuRef || fallbackPrefix).toUpperCase()
    const colorSet = refColorSets.get(ref)!
    const multiColor = colorSet.size > 1
    const sizeCode = v.size.toUpperCase().replace(/\s+/g, '')

    let base: string
    if (multiColor) {
      base = `${ref}-${abbreviate(v.color)}-${sizeCode}`
    } else {
      base = `${ref}-${sizeCode}`
    }

    // Resolve collision with numeric suffix
    let sku = base
    let n = 2
    while (usedSkus.has(sku)) {
      sku = `${base}-${n}`
      n++
    }
    usedSkus.add(sku)
    result.set(v, sku)
  }

  return result
}

// Take first 3 uppercase alphanumeric chars from name (stripped of accents)
function abbreviate(name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  return clean.slice(0, 3) || 'VAR'
}
