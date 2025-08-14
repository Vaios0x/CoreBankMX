import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '../lib/wagmi'
import { useUiStore } from '../state/useUiStore'
import { useEffect } from 'react'
import { env } from '../lib/env'
import { initTelemetry } from '../lib/telemetry'

const queryClient = new QueryClient()

// Web3Modal eliminado en favor de RainbowKit

export function AppProviders({ children }: { children: ReactNode }) {
  const { theme } = useUiStore()
  const rkTheme = theme === 'dark'
    ? darkTheme({ accentColor: '#ff7a00', accentColorForeground: '#ffffff', borderRadius: 'medium' })
    : lightTheme({ accentColor: '#ff7a00', accentColorForeground: '#ffffff', borderRadius: 'medium' })

  useEffect(() => {
    if (env.TELEMETRY_ENABLED) {
      initTelemetry()
    }
  }, [])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


