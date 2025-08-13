import { NavLink } from 'react-router-dom'
import { useI18n } from '../../i18n/i18n'
import { motion } from 'framer-motion'
import { useUiStore } from '../../state/useUiStore'

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/dashboard', key: 'nav.dashboard' },
  { to: '/borrow', key: 'nav.borrow' },
  { to: '/repay', key: 'nav.repay' },
  { to: '/positions', key: 'nav.positions' },
  { to: '/liquidity', key: 'nav.liquidity' },
  { to: '/admin', key: 'nav.admin' },
]

export function SidebarNav() {
  const t = useI18n()
  const { isSidebarOpen } = useUiStore()
  return (
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
}

export default SidebarNav


