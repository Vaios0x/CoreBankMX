import { useQuery } from '@tanstack/react-query'
import { env } from '../lib/env'
import { CONTRACTS } from '../lib/contracts'
import { createPublicClient, http } from 'viem'
import OracleRouterAbi from '../abi/OracleRouter.json'
import { coreMainnet, coreTestnet } from '../lib/chains'
import { CACHE_KEYS, CACHE_CONFIGS, SmartCache } from '../lib/cache'
import { persistentActions } from '../state/usePersistentStore'

async function fetchOraclePriceFromApi(symbol: string): Promise<number> {
  try {
    const res = await fetch(`${env.API_URL}/market/prices/${encodeURIComponent(symbol)}`, { cache: 'no-store' })
    const json = await res.json()
    const price = typeof json === 'number' ? Number(json) : Number(json?.price ?? json?.value ?? 0)
    if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid price')
    return price
  } catch (error) {
    console.error('API oracle failed, falling back to on-chain oracle:', error)
    return fetchOraclePriceOnchain()
  }
}

async function fetchOraclePriceOnchain(): Promise<number> {
  const router = CONTRACTS.OracleRouter as `0x${string}`
  const token = CONTRACTS.LSTBTC as `0x${string}`
  if (!router || !token) {
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
  const config = CACHE_CONFIGS.PRICE
  
  const q = useQuery({
    queryKey: CACHE_KEYS.ORACLE_PRICE(symbol),
    queryFn: async () => {
      const price = env.USE_ONCHAIN_ORACLE ? 
        await fetchOraclePriceOnchain() : 
        await fetchOraclePriceFromApi(symbol)
      
      // Actualizar cache persistente
      persistentActions.updatePriceCache(symbol, price, env.USE_ONCHAIN_ORACLE ? 'onchain' : 'api')
      
      return price
    },
    staleTime: config.staleTime,
    gcTime: config.gcTime,
    retry: config.retry,
    refetchInterval: 30_000,
    refetchIntervalInBackground: config.background,
    placeholderData: () => {
      // Usar datos del cache persistente como fallback
      const cachedData = SmartCache.getData(CACHE_KEYS.ORACLE_PRICE(symbol))
      return typeof cachedData === 'number' ? cachedData : undefined
    }
  })
  
  const updatedAt = q.dataUpdatedAt
  const stale = Date.now() - updatedAt > 120_000
  const source = env.USE_ONCHAIN_ORACLE ? 'on-chain' : 'api'
  
  return { ...q, stale, updatedAt, source }
}


