import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { ToastViewport } from '../ui/Toast'
import { SidebarNav } from './SidebarNav'
import { OracleStatus } from '../market/OracleStatus'
import { LegalBanner } from './LegalBanner'
import { useUiStore } from '../../state/useUiStore'
import { LANGUAGES } from '../../i18n/i18n'

import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { coreMainnet, coreTestnet } from '../../lib/chains'

export function AppShell({ children }: { children: ReactNode }) {
  const { setLanguage, theme, language } = useUiStore()
  const maintenance = import.meta.env.VITE_MAINTENANCE_MSG as string | undefined
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [searchParams] = useSearchParams()

  // Aplicar configuración RTL y dirección al inicializar
  useEffect(() => {
    try {
      const config = LANGUAGES[language]
      const root = document.documentElement
      root.setAttribute('dir', config.direction)
      root.setAttribute('lang', config.locale)
      
      // Aplicar clases CSS para RTL
      if (config.direction === 'rtl') {
        root.classList.add('rtl')
        root.classList.remove('ltr')
      } else {
        root.classList.add('ltr')
        root.classList.remove('rtl')
      }
    } catch {}
  }, [language])

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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 dark:text-gray-100">
      <LegalBanner />
      <Header />
      <div className="flex container mx-auto">
        <SidebarNav />
        <main className="flex-1 p-2 sm:p-3 lg:p-4" role="main" aria-label="Main content">
          {maintenance && (
            <div className="mx-2 sm:mx-4 mb-2 rounded-md border border-red-800 bg-red-900/30 px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-red-200" role="status">
              {maintenance}
            </div>
          )}
          <OracleStatus />
          {children}
        </main>
      </div>
      <ToastViewport />
      <Footer />
    </div>
  )
}

export default AppShell


