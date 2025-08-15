import { NavLink } from 'react-router-dom'
import { useI18n } from '../../i18n/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '../../state/useUiStore'
import { useEffect, useState } from 'react'

const links = [
  { to: '/', key: 'nav.home', icon: '🏠' },
  { to: '/dashboard', key: 'nav.dashboard', icon: '📊' },
  { to: '/borrow', key: 'nav.borrow', icon: '💰' },
  { to: '/repay', key: 'nav.repay', icon: '💳' },
  { to: '/positions', key: 'nav.positions', icon: '📋' },
  { to: '/liquidity', key: 'nav.liquidity', icon: '💧' },
  { to: '/remittances', key: 'nav.remittances', icon: '💸' },
  { to: '/offramp', key: 'nav.offramp', icon: '🏦' },
  { to: '/settings', key: 'nav.settings', icon: '⚙️' },
  { to: '/analytics', key: 'nav.analytics', icon: '📈' },
  { to: '/admin', key: 'nav.admin', icon: '🔧' },
]

export function SidebarNav() {
  const t = useI18n()
  const { isSidebarOpen, setSidebar } = useUiStore()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on mobile when clicking a link
  const handleNavClick = () => {
    if (isMobile && isSidebarOpen) {
      setSidebar(false)
    }
  }

  // Close sidebar when clicking overlay
  const handleOverlayClick = () => {
    if (isMobile && isSidebarOpen) {
      setSidebar(false)
    }
  }

  // Desktop sidebar
  const DesktopSidebar = () => (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isSidebarOpen ? 224 : 64 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="sticky top-12 h-[calc(100vh-48px)] border-r border-ui bg-ui-surface p-3"
      aria-label="Sidebar"
    >
      <nav aria-label="Main navigation">
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `group flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300'} transition-colors`
                }
              >
                <motion.span layout className="inline-block h-2 w-2 rounded-full bg-gray-700 group-[.active]:bg-brand-500" aria-hidden />
                <motion.span
                  initial={false}
                  animate={{ opacity: isSidebarOpen ? 1 : 0 }}
                  className={!isSidebarOpen ? 'sr-only' : ''}
                >
                  {t(l.key)}
                </motion.span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </motion.aside>
  )

  // Mobile sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-0 top-0 z-50 h-full w-64 bg-ui-surface border-r border-ui lg:hidden"
            aria-label="Mobile sidebar"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ui">
              <div className="flex items-center gap-2">
                <img src="/src/assets/Logo2.svg" alt="Banobs Logo" className="h-8 w-8" />
                <h2 className="text-lg font-semibold">{t('nav.title') as string}</h2>
              </div>
              <button
                onClick={() => setSidebar(false)}
                className="p-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={t('nav.close_sidebar') as string}
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4" aria-label="Main navigation">
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-4 py-3 text-base hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300'} transition-colors`
                      }
                    >
                      <span className="text-lg" aria-hidden="true">{l.icon}</span>
                      <span className="font-medium">{t(l.key)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ui">
              <div className="text-xs text-gray-400 text-center">
                {t('nav.mobile_footer') as string}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>
      
      {/* Mobile sidebar */}
      <MobileSidebar />
    </>
  )
}

export default SidebarNav


