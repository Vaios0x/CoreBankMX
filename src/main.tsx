import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppProviders } from './app/providers'
import { AnimatedRoutes } from './app/routes'

// Configuración del Service Worker
if (import.meta.env.PROD && !import.meta.env.DEV) {
  // Solo registrar SW en producción
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
} else {
  // Deshabilitar SW en desarrollo
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
        console.log('[SW] Service Worker unregistered for development')
      }
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AnimatedRoutes />
    </AppProviders>
  </StrictMode>,
)
