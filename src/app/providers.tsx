import { QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { BrowserRouter } from 'react-router-dom'
import { wagmiConfig } from '../lib/wagmi'
import { useUiStore } from '../state/useUiStore'
import { useEffect, useRef } from 'react'
import { env } from '../lib/env'
import { initTelemetry } from '../lib/telemetry'
import { queryClient, setupGlobalCache } from '../lib/cache'
import { OptimisticUpdatesIndicator } from '../lib/optimistic'
import { blockchainEventManager } from '../lib/blockchain/eventListeners'
import { transactionQueueManager } from '../lib/blockchain/transactionQueue'
import { initializeAnalytics } from '../lib/analytics'
import { getDevConfig } from '../lib/dev-config'

export function AppProviders({ children }: { children: ReactNode }) {
  const { theme } = useUiStore()
  const initializedRef = useRef(false)
  const devConfig = getDevConfig()
  
  const rkTheme = theme === 'dark'
    ? darkTheme({ accentColor: '#ff7a00', accentColorForeground: '#ffffff', borderRadius: 'medium' })
    : lightTheme({ accentColor: '#ff7a00', accentColorForeground: '#ffffff', borderRadius: 'medium' })

  // Inicialización única de sistemas
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Configurar cache global solo una vez
    setupGlobalCache()
    
    // Inicializar telemetry solo si está habilitado y no está deshabilitado en dev
    if (env.TELEMETRY_ENABLED && !devConfig.disableTelemetry) {
      initTelemetry()
    }

    // Inicializar sistemas blockchain solo en el cliente
    if (typeof window !== 'undefined') {
      // Inicializar sistema de analytics solo si no está deshabilitado
      if (!devConfig.disableAnalytics) {
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
      }

      // Iniciar event listeners solo si no están deshabilitados
      if (!devConfig.disableBlockchainEvents) {
        blockchainEventManager.start()
        transactionQueueManager.start()
      }
      
      // Limpiar al cerrar la página
      const handleBeforeUnload = () => {
        blockchainEventManager.stop()
        transactionQueueManager.stop()
      }
      
      window.addEventListener('beforeunload', handleBeforeUnload)
      
      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        blockchainEventManager.stop()
        transactionQueueManager.stop()
      }
    }
  }, [devConfig]) // Depende de devConfig para re-ejecutar si cambia

  return (
    <BrowserRouter>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={rkTheme}>
            {children}
            {!devConfig.disableOptimisticUpdates && <OptimisticUpdatesIndicator />}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  )
}


