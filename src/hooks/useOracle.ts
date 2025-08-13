import { useQuery } from '@tanstack/react-query'
import { env } from '../lib/env'
import { createPublicClient, http } from 'viem'
import OracleRouterAbi from '../abi/OracleRouter.json'
import { coreMainnet, coreTestnet } from '../lib/chains'

async function fetchOraclePriceFromApi(symbol: string): Promise<number> {
  try {
    const res = await fetch(`${env.API_URL}/market/prices/${encodeURIComponent(symbol)}`, { cache: 'no-store' })
    const json = await res.json()
    const price = typeof json === 'number' ? Number(json) : Number(json?.price ?? json?.value ?? 0)
    if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid price')
    return price
  } catch {
    return 60000
  }
}

async function fetchOraclePriceOnchain(): Promise<number> {
  const router = env.ORACLE_ROUTER as `0x${string}`
  const token = env.COLLATERAL_TOKEN as `0x${string}`
  if (!router || router === '0x0000000000000000000000000000000000000000' || !token || token === '0x0000000000000000000000000000000000000000') {
    throw new Error('missing_oracle_addresses')
  }
  // Elegir chain por heurística: usar testnet si URL RPC apunta a testnet
  const chain = env.RPC_TESTNET.includes('test') ? coreTestnet : coreMainnet
  const rpc = env.RPC_TESTNET.includes('test') ? env.RPC_TESTNET : env.RPC_MAINNET
  const client = createPublicClient({ transport: http(rpc), chain })
  const [price] = await client.readContract({ address: router, abi: OracleRouterAbi as any, functionName: 'getPrice', args: [token] }) as unknown as [bigint, bigint]
  const p = Number(price)
  if (!Number.isFinite(p) || p <= 0) throw new Error('invalid_onchain_price')
  // Asumimos 1e18
  return p / 1e18
}

export function useOracle(symbol: string = 'BTC') {
  const q = useQuery({
    queryKey: ['oracle', env.USE_ONCHAIN_ORACLE ? 'onchain' : 'api', symbol],
    queryFn: () => (env.USE_ONCHAIN_ORACLE ? fetchOraclePriceOnchain() : fetchOraclePriceFromApi(symbol)),
    refetchInterval: 30_000,
  })
  const updatedAt = q.dataUpdatedAt
  const stale = Date.now() - updatedAt > 120_000
  return { ...q, stale, updatedAt }
}


