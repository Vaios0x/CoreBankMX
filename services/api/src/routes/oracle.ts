import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ethers } from 'ethers'

const Schema = z.object({ adapter: z.string(), token: z.string(), price: z.coerce.number().positive(), updatedAt: z.coerce.number().int() })

export async function oracleRoutes(app: FastifyInstance) {
  app.post('/oracle/push', async (req, res) => {
    const key = req.headers['x-api-key']
    if (!key || key !== process.env.API_KEY_ADMIN) return res.status(401).send({ error: 'unauthorized' })
    const parse = Schema.safeParse(req.body)
    if (!parse.success) return res.status(400).send({ error: 'invalid_payload', issues: parse.error.issues })
    const { adapter, token, price, updatedAt } = parse.data
    const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_TESTNET)
    const wallet = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY || '', provider)
    const abi = [
      'function ROLE_ORACLE() view returns (bytes32)',
      'function hasRole(bytes32,address) view returns (bool)',
      'function grantRole(bytes32,address)',
      'function pushPrice(address,uint256,uint256)'
    ]
    const c = new ethers.Contract(adapter, abi, wallet)
    const role = await c.ROLE_ORACLE()
    const has = await c.hasRole(role, wallet.address)
    if (!has) {
      const tx = await c.grantRole(role, wallet.address)
      await tx.wait()
    }
    const tx2 = await c.pushPrice(token, BigInt(Math.floor(price)), BigInt(updatedAt))
    await tx2.wait()
    return { ok: true, tx: tx2.hash }
  })

  // Cron-friendly endpoint: accepts simple { token, price } and pushes to both adapters if env ALLOW_ORACLE_PUSH_CRON=1
  app.post('/oracle/push-simple', async (req, res) => {
    if (process.env.ALLOW_ORACLE_PUSH_CRON !== '1') return res.status(403).send({ error: 'forbidden' })
    const body: any = req.body || {}
    const token = String(body.token || '')
    const price = Number(body.price || 0)
    if (!/^0x[a-fA-F0-9]{40}$/.test(token) || !Number.isFinite(price) || price <= 0) return res.status(400).send({ error: 'bad_payload' })
    const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_TESTNET)
    const wallet = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY || '', provider)
    let addresses: any = {}
    try { addresses = require('../../../packages/contracts/addresses.testnet2.json') } catch {}
    const adapters = [addresses.RedStoneAdapter, addresses.PythAdapter].filter(Boolean)
    const abi = [ 'function ROLE_ORACLE() view returns (bytes32)','function hasRole(bytes32,address) view returns (bool)','function grantRole(bytes32,address)','function pushPrice(address,uint256,uint256)']
    const now = Math.floor(Date.now() / 1000)
    const txs: string[] = []
    for (const addr of adapters) {
      const c = new ethers.Contract(addr, abi, wallet)
      const role = await c.ROLE_ORACLE()
      const has = await c.hasRole(role, wallet.address)
      if (!has) { const tx = await c.grantRole(role, wallet.address); await tx.wait() }
      const tx2 = await c.pushPrice(token, BigInt(Math.floor(price * 1e18)), BigInt(now))
      await tx2.wait()
      txs.push(tx2.hash)
    }
    return { ok: true, txs }
  })
}


