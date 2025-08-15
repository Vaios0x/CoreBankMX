import { create } from 'zustand'

type UiState = {
  isSidebarOpen: boolean
  language: 'en' | 'es'
  theme: 'dark' | 'light'
  setSidebar: (open: boolean) => void
  toggleSidebar: () => void
  setLanguage: (lang: 'en' | 'es') => void
  toggleTheme: () => void
}

export const useUiStore = create<UiState>((set) => ({
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
  setSidebar: (open) => {
    console.log('🎯 setSidebar called with:', open)
    set({ isSidebarOpen: open })
    console.log('🎯 State updated, new isSidebarOpen will be:', open)
  },
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setLanguage: (language) => {
    try {
      localStorage.setItem('core_neobank_language', language)
      const url = new URL(window.location.href)
      url.searchParams.set('lang', language)
      window.history.replaceState({}, '', url)
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
}))


