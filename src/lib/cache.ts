import { QueryClient } from '@tanstack/react-query'
import { usePersistentStore, persistentActions } from '../state/usePersistentStore'

// Configuración del QueryClient con cache inteligente
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por defecto
      staleTime: 30 * 1000, // 30 segundos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Configuración de red
      networkMode: 'online',
      
      // Optimistic updates
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// Tipos para cache inteligente
export interface CacheConfig {
  key: string
  staleTime?: number
  gcTime?: number
  retry?: number
  background?: boolean
  optimistic?: boolean
}

// Configuraciones específicas por tipo de dato
export const CACHE_CONFIGS = {
  // Precios - Cache corto, actualización frecuente
  PRICE: {
    staleTime: 15 * 1000, // 15 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    background: true,
  },
  
  // Datos de usuario - Cache medio
  USER_DATA: {
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 3,
    background: true,
  },
  
  // Posiciones - Cache medio, actualización en background
  POSITIONS: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    background: true,
  },
  
  // Allowances - Cache largo, cambios poco frecuentes
  ALLOWANCES: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 1,
    background: false,
  },
  
  // Parámetros del protocolo - Cache largo
  PROTOCOL_PARAMS: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 3,
    background: false,
  },
  
  // Métricas del mercado - Cache medio
  MARKET_METRICS: {
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
    background: true,
  },
  
  // Transacciones - Cache corto, datos críticos
  TRANSACTIONS: {
    staleTime: 10 * 1000, // 10 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    background: false,
  },
} as const

// Claves de cache organizadas
export const CACHE_KEYS = {
  // Precios
  PRICE: (symbol: string) => ['price', symbol],
  PRICE_HISTORY: (symbol: string, timeframe: string) => ['price-history', symbol, timeframe],
  
  // Datos de usuario
  USER_BALANCE: (address: string, token: string) => ['user-balance', address, token],
  USER_POSITION: (address: string) => ['user-position', address],
  USER_ALLOWANCE: (address: string, token: string, spender: string) => 
    ['user-allowance', address, token, spender],
  
  // Protocolo
  PROTOCOL_PARAMS: () => ['protocol-params'],
  MARKET_METRICS: () => ['market-metrics'],
  LIQUIDATIONS: () => ['liquidations'],
  
  // Transacciones
  TRANSACTION_STATUS: (hash: string) => ['transaction', hash],
  TRANSACTION_HISTORY: (address: string) => ['transactions', address],
  
  // Staking
  STAKING_BALANCE: (address: string) => ['staking-balance', address],
  STAKING_REWARDS: (address: string) => ['staking-rewards', address],
  
  // Oracle
  ORACLE_STATUS: () => ['oracle-status'],
  ORACLE_PRICE: (token: string) => ['oracle-price', token],
} as const

// Utilidades para cache inteligente
export class SmartCache {
  // Obtener configuración de cache
  static getConfig(type: keyof typeof CACHE_CONFIGS): CacheConfig {
    return CACHE_CONFIGS[type]
  }
  
  // Invalidar cache específico
  static invalidate(key: string[]) {
    return queryClient.invalidateQueries({ queryKey: key })
  }
  
  // Invalidar múltiples caches
  static invalidateMultiple(keys: string[][]) {
    return Promise.all(keys.map(key => this.invalidate(key)))
  }
  
  // Limpiar cache expirado
  static clearExpired() {
    return queryClient.removeQueries({
      predicate: (query) => {
        const now = Date.now()
        const lastUpdated = query.state.dataUpdatedAt
        const staleTime = query.options.staleTime || 30 * 1000
        return now - lastUpdated > staleTime
      }
    })
  }
  
  // Prefetch datos importantes
  static async prefetch(key: string[], queryFn: () => Promise<any>) {
    return queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutos para prefetch
    })
  }
  
  // Actualizar cache optimísticamente
  static setOptimistic(key: string[], data: any) {
    return queryClient.setQueryData(key, data)
  }
  
  // Obtener datos del cache
  static getData(key: string[]) {
    return queryClient.getQueryData(key)
  }
  
  // Suscribirse a cambios de cache
  static subscribe(key: string[], callback: (data: any) => void) {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.queryKey.join('.') === key.join('.')) {
        callback(event.query.state.data)
      }
    })
  }
}

