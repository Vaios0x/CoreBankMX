import type { FastifyBaseLogger } from 'fastify'
import { ethers } from 'ethers'

export async function monitorPositions(log: FastifyBaseLogger) {
  // Lee lista de usuarios monitor a partir de ENV (coma separada)
  const usersEnv = process.env.MONITOR_USERS || ''
  if (!usersEnv) return log.info('No MONITOR_USERS set')
  let addresses: any = {}
  try { addresses = require('../../../../packages/contracts/addresses.testnet2.json') } catch {}
  const loan = addresses.LoanManager
  const liq = addresses.LiquidationModule
  if (!loan || !liq) return log.warn('Missing contract addresses')
  const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_TESTNET)
  const wallet = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY || '', provider)
  const loanAbi = [ 'function getAccountData(address) view returns (uint256,uint256,uint256)' ]
  const liqAbi = [ 'function liquidate(address,uint256)' ]
  const loanC = new ethers.Contract(loan, loanAbi, provider)
  const liqC = new ethers.Contract(liq, liqAbi, wallet)
  for (const u of usersEnv.split(',')) {
    const user = u.trim()
    if (!user) continue
    const [ , debt, hf ] = await loanC.getAccountData(user)
    if (debt > 0n && hf < 1_000000000000000000n) {
      try {
        const repay = debt / 10n
        const tx = await liqC.liquidate(user, repay)
        await tx.wait()
        log.info({ user, tx: tx.hash }, 'Liquidation submitted')
      } catch (e: any) {
        log.error({ err: e?.message }, 'Liquidation failed')
      }
    }
  }
}


