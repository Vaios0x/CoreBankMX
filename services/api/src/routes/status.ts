import type { FastifyInstance } from 'fastify'
import { cfg } from '../lib/config'
let addresses: any = {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  addresses = require('../../../packages/contracts/addresses.testnet2.json')
} catch {
  addresses = {}
}

export async function statusRoutes(app: FastifyInstance) {
  app.get('/status', async () => {
    return {
      ok: true,
      chain: {
        testnet: { id: cfg.CORE_CHAIN_ID_TESTNET, rpc: cfg.CORE_RPC_TESTNET },
        mainnet: { id: cfg.CORE_CHAIN_ID_MAINNET, rpc: cfg.CORE_RPC_MAINNET },
      },
      keeper: { ok: true },
      contracts: addresses,
    }
  })
}


