import 'dotenv/config'
import { setTimeout as sleep } from 'node:timers/promises'

const API = process.env.API_URL || 'http://localhost:8080'
const TOKEN = process.env.LSTBTC_ADDRESS || ''
const ENABLED = process.env.ALLOW_ORACLE_PUSH_CRON === '1'

async function push(price: number) {
  const res = await fetch(`${API}/oracle/push-simple`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: TOKEN, price }),
  })
  if (!res.ok) throw new Error(`push failed: ${res.status}`)
  return res.json()
}

async function main() {
  if (!ENABLED) throw new Error('ALLOW_ORACLE_PUSH_CRON!=1')
  if (!TOKEN) throw new Error('LSTBTC_ADDRESS missing')
  // base price configurable o semilla
  const base = Number(process.env.PRICE_BASE || '65000')
  const jitter = Number(process.env.PRICE_JITTER || '0.01')
  const intervalMs = Number(process.env.PRICE_INTERVAL_MS || '30000')
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const r = (Math.random() * 2 - 1) * jitter
    const price = base * (1 + r)
    try {
      const json = await push(price)
      // eslint-disable-next-line no-console
      console.log('pushed', price.toFixed(2), json)
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('push error', e?.message)
    }
    await sleep(intervalMs)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })


