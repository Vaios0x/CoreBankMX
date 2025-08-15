import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { ToastViewport } from '../ui/Toast'
import { SidebarNav } from './SidebarNav'
import { OracleStatus } from '../market/OracleStatus'
import { LegalBanner } from './LegalBanner'
import { useUiStore } from '../../state/useUiStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { coreMainnet, coreTestnet } from '../../lib/chains'

export function AppShell({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setLanguage, theme, setSidebar } = useUiStore()
  const maintenance = import.meta.env.VITE_MAINTENANCE_MSG as string | undefined
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [searchParams] = useSearchParams()

  // Apply querystring overrides (priority over localStorage)
  useEffect(() => {
    try {
      const lang = searchParams.get('lang')
      if (lang === 'en' || lang === 'es') {
        setLanguage(lang)
      }

      const chainParam = searchParams.get('chain')
      const target = chainParam
        ? Number(chainParam)
        : Number(localStorage.getItem('core_neobank_chain_id') ?? NaN)
      if (target && target !== chainId && (target === coreMainnet.id || target === coreTestnet.id)) {
        localStorage.setItem('core_neobank_chain_id', String(target))
        switchChain({ chainId: target })
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Ensure initial theme class is applied to <html>
  useEffect(() => {
    try {
      const root = document.documentElement
      if (theme === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
    } catch {}
  }, [theme])

  // Cerrar sidebar cuando se hace clic fuera de él en móviles
  const handleOverlayClick = () => {
    if (window.innerWidth < 768) {
      setSidebar(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 dark:text-gray-100">
      <LegalBanner />
      <Header />
      <div className="flex container mx-auto relative">
        {/* Sidebar - Responsive behavior */}
        <div className="relative">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <SidebarNav />
          </div>
          
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                {/* Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={handleOverlayClick}
                  aria-hidden="true"
                />
                
                {/* Mobile Sidebar */}
                <motion.div
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="fixed left-0 top-12 h-[calc(100vh-48px)] w-70 border-r border-ui bg-ui-surface p-3 z-50 md:hidden"
                >
                  <SidebarNav />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-2 sm:p-3 lg:p-4" role="main" aria-label="Main content">
          {maintenance && (
            <div className="mx-2 sm:mx-4 mb-2 rounded-md border border-red-800 bg-red-900/30 px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-red-200" role="status">
              {maintenance}
            </div>
          )}
          <OracleStatus />
          <AnimatePresence mode="wait">
            <motion.div
              key={isSidebarOpen ? 'open' : 'closed'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastViewport />
      <Footer />
    </div>
  )
}

export default AppShell


