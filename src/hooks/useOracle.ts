import { useQuery } from '@tanstack/react-query'
import { env } from '../lib/env'

async function fetchOraclePriceFromApi(symbol: string): Promise<number> {
  try {
    const res = await fetch(`${env.API_URL}/market/prices/${encodeURIComponent(symbol)}`, { cache: 'no-store' })
    const json = await res.json()
    const price = typeof json === 'number' ? Number(json) : Number(json?.price ?? json?.value ?? 0)
    if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid price')
    return price
  } catch {
    return 60000
  }
}

export function useOracle(symbol: string = 'BTC') {
  const q = useQuery({
    queryKey: ['oracle', symbol],
    queryFn: () => fetchOraclePriceFromApi(symbol),
    refetchInterval: 30_000,
  })
  const updatedAt = q.dataUpdatedAt
  const stale = Date.now() - updatedAt > 120_000
  return { ...q, stale, updatedAt }
}


