import { ConnectButton } from '../web3/ConnectButton'
import { useUiStore } from '../../state/useUiStore'
import { useAccount } from 'wagmi'
import AddressTag from '../web3/AddressTag'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useChainId, useSwitchChain, useDisconnect } from 'wagmi'
import { coreMainnet, coreTestnet } from '../../lib/chains'
import { useI18n } from '../../i18n/i18n'
import { NetworkSelector } from './NetworkSelector'

export function Header() {
  const { language, setLanguage, toggleSidebar, theme, toggleTheme } = useUiStore()
  const t = useI18n()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [isUserMenuOpen, setUserMenuOpen] = useState(false)
  const [isNetworkSelectorOpen, setNetworkSelectorOpen] = useState(false)
  const isMainnet = chainId === coreMainnet.id
  const networkLabel = isMainnet ? 'Core Mainnet' : 'Core Testnet'

  // Persist and mirror chain to URL when it changes
  useEffect(() => {
    try { localStorage.setItem('core_neobank_chain_id', String(chainId)) } catch {}
    const url = new URL(window.location.href)
    url.searchParams.set('chain', String(chainId))
    window.history.replaceState({}, '', url)
  }, [chainId])
  
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-ui bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 py-2 sm:py-3"
        >
          {/* Left side - Logo and menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              className="btn-ghost p-1.5 sm:p-2 motion-press"
              aria-label={t('header.toggle_sidebar') as string}
              onClick={toggleSidebar}
            >
              <span aria-hidden className="text-sm sm:text-base">☰</span>
            </motion.button>
            <motion.div whileHover={{ scale: 1.01 }} className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded bg-brand-500" aria-hidden />
              <Link to="/" className="font-semibold tracking-tight hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm sm:text-base">
                Banobs
              </Link>
            </motion.div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3">
            {/* Theme toggle */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => {
                toggleTheme()
                try {
                  const root = document.documentElement
                  const saved = localStorage.getItem('core_neobank_theme') as 'dark' | 'light' | null
                  if ((saved ?? 'dark') === 'dark') root.classList.add('dark')
                  else root.classList.remove('dark')
                } catch {}
              }}
              className="btn-outline px-1.5 py-1 sm:px-2 sm:py-1 text-xs sm:text-sm motion-press"
              aria-label={t('header.toggle_theme') as string}
            >
              {theme === 'dark' ? '☾' : '☀︎'}
            </motion.button>

            {/* Language toggle */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => {
                const next = language === 'en' ? 'es' : 'en'
                setLanguage(next)
                try { localStorage.setItem('core_neobank_language', next) } catch {}
                const url = new URL(window.location.href)
                url.searchParams.set('lang', next)
                window.history.replaceState({}, '', url)
              }}
              className="btn-outline px-1.5 py-1 sm:px-2 sm:py-1 text-xs sm:text-sm motion-press"
              aria-label={t('header.toggle_language') as string}
            >
              {language === 'en' ? 'ES' : 'EN'}
            </motion.button>

            {/* Network status - Desktop */}
            <div className="hidden lg:flex items-center gap-2 rounded-md border border-ui bg-ui-surface px-2 py-1 text-xs text-gray-300">
              <span className={`inline-block h-2 w-2 rounded-full ${isMainnet ? 'bg-green-500' : 'bg-yellow-400'}`} aria-hidden />
              <span aria-label={t('header.network_aria') as string} className="max-w-[160px] truncate" title={networkLabel}>
                {networkLabel}
              </span>
              {isConnected && (
                <span className="hidden items-center lg:inline-flex">
                  <span className="mx-1 text-ui-muted">·</span>
                  <AddressTag address={address} />
                </span>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={isPending}
                onClick={() => {
                  const targetId = isMainnet ? coreTestnet.id : coreMainnet.id
                  try { localStorage.setItem('core_neobank_chain_id', String(targetId)) } catch {}
                  const url = new URL(window.location.href)
                  url.searchParams.set('chain', String(targetId))
                  window.history.replaceState({}, '', url)
                  switchChain({ chainId: targetId })
                }}
                className="btn-outline px-2 py-0.5 motion-press"
                aria-label={isMainnet ? (t('header.switch_to_testnet') as string) : (t('header.switch_to_mainnet') as string)}
              >
                {isMainnet ? (t('header.to_testnet') as string) : (t('header.to_mainnet') as string)}
              </motion.button>
            </div>

            {/* Mobile network button */}
            <div className="lg:hidden">
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => setNetworkSelectorOpen(true)}
                className="btn-outline px-1.5 py-1 text-xs motion-press flex items-center gap-1"
                aria-label={t('network_selector.title') as string}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${isMainnet ? 'bg-green-500' : 'bg-yellow-400'}`} aria-hidden />
                <span className="truncate max-w-[50px]" title={networkLabel}>
                  {isMainnet ? 'Main' : 'Test'}
                </span>
                <span className="text-xs">▼</span>
              </motion.button>
            </div>

            {/* User menu compact */}
            {isConnected && (
              <div className="relative">
                <button
                  type="button"
                  className="btn-outline px-1.5 py-1 sm:px-2 sm:py-1 text-xs sm:text-sm motion-press"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 100)}
                >
                  ⋯
                </button>
                {isUserMenuOpen && (
                  <div role="menu" className="absolute right-0 z-50 mt-2 w-36 sm:w-44 rounded-md border border-ui bg-ui-surface p-1 text-sm shadow-lg">
                    <button
                      role="menuitem"
                      className="btn-ghost w-full justify-start px-2 py-1 text-left text-xs motion-press"
                      onClick={async () => { try { await navigator.clipboard.writeText(address ?? '') } catch {} setUserMenuOpen(false) }}
                    >
                      {t('header.copy_address')}
                    </button>
                    <button
                      role="menuitem"
                      className="btn-outline w-full justify-start px-2 py-1 text-left text-xs motion-press"
                      onClick={() => { disconnect(); setUserMenuOpen(false) }}
                    >
                      {t('header.disconnect')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Connect Button */}
            <ConnectButton />
          </div>

          {/* Live region for network changes */}
          <span className="sr-only" aria-live="polite" role="status">{networkLabel}</span>
        </motion.div>
      </header>

      {/* Network Selector Modal */}
      <NetworkSelector 
        isOpen={isNetworkSelectorOpen}
        onClose={() => setNetworkSelectorOpen(false)}
      />
    </>
  )
}

export default Header


