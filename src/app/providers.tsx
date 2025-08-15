import { QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '../lib/wagmi'
import { useUiStore } from '../state/useUiStore'
import { useEffect } from 'react'
import { env } from '../lib/env'
import { initTelemetry } from '../lib/telemetry'
import { queryClient, setupGlobalCache } from '../lib/cache'
import { OptimisticUpdatesIndicator } from '../lib/optimistic'
import { blockchainEventManager } from '../lib/blockchain/eventListeners'
import { transactionQueueManager } from '../lib/blockchain/transactionQueue'
import { initializeAnalytics } from '../lib/analytics'

// Configurar cache global
setupGlobalCache()

// Inicializar sistemas blockchain
if (typeof window !== 'undefined') {
  // Iniciar event listeners
  blockchainEventManager.start()
  
  // Iniciar transaction queue
  transactionQueueManager.start()
  
  // Inicializar sistema de analytics
  initializeAnalytics({
    enabled: env.ANALYTICS_ENABLED,
    sentry: {
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    },
    performance: {
      enabled: true,
      sampleRate: 0.1,
      maxEvents: 1000,
    },
    userAnalytics: {
      enabled: true,
      anonymize: false,
      trackEvents: true,
      trackPageViews: true,
    },
    abTesting: {
      enabled: true,
      experiments: {},
    },
  })
  
  // Limpiar al cerrar la página
  window.addEventListener('beforeunload', () => {
    blockchainEventManager.stop()
    transactionQueueManager.stop()
  })
}

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
          <OptimisticUpdatesIndicator />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


