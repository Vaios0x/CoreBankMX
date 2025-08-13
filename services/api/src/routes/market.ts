import type { FastifyInstance } from 'fastify'
import { getPrice } from '../lib/oracleCache'
import { readMarketParams, estimateBorrowFee, readMetricsForUsers, readRecentLiquidations } from '../lib/onchain'

export async function marketRoutes(app: FastifyInstance) {
  let cache: any = null
  let cachedAt = 0
  app.get('/market/params', async () => {
    const now = Date.now()
    if (cache && now - cachedAt < 15_000) return cache
    const data = await readMarketParams()
    cache = { ...data, penalty: 0.08 }
    cachedAt = now
    return cache
  })

  app.get<{ Querystring: { amount?: string; user?: `0x${string}` } }>('/market/fee', async (req) => {
    const amount = Number(req.query.amount || '0')
    const user = req.query.user
    return estimateBorrowFee(amount, user)
  })

  app.get<{ Params: { symbol: string } }>('/market/prices/:symbol', async (req) => {
    const { symbol } = req.params
    const e = await getPrice(symbol.toUpperCase(), 10_000)
    return e
  })

  // Mock histórico simple para sparkline: 48 puntos (~24h, cada 30m)
  app.get<{ Params: { symbol: string } }>('/market/history/:symbol', async (req) => {
    const { symbol } = req.params
    const baseRaw = await getPrice(symbol.toUpperCase(), 10_000)
    const base = typeof baseRaw === 'number' ? baseRaw : Number(baseRaw?.price ?? baseRaw ?? 0)
    const now = Date.now()
    const points = Array.from({ length: 48 }).map((_, i) => {
      const t = now - (48 - i) * 30 * 60 * 1000
      const v = (base || 60000) * (1 + Math.sin(i / 3) * 0.01)
      return { t, v }
    })
    return { symbol: symbol.toUpperCase(), points }
  })

  // Métricas agregadas (demo: usuarios de MONITOR_USERS)
  app.get('/market/metrics', async () => {
    const users = (process.env.MONITOR_USERS || '').split(',').map((s) => s.trim()).filter(Boolean)
    const m = await readMetricsForUsers(users)
    return { ...m, liquidations24h: 0 }
  })

  // Histórico de TVL (mock)
  app.get('/market/history/tvl', async () => {
    const now = Date.now()
    const base = 1_500_000
    const points = Array.from({ length: 48 }).map((_, i) => {
      const t = now - (48 - i) * 30 * 60 * 1000
      const v = base * (1 + Math.sin(i / 5) * 0.02)
      return { t, v }
    })
    return { metric: 'TVL', points }
  })

  app.get('/market/liquidations', async () => {
    const items = await readRecentLiquidations(20)
    return { items }
  })
}


