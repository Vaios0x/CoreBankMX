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
}


