// Fetches official BCV exchange rate from ve.dolarapi.com
// Cached for 1 hour via Next.js data cache (force-dynamic routes re-fetch but cache is shared)

interface DolarApiResponse {
  promedio?: number
  promedio_real?: number
  fuente?: string
  actualizado?: string
}

export async function fetchBcvRate(currency: string): Promise<number | null> {
  try {
    const endpoint =
      currency === 'USD'
        ? 'https://ve.dolarapi.com/v1/dolares/oficial'
        : 'https://ve.dolarapi.com/v1/euros'

    const res = await fetch(endpoint, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null

    const data: DolarApiResponse | DolarApiResponse[] = await res.json()

    if (Array.isArray(data)) {
      const bcv = data.find((r) => r.fuente === 'BCV')
      return bcv?.promedio ?? data[0]?.promedio ?? null
    }
    return (data as DolarApiResponse).promedio ?? null
  } catch {
    return null
  }
}

export function formatBs(amount: number, rate: number): string {
  const bs = amount * rate
  return `Bs. ${bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
