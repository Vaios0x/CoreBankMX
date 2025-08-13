import type { FastifyInstance } from 'fastify'
import { ethers } from 'ethers'

export async function interestRoutes(app: FastifyInstance) {
  app.post('/interest/accrue', async (req, res) => {
    const key = req.headers['x-api-key']
    if (!key || key !== process.env.API_KEY_ADMIN) return res.status(401).send({ error: 'unauthorized' })
    let addresses: any = {}
    try { addresses = require('../../../packages/contracts/addresses.testnet2.json') } catch {}
    const loan = addresses.LoanManager
    if (!loan) return res.status(400).send({ error: 'no_loan_address' })
    const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_TESTNET)
    const wallet = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY || '', provider)
    const abi = [ 'function accrueInterest()' ]
    const c = new ethers.Contract(loan, abi, wallet)
    const tx = await c.accrueInterest()
    await tx.wait()
    return { ok: true, tx: tx.hash }
  })
}