// Hook para cache inteligente con persistencia
export function useSmartCache<T>(
  key: string[],
  queryFn: () => Promise<T>,
  config: Partial<CacheConfig> = {}
) {
  const { updatePriceCache, updateUserPosition, updateAllowanceCache } = persistentActions
  
  // Determinar tipo de cache basado en la clave
  const getCacheType = (key: string[]): keyof typeof CACHE_CONFIGS => {
    if (key[0] === 'price') return 'PRICE'
    if (key[0] === 'user-position') return 'POSITIONS'
    if (key[0] === 'user-allowance') return 'ALLOWANCES'
    if (key[0] === 'protocol-params') return 'PROTOCOL_PARAMS'
    if (key[0] === 'market-metrics') return 'MARKET_METRICS'
    if (key[0] === 'transaction') return 'TRANSACTIONS'
    return 'USER_DATA'
  }
  
  const cacheType = getCacheType(key)
  const defaultConfig = CACHE_CONFIGS[cacheType]
  
  return {
    queryClient,
    config: { ...defaultConfig, ...config },
    
    // Actualizar cache persistente basado en el tipo
    updatePersistentCache: (data: T) => {
      if (key[0] === 'price' && key[1]) {
        updatePriceCache(key[1], (data as any).price || data, 'api')
      } else if (key[0] === 'user-position' && key[1]) {
        updateUserPosition(key[1], data as any)
      } else if (key[0] === 'user-allowance' && key[1] && key[2] && key[3]) {
        const cacheKey = `${key[1]}-${key[2]}-${key[3]}`
        updateAllowanceCache(cacheKey, BigInt((data as any).allowance || 0))
      }
    },
    
    // Invalidar cache relacionado
    invalidateRelated: () => {
      const relatedKeys: string[][] = []
      
      if (key[0] === 'user-position') {
        relatedKeys.push(['user-balance', key[1], 'LSTBTC'])
        relatedKeys.push(['user-balance', key[1], 'USDT'])
        relatedKeys.push(['market-metrics'])
      } else if (key[0] === 'price') {
        relatedKeys.push(['market-metrics'])
        relatedKeys.push(['user-position'])
      }
      
      if (relatedKeys.length > 0) {
        SmartCache.invalidateMultiple(relatedKeys)
      }
    }
  }
}

// Middleware para cache inteligente
export const cacheMiddleware = {
  // Middleware para transacciones
  transaction: {
    before: (tx: any) => {
      // Optimistic update
      const optimisticData = {
        status: 'pending',
        hash: tx.hash,
        timestamp: Date.now(),
        ...tx
      }
      
      SmartCache.setOptimistic(
        CACHE_KEYS.TRANSACTION_STATUS(tx.hash),
        optimisticData
      )
    },
    
    after: (tx: any, result: any) => {
      // Actualizar con datos reales
      SmartCache.setOptimistic(
        CACHE_KEYS.TRANSACTION_STATUS(tx.hash),
        { ...result, status: 'confirmed' }
      )
      
      // Invalidar caches relacionados
      SmartCache.invalidate(CACHE_KEYS.USER_POSITION(tx.from))
      SmartCache.invalidate(CACHE_KEYS.MARKET_METRICS())
    },
    
    error: (tx: any, error: any) => {
      // Revertir optimistic update
      SmartCache.setOptimistic(
        CACHE_KEYS.TRANSACTION_STATUS(tx.hash),
        { ...tx, status: 'failed', error: error.message }
      )
    }
  }
}

// Configuración global del cache
export const setupGlobalCache = () => {
  // Limpiar cache expirado cada 5 minutos
  setInterval(() => {
    SmartCache.clearExpired()
    persistentActions.clearExpiredCache()
  }, 5 * 60 * 1000)
  
  // Prefetch datos críticos al cargar la app
  const prefetchCriticalData = async () => {
    try {
      await Promise.all([
        SmartCache.prefetch(CACHE_KEYS.PROTOCOL_PARAMS(), async () => {
          const res = await fetch('/api/market/params')
          return res.json()
        }),
        SmartCache.prefetch(CACHE_KEYS.MARKET_METRICS(), async () => {
          const res = await fetch('/api/market/metrics')
          return res.json()
        })
      ])
    } catch (error) {
      console.warn('Failed to prefetch critical data:', error)
    }
  }
  
  // Ejecutar prefetch cuando la app esté lista
  if (document.readyState === 'complete') {
    prefetchCriticalData()
  } else {
    window.addEventListener('load', prefetchCriticalData)
  }
}
