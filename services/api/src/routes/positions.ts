import type { FastifyInstance } from 'fastify'
import { createPublicClient, getContract, http } from 'viem'
import { cfg } from '../lib/config'

const loanAbi = [
  { inputs: [{ name: 'user', type: 'address' }], name: 'getAccountData', outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

export async function positionsRoutes(app: FastifyInstance) {
  // Demo: lista simple de usuarios en memoria, configurable por ENV
  const demoUsers = (process.env.MONITOR_USERS || '').split(',').map((s) => s.trim()).filter(Boolean)
  app.get<{ Params: { address: `0x${string}` } }>('/positions/:address', async (req, res) => {
    const addr = (req.params.address || '') as `0x${string}`
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return res.status(400).send({ error: 'bad_address' })
    let addresses: any = {}
    try { addresses = require('../../../packages/contracts/addresses.testnet2.json') } catch {}
    const loan = addresses.LoanManager as `0x${string}` | undefined
    if (!loan) return res.status(400).send({ error: 'no_loan' })
    const client = createPublicClient({ transport: http(cfg.CORE_RPC_TESTNET), chain: { id: cfg.CORE_CHAIN_ID_TESTNET, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [cfg.CORE_RPC_TESTNET] } } } as any })
    const contract = getContract({ address: loan, abi: loanAbi as any, client })
    const result = await contract.read.getAccountData([addr])
    const collateral = (result as unknown as [bigint, bigint, bigint])[0]
    const debt = (result as unknown as [bigint, bigint, bigint])[1]
    const hf = (result as unknown as [bigint, bigint, bigint])[2]
    return { address: addr, collateral: collateral.toString(), debt: debt.toString(), healthFactor: hf.toString() }
  })
  // Batch por query param ?addresses=0x..,0x..
  app.get('/positions', async (req, res) => {
    const q = new URL(req.url, 'http://localhost').searchParams.get('addresses') || ''
    const addrs = q.split(',').map((s) => s.trim()).filter((s) => /^0x[a-fA-F0-9]{40}$/.test(s))
    if (addrs.length === 0) return res.send({ items: [] })
    let addresses: any = {}
    try { addresses = require('../../../packages/contracts/addresses.testnet2.json') } catch {}
    const loan = addresses.LoanManager as `0x${string}` | undefined
    if (!loan) return res.status(400).send({ error: 'no_loan' })
    const client = createPublicClient({ transport: http(cfg.CORE_RPC_TESTNET), chain: { id: cfg.CORE_CHAIN_ID_TESTNET, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [cfg.CORE_RPC_TESTNET] } } } as any })
    const contract = getContract({ address: loan, abi: loanAbi as any, client })
    const items: any[] = []
    for (const a of addrs) {
      try {
        const result = await contract.read.getAccountData([a as `0x${string}`])
        const [c, d, h] = result as unknown as [bigint, bigint, bigint]
        items.push({ address: a, collateral: c.toString(), debt: d.toString(), healthFactor: h.toString() })
      } catch {}
    }
    return { items }
  })

  app.get('/positions/users', async () => {
    // Endpoint simple que devuelve la lista de usuarios monitor (para keeper/demo)
    return { users: demoUsers }
  })
}


