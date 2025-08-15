// Configuración específica para desarrollo
export const devConfig = {
  // Deshabilitar sistemas problemáticos en desarrollo
  disableBlockchainEvents: true,
  disableOptimisticUpdates: false,
  disableWebSocket: true, // Deshabilitado para evitar errores de conexión
  disableAnalytics: true,
  disableTelemetry: true,
  
  // Configuración de cache más conservadora
  cacheConfig: {
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  },
  
  // Configuración de polling más lenta
  pollingConfig: {
    priceUpdateInterval: 60 * 1000, // 1 minuto
    marketDataInterval: 120 * 1000, // 2 minutos
  },
  
  // Configuración de WebSocket
  websocketConfig: {
    reconnectAttempts: 3,
    reconnectDelay: 2000,
    timeout: 10000,
  },
  
  // Configuración de optimistic updates
  optimisticConfig: {
    enabled: true,
    maxRetries: 2,
    retryDelay: 3000,
  },
  
  // Configuración de error handling
  errorHandling: {
    showErrors: true,
    logErrors: true,
    retryOnError: false,
  },
}

// Función para obtener configuración basada en el entorno
export function getDevConfig() {
  if (import.meta.env.DEV) {
    return devConfig
  }
  
  // Configuración de producción
  return {
    disableBlockchainEvents: false,
    disableOptimisticUpdates: false,
    disableWebSocket: false,
    disableAnalytics: false,
    disableTelemetry: false,
    
    cacheConfig: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    },
    
    pollingConfig: {
      priceUpdateInterval: 30 * 1000,
      marketDataInterval: 60 * 1000,
    },
    
    websocketConfig: {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      timeout: 10000,
    },
    
    optimisticConfig: {
      enabled: true,
      maxRetries: 3,
      retryDelay: 2000,
    },
    
    errorHandling: {
      showErrors: false,
      logErrors: true,
      retryOnError: true,
    },
  }
}
