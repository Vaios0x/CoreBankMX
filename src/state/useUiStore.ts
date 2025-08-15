import { create } from 'zustand'
import { LANGUAGES, type LanguageConfig } from '../i18n/i18n'

type UiState = {
  isSidebarOpen: boolean
  language: 'en' | 'es'
  theme: 'dark' | 'light'
  setSidebar: (open: boolean) => void
  toggleSidebar: () => void
  setLanguage: (lang: 'en' | 'es') => void
  toggleTheme: () => void
  getLanguageConfig: () => LanguageConfig
}

export const useUiStore = create<UiState>((set, get) => ({
  isSidebarOpen: false,
  language: ((): 'en' | 'es' => {
    try {
      const saved = localStorage.getItem('core_neobank_language') as 'en' | 'es' | null
      return saved === 'es' || saved === 'en' ? saved : 'en'
    } catch {
      return 'en'
    }
  })(),
  theme: ((): 'dark' | 'light' => {
    try {
      const saved = localStorage.getItem('core_neobank_theme') as 'dark' | 'light' | null
      return saved === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })(),
  setSidebar: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setLanguage: (language) => {
    try {
      localStorage.setItem('core_neobank_language', language)
      const url = new URL(window.location.href)
      url.searchParams.set('lang', language)
      window.history.replaceState({}, '', url)
      
      // Aplicar configuración RTL al documento
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
    set({ language })
  },
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem('core_neobank_theme', next)
    } catch {}
    return { theme: next }
  }),
  getLanguageConfig: () => {
    const { language } = get()
    return LANGUAGES[language]
  }
}))


