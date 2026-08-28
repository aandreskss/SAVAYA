// Bulk product import — CSV parsing, grouping, and SKU resolution.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedVariantRow {
  color: string
  hexColor: string | null
  talla: string
  skuRef: string
  precio: number | null // null → inherit product basePrice
  cantidad: number
}

export interface ParsedProductGroup {
  nombre: string
  categoria: string
  genero: 'women' | 'men' | 'unisex'
  precioBase: number
  precioComparacion: number | null
  descripcion: string | null
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
// Gender normalization
// ---------------------------------------------------------------------------

const GENDER_MAP: Record<string, 'women' | 'men' | 'unisex'> = {
  women: 'women', mujer: 'women', femenino: 'women', damas: 'women',
  men: 'men', hombre: 'men', masculino: 'men', caballeros: 'men',
  unisex: 'unisex',
}

function parseGender(raw: string): 'women' | 'men' | 'unisex' {
  return GENDER_MAP[raw.trim().toLowerCase()] ?? 'women'
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
      const precioBase = parseFloat(get(row, 'precio_base'))
      const precioComp = parseFloat(get(row, 'precio_comparacion'))
      current = {
        nombre: get(row, 'nombre'),
        categoria: get(row, 'categoria'),
        genero: parseGender(get(row, 'genero')),
        precioBase: isNaN(precioBase) ? 0 : precioBase,
        precioComparacion: isNaN(precioComp) || precioComp === 0 ? null : precioComp,
        descripcion: get(row, 'descripcion') || null,
        variants: [],
        lineNumber: i + 1,
      }
      groups.push(current)
    } else if (tipo === 'variante' && current) {
      const precio = parseFloat(get(row, 'precio'))
      const cantidad = parseInt(get(row, 'cantidad') || '0', 10)
      current.variants.push({
        color: get(row, 'color'),
        hexColor: get(row, 'hex_color') || null,
        talla: get(row, 'talla'),
        skuRef: get(row, 'sku_ref'),
        precio: isNaN(precio) ? null : precio,
        cantidad: isNaN(cantidad) ? 0 : cantidad,
      })
    }
  }

  return groups.filter((g) => g.nombre && g.variants.length > 0)
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
    const sizeCode = v.talla.toUpperCase().replace(/\s+/g, '')

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
