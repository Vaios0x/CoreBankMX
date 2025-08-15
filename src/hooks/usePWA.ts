import { useState, useEffect, useCallback } from 'react'

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isInstalled: boolean
  isInstallable: boolean
  isOnline: boolean
  isStandalone: boolean
  hasServiceWorker: boolean
  hasPushSupport: boolean
  hasNotificationSupport: boolean
  hasBackgroundSync: boolean
  hasIndexedDB: boolean
  installPrompt: PWAInstallPrompt | null
  registration: ServiceWorkerRegistration | null
}

interface PWAHandlers {
  install: () => Promise<void>
  requestNotificationPermission: () => Promise<NotificationPermission>
  sendNotification: (title: string, options?: NotificationOptions) => Promise<void>
  syncOfflineTransactions: () => Promise<void>
  clearCache: () => Promise<void>
  updateApp: () => Promise<void>
}

export function usePWA(): [PWAState, PWAHandlers] {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushSupport: 'PushManager' in window,
    hasNotificationSupport: 'Notification' in window,
    hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    hasIndexedDB: 'indexedDB' in window,
    installPrompt: null,
    registration: null
  })

  // Detectar prompt de instalación
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setState(prev => ({
        ...prev,
        installPrompt: e as PWAInstallPrompt,
        isInstallable: true
      }))
    }

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Detectar cambios en el estado de conexión
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Registrar Service Worker
  useEffect(() => {
    if (state.hasServiceWorker) {
      registerServiceWorker()
    }
  }, [state.hasServiceWorker])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      setState(prev => ({ ...prev, registration }))

      // Detectar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              showUpdateNotification()
            }
          })
        }
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  const install = useCallback(async () => {
    if (state.installPrompt) {
      try {
        await state.installPrompt.prompt()
        const { outcome } = await state.installPrompt.userChoice
        
        if (outcome === 'accepted') {
          setState(prev => ({
            ...prev,
            isInstalled: true,
            isInstallable: false,
            installPrompt: null
          }))
        }
      } catch (error) {
        console.error('Installation failed:', error)
      }
    }
  }, [state.installPrompt])

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.hasNotificationSupport) {
      throw new Error('Notifications not supported')
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      throw error
    }
  }, [state.hasNotificationSupport])

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!state.hasNotificationSupport) {
      throw new Error('Notifications not supported')
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    try {
      if (state.registration) {
        await state.registration.showNotification(title, {
          icon: '/assets/Logo.png',
          badge: '/assets/badge.png',
          vibrate: [200, 100, 200],
          ...options
        })
      } else {
        new Notification(title, {
          icon: '/assets/Logo.png',
          ...options
        })
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }, [state.hasNotificationSupport, state.registration])

  const syncOfflineTransactions = useCallback(async () => {
    if (!state.hasBackgroundSync || !state.registration) {
      throw new Error('Background sync not supported')
    }

    try {
      await state.registration.sync.register('background-sync-transaction')
    } catch (error) {
      console.error('Error registering background sync:', error)
      throw error
    }
  }, [state.hasBackgroundSync, state.registration])

  const clearCache = useCallback(async () => {
    if (!state.hasServiceWorker) {
      throw new Error('Service Worker not supported')
    }

    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      
      // Recargar la página para aplicar cambios
      window.location.reload()
    } catch (error) {
      console.error('Error clearing cache:', error)
      throw error
    }
  }, [state.hasServiceWorker])

  const updateApp = useCallback(async () => {
    if (!state.registration) {
      throw new Error('Service Worker not registered')
    }

    try {
      await state.registration.update()
      window.location.reload()
    } catch (error) {
      console.error('Error updating app:', error)
      throw error
    }
  }, [state.registration])

  const showUpdateNotification = () => {
    sendNotification('Nueva versión disponible', {
      body: 'Haz clic para actualizar la aplicación',
      tag: 'update-available',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Actualizar',
          icon: '/assets/update.png'
        }
      ]
    })
  }

  return [
    state,
    {
      install,
      requestNotificationPermission,
      sendNotification,
      syncOfflineTransactions,
      clearCache,
      updateApp
    }
  ]
}

// Hook para manejar transacciones offline
export function useOfflineTransactions() {
  const [offlineTransactions, setOfflineTransactions] = useState<any[]>([])

  const saveOfflineTransaction = useCallback(async (transaction: any) => {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB not supported')
    }

    try {
      const db = await openDB()
      const id = await db.add('offlineTransactions', {
        ...transaction,
        timestamp: Date.now()
      })
      
      setOfflineTransactions(prev => [...prev, { ...transaction, id }])
      return id
    } catch (error) {
      console.error('Error saving offline transaction:', error)
      throw error
    }
  }, [])

  const getOfflineTransactions = useCallback(async () => {
    if (!('indexedDB' in window)) {
      return []
    }

    try {
      const db = await openDB()
      const transactions = await db.getAll('offlineTransactions')
      setOfflineTransactions(transactions)
      return transactions
    } catch (error) {
      console.error('Error getting offline transactions:', error)
      return []
    }
  }, [])

  const removeOfflineTransaction = useCallback(async (id: number) => {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB not supported')
    }

    try {
      const db = await openDB()
      await db.delete('offlineTransactions', id)
      setOfflineTransactions(prev => prev.filter(tx => tx.id !== id))
    } catch (error) {
      console.error('Error removing offline transaction:', error)
      throw error
    }
  }, [])

  const clearOfflineTransactions = useCallback(async () => {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB not supported')
    }

    try {
      const db = await openDB()
      await db.clear('offlineTransactions')
      setOfflineTransactions([])
    } catch (error) {
      console.error('Error clearing offline transactions:', error)
      throw error
    }
  }, [])

  // Cargar transacciones al montar
  useEffect(() => {
    getOfflineTransactions()
  }, [getOfflineTransactions])

  return {
    offlineTransactions,
    saveOfflineTransaction,
    getOfflineTransactions,
    removeOfflineTransaction,
    clearOfflineTransactions
  }
}

// Función auxiliar para abrir IndexedDB
function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('DefiAppDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Store para transacciones offline
      if (!db.objectStoreNames.contains('offlineTransactions')) {
        const store = db.createObjectStore('offlineTransactions', { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('type', 'type', { unique: false })
      }
      
      // Store para datos de usuario
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData', { keyPath: 'key' })
      }
    }
  })
}
