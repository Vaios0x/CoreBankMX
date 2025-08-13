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
    const total = await c.totalAssets()
    if (total === 0n) return
    // Heurística APR>gas: usar APR esperado por env (bps anuales) y periodo entre ejecuciones
    const aprBps = Number(process.env.COMPOUND_EXPECTED_APR_BPS || '500') // 5% anual por defecto
    const intervalSec = Number(process.env.COMPOUND_INTERVAL_SEC || '60')
    const gainWei = BigInt(Math.max(0, Math.floor(Number(total) * (aprBps / 10_000) * (intervalSec / 31_536_000))))
    // Estimar coste gas
    let gasCostWei = 0n
    try {
      const gas = await c.compound.estimateGas()
      const gp = await provider.getGasPrice()
      gasCostWei = gas * gp
    } catch {}
    const gasMultiplier = Number(process.env.GAS_COST_MULTIPLIER || '1.2')
    const exec = gasCostWei === 0n ? true : gainWei > BigInt(Math.floor(Number(gasCostWei) * gasMultiplier))
    if (!exec) return log.info({ total: String(total), gainWei: String(gainWei), gasCostWei: String(gasCostWei) }, 'Compound skipped (APR <= gas)')
    const tx = await c.compound()
    await tx.wait()
    const after = await c.rewardIndex()
    log.info({ tx: tx.hash, before: String(before), after: String(after) }, 'Compound executed')
  } catch (e: any) {
    log.error({ err: e?.message }, 'Compound failed')
  }
}


