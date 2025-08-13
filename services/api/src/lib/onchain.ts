import { createPublicClient, http, getContract } from 'viem'
import { cfg } from './config'
let addresses: any = {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  addresses = require('../../../packages/contracts/addresses.testnet2.json')
} catch {
  addresses = {}
}

// Minimal ABI for LoanManager params
export const loanAbi = [
  { inputs: [], name: 'targetLtv', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'liquidationLtv', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'baseRateBps', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
]

export async function readMarketParams() {
  const rpc = cfg.CORE_RPC_TESTNET
  const chainId = cfg.CORE_CHAIN_ID_TESTNET
  const client = createPublicClient({ transport: http(rpc), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any })
  const addr = (addresses as any).LoanManager as `0x${string}`
  const contract = getContract({ address: addr, abi: loanAbi, client })
  const [t, l, r] = await Promise.all([contract.read.targetLtv(), contract.read.liquidationLtv(), contract.read.baseRateBps()])
  return { targetLtv: Number(t) / 10_000, liquidationLtv: Number(l) / 10_000, baseRate: Number(r) / 10_000 }
}


