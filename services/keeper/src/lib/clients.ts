import { createPublicClient, http } from 'viem'

export function makeClient(rpcUrl: string, chainId: number) {
  return createPublicClient({ transport: http(rpcUrl), chain: { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } } as any })
}


