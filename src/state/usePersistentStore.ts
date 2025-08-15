import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

// Tipos para datos persistentes
export interface PersistentData {
  // Configuración del usuario
  userPreferences: {
    theme: 'light' | 'dark' | 'system'
    language: 'en' | 'es'
    currency: 'USD' | 'EUR' | 'BTC'
    notifications: boolean
    autoRefresh: boolean
    gasPreferences: {
      fast: number
      standard: number
      slow: number
    }
  }
  
  // Datos de transacciones
  transactionHistory: {
    id: string
    type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'stake' | 'unstake'
    amount: number
    token: string
    status: 'pending' | 'confirmed' | 'failed'
    hash: string
    timestamp: number
    gasUsed?: number
    gasPrice?: number
  }[]
  
  // Cache de precios
  priceCache: {
    [symbol: string]: {
      price: number
      timestamp: number
      source: 'api' | 'onchain'
    }
  }
  
  // Posiciones del usuario
  userPositions: {
    [address: string]: {
      collateral: number
      debt: number
      healthFactor: number
      lastUpdated: number
    }
  }
  
  // Allowances cache
  allowancesCache: {
    [key: string]: {
      amount: bigint
      timestamp: number
    }
  }
  
  // Configuración de red
  networkConfig: {
    lastUsedChain: number
    customRPCs: {
      [chainId: number]: string
    }
  }
  
  // Eventos de analytics
  analyticsEvents: {
    type: string
    data: any
    timestamp: number
  }[]
}

// Estado inicial
const initialState: PersistentData = {
  userPreferences: {
    theme: 'system',
    language: 'en',
    currency: 'USD',
    notifications: true,
    autoRefresh: true,
    gasPreferences: {
      fast: 50,
      standard: 30,
      slow: 20
    }
  },
  transactionHistory: [],
  priceCache: {},
  userPositions: {},
  allowancesCache: {},
  networkConfig: {
    lastUsedChain: 1114,
    customRPCs: {}
  },
  analyticsEvents: []
}

// Store persistente con suscripciones
export const usePersistentStore = create<PersistentData>()(
  subscribeWithSelector(
    persist(
      () => initialState,
      {
        name: 'banobs-persistent-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          userPreferences: state.userPreferences,
          transactionHistory: state.transactionHistory.slice(-100), // Solo últimas 100 transacciones
          priceCache: state.priceCache,
          userPositions: state.userPositions,
          allowancesCache: state.allowancesCache,
          networkConfig: state.networkConfig
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migración de versión 0 a 1
            return {
              ...persistedState,
              networkConfig: {
                lastUsedChain: 1114,
                customRPCs: {}
              }
            }
          }
          return persistedState
        }
      }
    )
  )
)

// Selectores optimizados
export const useUserPreferences = () => usePersistentStore((state) => state.userPreferences)
export const useTransactionHistory = () => usePersistentStore((state) => state.transactionHistory)
export const usePriceCache = () => usePersistentStore((state) => state.priceCache)
export const useUserPositions = () => usePersistentStore((state) => state.userPositions)
export const useAllowancesCache = () => usePersistentStore((state) => state.allowancesCache)
export const useNetworkConfig = () => usePersistentStore((state) => state.networkConfig)

// Acciones para el store persistente
export const persistentActions = {
  // Preferencias del usuario
  updateUserPreferences: (updates: Partial<PersistentData['userPreferences']>) =>
    usePersistentStore.setState((state) => ({
      userPreferences: { ...state.userPreferences, ...updates }
    })),
  
  // Historial de transacciones
  addTransaction: (transaction: PersistentData['transactionHistory'][0]) =>
    usePersistentStore.setState((state) => ({
      transactionHistory: [transaction, ...state.transactionHistory]
    })),
  
  updateTransactionStatus: (hash: string, status: 'pending' | 'confirmed' | 'failed', gasUsed?: number, gasPrice?: number) =>
    usePersistentStore.setState((state) => ({
      transactionHistory: state.transactionHistory.map(tx =>
        tx.hash === hash ? { ...tx, status, gasUsed, gasPrice } : tx
      )
    })),
  
  // Cache de precios
  updatePriceCache: (symbol: string, price: number, source: 'api' | 'onchain') =>
    usePersistentStore.setState((state) => ({
      priceCache: {
        ...state.priceCache,
        [symbol]: { price, timestamp: Date.now(), source }
      }
    })),
  
  // Posiciones del usuario
  updateUserPosition: (address: string, position: Partial<PersistentData['userPositions'][string]>) =>
    usePersistentStore.setState((state) => ({
      userPositions: {
        ...state.userPositions,
        [address]: {
          ...state.userPositions[address],
          ...position,
          lastUpdated: Date.now()
        }
      }
    })),
  
  // Cache de allowances
  updateAllowanceCache: (key: string, amount: bigint) =>
    usePersistentStore.setState((state) => ({
      allowancesCache: {
        ...state.allowancesCache,
        [key]: { amount, timestamp: Date.now() }
      }
    })),
  
  // Configuración de red
  updateNetworkConfig: (updates: Partial<PersistentData['networkConfig']>) =>
    usePersistentStore.setState((state) => ({
      networkConfig: { ...state.networkConfig, ...updates }
    })),
  
  // Limpiar cache expirado
  clearExpiredCache: () =>
    usePersistentStore.setState((state) => {
      const now = Date.now()
      const cacheExpiry = 5 * 60 * 1000 // 5 minutos
      const allowanceExpiry = 10 * 60 * 1000 // 10 minutos
      
      return {
        priceCache: Object.fromEntries(
          Object.entries(state.priceCache).filter(
            ([, data]) => now - data.timestamp < cacheExpiry
          )
        ),
        allowancesCache: Object.fromEntries(
          Object.entries(state.allowancesCache).filter(
            ([, data]) => now - data.timestamp < allowanceExpiry
          )
        )
      }
    }),
  
  // Eventos de analytics
  addAnalyticsEvent: (event: PersistentData['analyticsEvents'][0]) =>
    usePersistentStore.setState((state) => ({
      analyticsEvents: [event, ...state.analyticsEvents.slice(0, 999)] // Mantener solo últimos 1000 eventos
    }))
}
