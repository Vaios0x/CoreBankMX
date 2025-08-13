import { defineChain } from 'viem'
import { env } from './env'

export const coreMainnet = defineChain({
  id: env.CHAIN_ID_MAINNET,
  name: 'Core Mainnet',
  nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
  rpcUrls: {
    default: { http: [env.RPC_MAINNET] },
    public: { http: [env.RPC_MAINNET] },
  },
  blockExplorers: {
    default: { name: 'Core Scan', url: env.EXPLORER_MAINNET },
  },
})

export const coreTestnet = defineChain({
  id: env.CHAIN_ID_TESTNET,
  name: 'Core Testnet2',
  nativeCurrency: { name: 'tCORE', symbol: 'tCORE', decimals: 18 },
  rpcUrls: {
    default: { http: [env.RPC_TESTNET] },
    public: { http: [env.RPC_TESTNET] },
  },
  blockExplorers: {
    default: { name: 'Core Scan', url: env.EXPLORER_TESTNET },
  },
  testnet: true,
})


