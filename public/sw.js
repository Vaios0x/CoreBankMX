const CACHE_NAME = 'defi-app-v1.0.0'
const STATIC_CACHE = 'static-v1.0.0'
const DYNAMIC_CACHE = 'dynamic-v1.0.0'
const API_CACHE = 'api-v1.0.0'

// Archivos estáticos críticos (solo los que realmente existen)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
]

// Rutas de API para cache
const API_ROUTES = [
  '/api/oracle/',
  '/api/market/',
  '/api/positions/',
  '/api/offramp/',
  '/api/remittances/'
]

// Dominios a excluir completamente del cache
const EXCLUDED_DOMAINS = [
  'rpc.test2.btcs.network',
  'rpc.btcs.network',
  'rpc.core.org',
  'coinbase.com',
  'analytics',
  'tracking',
  'google-analytics',
  'gtag',
  'localhost:3001', // API local
  '127.0.0.1:3001'
]

// Estrategias de cache
const CACHE_STRATEGIES = {
  STATIC_FIRST: 'static-first',
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  NETWORK_ONLY: 'network-only'
}

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        // Solo cachear assets que realmente existen
        return cache.addAll(STATIC_ASSETS.filter(asset => {
          // Filtrar assets que sabemos que existen
          return asset === '/' || asset === '/index.html' || asset === '/manifest.json'
        }))
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error)
        // Continuar incluso si hay errores de cache
        return self.skipWaiting()
      })
  )
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Interceptación de requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // No cachear requests que no son GET
  if (request.method !== 'GET') {
    event.respondWith(fetch(request))
    return
  }
  
  // Excluir completamente dominios de blockchain y RPC
  if (isExcludedDomain(url.hostname)) {
    event.respondWith(fetch(request))
    return
  }
  
  // No cachear requests a servicios externos problemáticos
  if (url.hostname.includes('coinbase.com') || 
      url.hostname.includes('analytics') ||
      url.hostname.includes('tracking') ||
      url.hostname.includes('rpc.') ||
      url.hostname.includes('btcs.network')) {
    event.respondWith(fetch(request))
    return
  }
  
  // Estrategia para archivos estáticos
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  
  // Estrategia para APIs
  if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }
  
  // Estrategia para otros recursos
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// Estrategia Cache First (mejorada)
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      // Solo cachear responses exitosas
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('[SW] Cache first error:', error)
    // Retornar una respuesta de error más amigable
    return new Response('Content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Estrategia Network First (mejorada)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      // Solo cachear responses exitosas
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback para páginas
    if (request.destination === 'document') {
      return caches.match('/index.html')
    }
    
    return new Response('Offline content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Funciones auxiliares (mejoradas)
function isStaticAsset(pathname) {
  return STATIC_ASSETS.includes(pathname) ||
         pathname.startsWith('/assets/') ||
         pathname.startsWith('/static/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico')
}

function isApiRequest(pathname) {
  return API_ROUTES.some(route => pathname.startsWith(route))
}

function isExcludedDomain(hostname) {
  return EXCLUDED_DOMAINS.some(domain => hostname.includes(domain))
}

// Background Sync para transacciones offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-transaction') {
    event.waitUntil(processOfflineTransactions())
  }
})

async function processOfflineTransactions() {
  try {
    const db = await openDB()
    const offlineTransactions = await db.getAll('offlineTransactions')
    
    for (const transaction of offlineTransactions) {
      try {
        await processTransaction(transaction)
        await db.delete('offlineTransactions', transaction.id)
      } catch (error) {
        console.error('[SW] Error processing offline transaction:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Error in background sync:', error)
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de DeFi',
    icon: '/src/assets/Logo.png',
    badge: '/src/assets/Logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/src/assets/Logo.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/src/assets/Logo.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('DeFi App', options)
  )
})

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'close') {
    // Solo cerrar la notificación
  } else {
    // Click en el body de la notificación
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// IndexedDB para transacciones offline
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DefiAppDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Store para transacciones offline
      if (!db.objectStoreNames.contains('offlineTransactions')) {
        const store = db.createObjectStore('offlineTransactions', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('type', 'type', { unique: false })
      }
      
      // Store para datos de usuario
      if (!db.objectStoreNames.contains('userData')) {
        const store = db.createObjectStore('userData', { keyPath: 'key' })
      }
    }
  })
}

// Procesar transacción
async function processTransaction(transaction) {
  // Aquí implementarías la lógica para procesar la transacción
  // cuando el usuario vuelve a estar online
  console.log('[SW] Processing offline transaction:', transaction)
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Enviar notificación de éxito
  await self.registration.showNotification('Transacción Procesada', {
    body: `La transacción ${transaction.type} ha sido procesada exitosamente`,
    icon: '/src/assets/Logo.png'
  })
}
