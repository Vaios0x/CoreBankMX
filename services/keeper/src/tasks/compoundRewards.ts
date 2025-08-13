import type { FastifyBaseLogger } from 'fastify'
import { ethers } from 'ethers'

export async function compoundRewards(log: FastifyBaseLogger) {
  try {
    let addresses: any = {}
    try { addresses = require('../../../../packages/contracts/addresses.testnet2.json') } catch {}
    const staking = addresses.DualStakingVault
    if (!staking) return
    const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_TESTNET)
    const wallet = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY || '', provider)
    const abi = [
      'function rewardIndex() view returns (uint256)',
      'function totalAssets() view returns (uint256)',
      'function compound()'
    ]
    const c = new ethers.Contract(staking, abi, wallet)
    const before = await c.rewardIndex()
    // Heurística: si hay activos y pasó tiempo suficiente, ejecuta compound
    const total = await c.totalAssets()
    if (total > 0n) {
      const tx = await c.compound()
      await tx.wait()
      const after = await c.rewardIndex()
      log.info({ tx: tx.hash, before: String(before), after: String(after) }, 'Compound executed')
    }
  } catch (e: any) {
    log.error({ err: e?.message }, 'Compound failed')
  }
}


