// Configuración del Service Worker
window.SW_CONFIG = {
  // Deshabilitar SW en desarrollo
  enabled: process.env.NODE_ENV === 'production',
  
  // Configuración de cache
  cache: {
    static: 'static-v1.0.0',
    dynamic: 'dynamic-v1.0.0',
    api: 'api-v1.0.0'
  },
  
  // Rutas a excluir del cache
  excludeFromCache: [
    'coinbase.com',
    'analytics',
    'tracking',
    'google-analytics',
    'gtag'
  ],
  
  // Métodos HTTP a excluir
  excludeMethods: ['HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development'
}

// Función para registrar el Service Worker
export function registerServiceWorker() {
  if (!window.SW_CONFIG.enabled) {
    console.log('[SW] Service Worker disabled in development mode')
    return
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error)
        })
    })
  }
}

// Función para desregistrar el Service Worker
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
        console.log('[SW] Service Worker unregistered')
      }
    })
  }
}
