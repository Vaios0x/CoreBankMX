import { cfg } from './config'

type Entry = { price: number; updatedAt: number }
const store = new Map<string, Entry>()

async function fetchRedstone(symbol: string): Promise<number> {
  const res = await fetch(`${cfg.REDSTONE_URL}/prices?symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) throw new Error('redstone http')
  const json = (await res.json()) as any
  return Number(json?.[symbol]?.value ?? json?.value ?? 0)
}

async function fetchPyth(symbol: string): Promise<number> {
  const res = await fetch(`${cfg.PYTH_URL}/v2/updates/price/latest?ids[]=${encodeURIComponent(symbol)}`)
  if (!res.ok) throw new Error('pyth http')
  const json = (await res.json()) as any
  // Simplificación: placeholder
  return Number(json?.parsed?.[0]?.price ?? 0)
}

async function fetchUpstream(symbol: string): Promise<number> {
  if (cfg.ORACLE_PRIMARY === 'redstone') return fetchRedstone(symbol).catch(() => fetchPyth(symbol))
  return fetchPyth(symbol).catch(() => fetchRedstone(symbol))
}

export async function getPrice(symbol: string, ttlMs = 10_000) {
  const now = Date.now()
  const e = store.get(symbol)
  if (e && now - e.updatedAt < ttlMs) return e
  const price = await fetchUpstream(symbol)
  const entry = { price, updatedAt: now }
  store.set(symbol, entry)
  return entry
}


