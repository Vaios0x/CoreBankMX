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
  { inputs: [], name: 'interestIndex', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'lastAccrual', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'user', type: 'address' }], name: 'getAccountData', outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' },
]

export const feeAbi = [
  { inputs: [], name: 'originationFeeBps', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'exchangeFeeBps', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'proDiscountBps', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'minBorrowAmount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'user', type: 'address' }], name: 'isPro', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
]

const erc20Abi = [
  { inputs: [{ name: 'owner', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
]

export async function readMarketParams() {
  const rpc = cfg.CORE_RPC_TESTNET
  const chainId = cfg.CORE_CHAIN_ID_TESTNET
  const client = createPublicClient({ transport: http(rpc), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any })
  const addr = (addresses as any).LoanManager as `0x${string}`
  const contract = getContract({ address: addr, abi: loanAbi, client })
  const feeAddr = (addresses as any).FeeController as `0x${string}` | undefined
  const fee = feeAddr ? getContract({ address: feeAddr, abi: feeAbi, client }) : null
  const [t, l, r, idx, last, obps, minBorrow] = await Promise.all([
    contract.read.targetLtv(),
    contract.read.liquidationLtv(),
    contract.read.baseRateBps(),
    contract.read.interestIndex(),
    contract.read.lastAccrual(),
    fee ? fee.read.originationFeeBps() : Promise.resolve(0n),
    fee ? fee.read.minBorrowAmount() : Promise.resolve(0n),
  ])
  // Derivar datos extra: parámetros de riesgo, dirección de contratos y timestamps
  return {
    targetLtv: Number(t) / 10_000,
    liquidationLtv: Number(l) / 10_000,
    baseRate: Number(r) / 10_000,
    interestIndex: Number(idx) / 1e18,
    lastAccrual: Number(last),
    originationFeeBps: Number(obps),
    minBorrowAmount: Number(minBorrow) / 1e18,
    addresses,
  }
}

export async function estimateBorrowFee(amount: number, user?: `0x${string}`) {
  const rpc = cfg.CORE_RPC_TESTNET
  const chainId = cfg.CORE_CHAIN_ID_TESTNET
  const client = createPublicClient({ transport: http(rpc), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any })
  const feeAddr = (addresses as any).FeeController as `0x${string}` | undefined
  if (!feeAddr) return { fee: 0, bps: 0, minBorrow: 0, pro: false }
  const fee = getContract({ address: feeAddr, abi: feeAbi, client })
  const [bps, minBorrow, isPro] = await Promise.all([
    fee.read.originationFeeBps(),
    fee.read.minBorrowAmount(),
    user ? fee.read.isPro([user]) : Promise.resolve(false),
  ])
  const amountWei = BigInt(Math.floor((amount || 0) * 1e18))
  let effectiveBps = Number(bps)
  if (isPro) {
    const disc = Number(await fee.read.proDiscountBps())
    effectiveBps = Math.max(0, effectiveBps - disc)
  }
  const feeWei = (amountWei * BigInt(effectiveBps)) / 10_000n
  return { fee: Number(feeWei) / 1e18, bps: effectiveBps, minBorrow: Number(minBorrow) / 1e18, pro: Boolean(isPro) }
}

export async function readMetricsForUsers(users: string[]) {
  const rpc = cfg.CORE_RPC_TESTNET
  const chainId = cfg.CORE_CHAIN_ID_TESTNET
  const client = createPublicClient({ transport: http(rpc), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any })
  const loanAddr = (addresses as any).LoanManager as `0x${string}` | undefined
  const routerAddr = (addresses as any).OracleRouter as `0x${string}` | undefined
  const collateralToken = (addresses as any).LSTBTC as `0x${string}` | undefined
  if (!loanAddr) return { activePositions: 0, tvlUsd: 0 }
  const loan = getContract({ address: loanAddr, abi: loanAbi, client })
  // leer precio del router si existe
  let price = 0
  if (routerAddr && collateralToken) {
    try {
      const res = await (getContract({ address: routerAddr, abi: [{ inputs: [{ name: 'token', type: 'address' }], name: 'getPrice', outputs: [{ type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' }], client }) as any).read.getPrice([collateralToken])
      price = Number((res as [bigint, bigint])[0]) / 1e18
    } catch {}
  }
  let active = 0
  let tvlUsd = 0
  for (const u of users) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(u)) continue
    try {
      const [collateral, debt] = (await loan.read.getAccountData([u as `0x${string}`])) as unknown as [bigint, bigint, bigint]
      if (debt > 0n) active++
      if (price > 0) tvlUsd += (Number(collateral) / 1e18) * price
    } catch {}
  }
  return { activePositions: active, tvlUsd }
}

export async function readRecentLiquidations(maxItems = 20, lookbackBlocks = 200_000) {
  const rpc = cfg.CORE_RPC_TESTNET
  const chainId = cfg.CORE_CHAIN_ID_TESTNET
  const client = createPublicClient({ transport: http(rpc), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any })
  const lm = (addresses as any).LiquidationModule as `0x${string}` | undefined
  if (!lm) return []
  const current = await client.getBlockNumber()
  const from = current > BigInt(lookbackBlocks) ? current - BigInt(lookbackBlocks) : 0n
  const eventAbi = {
    type: 'event',
    name: 'Liquidate',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'repayAmount', type: 'uint256' },
      { indexed: false, name: 'collateralSeized', type: 'uint256' },
      { indexed: false, name: 'incentive', type: 'uint256' },
    ],
  } as const
  const logs = await client.getLogs({ address: lm, event: eventAbi as any, fromBlock: from, toBlock: current })
  return logs.slice(-maxItems).reverse().map((l: any) => ({
    tx: String(l.transactionHash),
    user: String((l.args as any)?.user),
    repayAmount: Number((l.args as any)?.repayAmount) / 1e18,
    collateralSeized: Number((l.args as any)?.collateralSeized) / 1e18,
    incentive: Number((l.args as any)?.incentive) / 1e18,
    blockNumber: Number(l.blockNumber),
  }))
}

export async function readOnchainPriceForSymbol(symbol: string): Promise<{ price: number; updatedAt: number } | null> {
  const routerAddr = (addresses as any).OracleRouter as `0x${string}` | undefined
  if (!routerAddr) return null
  const tokenBySymbol: Record<string, string | undefined> = {
    LSTBTC: (addresses as any).LSTBTC,
    BTC: (addresses as any).LSTBTC,
    WBTC: (addresses as any).LSTBTC,
    USDT: (addresses as any).USDT,
  }
  const key = String(symbol).toUpperCase()
  const token = tokenBySymbol[key]
  if (!token) return null
  const rpc = cfg.CORE_RPC_TESTNET
  const chainId = cfg.CORE_CHAIN_ID_TESTNET
  const client = createPublicClient({ transport: http(rpc), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any })
  const router = getContract({ address: routerAddr, abi: [{ inputs: [{ name: 'token', type: 'address' }], name: 'getPrice', outputs: [{ type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' }], client })
  const [p, t] = (await (router as any).read.getPrice([token as `0x${string}`])) as [bigint, bigint]
  const price = Number(p) / 1e18
  const updatedAt = Number(t) * 1000
  if (!Number.isFinite(price) || price <= 0) return null
  return { price, updatedAt }
}

export async function readVaultTvlUsd(): Promise<number> {
  const vaultAddr = (addresses as any).CollateralVault as `0x${string}` | undefined
  const tokenAddr = (addresses as any).LSTBTC as `0x${string}` | undefined
  const routerAddr = (addresses as any).OracleRouter as `0x${string}` | undefined
  if (!vaultAddr || !tokenAddr || !routerAddr) return 0
  const rpc = cfg.CORE_RPC_TESTNET
  const chainId = cfg.CORE_CHAIN_ID_TESTNET
  const client = createPublicClient({ transport: http(rpc), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any })
  const token = getContract({ address: tokenAddr, abi: erc20Abi as any, client })
  const router = getContract({ address: routerAddr, abi: [{ inputs: [{ name: 'token', type: 'address' }], name: 'getPrice', outputs: [{ type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' }], client })
  const [bal, dec, pr] = await Promise.all([
    (token as any).read.balanceOf([vaultAddr]),
    (token as any).read.decimals(),
    (router as any).read.getPrice([tokenAddr]),
  ])
  const decimals = Number(dec || 18)
  const balance = Number(bal) / 10 ** decimals
  const price = Number((pr as [bigint, bigint])[0]) / 1e18
  if (!Number.isFinite(balance) || !Number.isFinite(price)) return 0
  return balance * price
}


