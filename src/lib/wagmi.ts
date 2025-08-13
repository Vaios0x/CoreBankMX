import { createConfig, http, createStorage } from 'wagmi'
import { coreMainnet, coreTestnet } from './chains'
import { env } from './env'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { metaMaskWallet, coinbaseWallet, injectedWallet, walletConnectWallet, rabbyWallet } from '@rainbow-me/rainbowkit/wallets'

const hasValidProjectId = Boolean(env.WALLETCONNECT_PROJECT_ID && env.WALLETCONNECT_PROJECT_ID !== 'demo-project-id')

const wallets = [metaMaskWallet, rabbyWallet, coinbaseWallet, injectedWallet, ...(hasValidProjectId ? [walletConnectWallet] : [])]

const connectors = hasValidProjectId
  ? connectorsForWallets(
      [{ groupName: 'Recomendados', wallets }],
      { appName: 'Core Neobank MX', projectId: env.WALLETCONNECT_PROJECT_ID },
    )
  : connectorsForWallets(
      [{ groupName: 'Recomendados', wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet, injectedWallet] }],
      { appName: 'Core Neobank MX', projectId: 'unused' },
    )

export const wagmiConfig = createConfig({
  chains: [coreTestnet, coreMainnet],
  connectors,
  transports: {
    [coreMainnet.id]: http(env.RPC_MAINNET),
    [coreTestnet.id]: http(env.RPC_TESTNET),
  },
  storage: createStorage({ storage: typeof window !== 'undefined' ? window.localStorage : undefined }),
  ssr: false,
})


