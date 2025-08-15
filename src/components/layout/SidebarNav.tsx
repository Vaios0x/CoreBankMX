import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '../../state/useUiStore'
import { useEffect, useState } from 'react'

// Estructura de menú organizada con submenús
const menuStructure = [
  {
    id: 'main',
    title: 'Principal',
    items: [
      { to: '/', key: 'nav.home', icon: '🏠' },
      { to: '/dashboard', key: 'nav.dashboard', icon: '📊' },
    ]
  },
  {
    id: 'lending',
    title: 'Préstamos',
    items: [
      { to: '/borrow', key: 'nav.borrow', icon: '💰' },
      { to: '/repay', key: 'nav.repay', icon: '💳' },
      { to: '/positions', key: 'nav.positions', icon: '📋' },
      { to: '/liquidity', key: 'nav.liquidity', icon: '💧' },
    ]
  },
  {
    id: 'services',
    title: 'Servicios',
    items: [
      { to: '/remittances', key: 'nav.remittances', icon: '💸' },
      { to: '/offramp', key: 'nav.offramp', icon: '🏦' },
    ]
  },
  {
    id: 'features',
    title: 'Características',
    items: [
      { to: '/referral', key: 'nav.referral', icon: '👥' },
      { to: '/loyalty', key: 'nav.loyalty', icon: '🎖️' },
      { to: '/education', key: 'nav.education', icon: '📚' },
    ]
  },
  {
    id: 'docs',
    title: 'Documentación',
    items: [
      { to: '/docs', key: 'nav.docs', icon: '📖' },
      { to: '/docs/protocol', key: 'nav.docs_protocol', icon: '📋' },
      { to: '/docs/api', key: 'nav.docs_api', icon: '🔌' },
      { to: '/docs/status', key: 'nav.docs_status', icon: '📊' },
    ]
  },
  {
    id: 'admin',
    title: 'Administración',
    items: [
      { to: '/support', key: 'nav.support', icon: '💬' },
      { to: '/settings', key: 'nav.settings', icon: '⚙️' },
      { to: '/analytics', key: 'nav.analytics', icon: '📈' },
      { to: '/admin', key: 'nav.admin', icon: '🔧' },
    ]
  }
]

export function SidebarNav() {
  const t = useI18n()
  const { isSidebarOpen, setSidebar } = useUiStore()
  const [isMobile, setIsMobile] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['main'])
  const location = useLocation()

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-expand section based on current route
  useEffect(() => {
    const currentSection = menuStructure.find(section => 
      section.items.some(item => item.to === location.pathname)
    )
    if (currentSection && !expandedSections.includes(currentSection.id)) {
      setExpandedSections(prev => [...prev, currentSection.id])
    }
  }, [location.pathname, expandedSections])

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

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

  // Render menu item
  const renderMenuItem = (item: any, isSubItem = false) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        onClick={handleNavClick}
        className={({ isActive }) =>
          `group flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
            isActive ? 'bg-gray-800 text-white' : 'text-gray-300'
          } ${isSubItem ? 'ml-4' : ''} relative`
        }
        title={!isSidebarOpen ? String(t(item.key)) : undefined}
      >
        <motion.span 
          layout 
          className={`inline-block rounded-full bg-gray-700 group-[.active]:bg-brand-500 ${
            isSubItem ? (isSidebarOpen ? 'h-1.5 w-1.5' : 'h-2 w-2') : (isSidebarOpen ? 'h-2 w-2' : 'h-3 w-3')
          }`} 
          aria-hidden 
        />
        <motion.span
          initial={false}
          animate={{ opacity: isSidebarOpen ? 1 : 0 }}
          className={!isSidebarOpen ? 'sr-only' : ''}
        >
          {t(item.key)}
        </motion.span>
        
        {/* Tooltip for collapsed sidebar */}
        {!isSidebarOpen && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {String(t(item.key))}
          </div>
        )}
      </NavLink>
    </li>
  )

  // Render menu section
  const renderMenuSection = (section: any) => {
    const isExpanded = expandedSections.includes(section.id)
    const hasActiveItem = section.items.some((item: any) => item.to === location.pathname)

    return (
      <div key={section.id} className="mb-2">
        {/* Section Header - Always visible, even when collapsed */}
        <button
          onClick={() => toggleSection(section.id)}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
            hasActiveItem ? 'text-brand-400 bg-brand-500/10' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <motion.span
            initial={false}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            className={!isSidebarOpen ? 'sr-only' : ''}
          >
            {section.title}
          </motion.span>
          
          {/* Section indicator dot - Always visible */}
          <motion.span
            layout
            className={`inline-block rounded-full ${
              hasActiveItem ? 'bg-brand-500' : 'bg-gray-600'
            } ${isSidebarOpen ? 'h-2 w-2' : 'h-3 w-3'}`}
            aria-hidden
          />
          

        </button>

        {/* Section Items - Show all items when sidebar is collapsed */}
        <AnimatePresence>
          {(isExpanded || !isSidebarOpen) && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-1 overflow-hidden"
            >
              {section.items.map((item: any) => renderMenuItem(item, isSidebarOpen))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Desktop sidebar
  const DesktopSidebar = () => (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isSidebarOpen ? 240 : 64 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="sticky top-12 h-[calc(100vh-48px)] border-r border-ui bg-ui-surface p-3 overflow-y-auto"
      aria-label="Sidebar"
    >
      <nav aria-label="Main navigation">
        <div className="space-y-1">
          {menuStructure.map(renderMenuSection)}
        </div>
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
            className="fixed left-0 top-0 z-50 h-full w-72 bg-ui-surface border-r border-ui lg:hidden overflow-y-auto"
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
              <div className="space-y-4">
                {menuStructure.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {section.items.map((item: any) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                              `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                                isActive ? 'bg-gray-800 text-white' : 'text-gray-300'
                              }`
                            }
                          >
                            <span className="text-base" aria-hidden="true">{item.icon}</span>
                            <span className="font-medium">{t(item.key)}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ui bg-ui-surface">
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


