import React, { useState, useEffect } from 'react'
import { usePWA } from '../../hooks/usePWA'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Smartphone, Wifi, WifiOff } from 'lucide-react'

export function InstallPrompt() {
  const [pwaState, pwaHandlers] = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Mostrar el prompt después de 3 segundos si es instalable
    const timer = setTimeout(() => {
      if (pwaState.isInstallable && !pwaState.isInstalled) {
        setIsVisible(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [pwaState.isInstallable, pwaState.isInstalled])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await pwaHandlers.install()
      setIsVisible(false)
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Guardar en localStorage para no mostrar de nuevo por 24 horas
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Verificar si fue descartado recientemente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)
      
      if (hoursSinceDismissed < 24) {
        setIsVisible(false)
      } else {
        localStorage.removeItem('pwa-install-dismissed')
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Instalar DeFi Core</h3>
                  <p className="text-blue-100 text-sm">Acceso rápido desde tu pantalla de inicio</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Experiencia nativa</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Como una app móvil real</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Funciona offline</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accede sin conexión</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <WifiOff className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Notificaciones push</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mantente informado</p>
                </div>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${pwaState.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {pwaState.isOnline ? 'En línea' : 'Sin conexión'}
                </span>
              </div>
              <div className="text-gray-500">
                {pwaState.hasServiceWorker ? '✓ PWA Ready' : '⚠ PWA no disponible'}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Más tarde
              </button>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Instalando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Instalar</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Componente para mostrar estado de conexión
export function ConnectionStatus() {
  const [pwaState] = usePWA()
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    if (!pwaState.isOnline) {
      setShowStatus(true)
      const timer = setTimeout(() => setShowStatus(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [pwaState.isOnline])

  if (!showStatus) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-medium">Sin conexión</p>
            <p className="text-sm text-red-100">Algunas funciones pueden no estar disponibles</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Componente para mostrar actualización disponible
export function UpdatePrompt() {
  const [pwaState, pwaHandlers] = usePWA()
  const [showUpdate, setShowUpdate] = useState(false)

  const handleUpdate = async () => {
    try {
      await pwaHandlers.updateApp()
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  if (!showUpdate) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nueva versión disponible</p>
              <p className="text-sm text-blue-100">Actualiza para obtener las últimas funciones</p>
            </div>
            <button
              onClick={handleUpdate}
              className="bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
