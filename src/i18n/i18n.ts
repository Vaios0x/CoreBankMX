import en from './en.json'
import es from './es.json'
import { useUiStore } from '../state/useUiStore'

const dict = { en, es }

export function useI18n() {
  const { language } = useUiStore()
  return (path: string): string | string[] => {
    const parts = path.split('.')
    let cur: any = dict[language]
    for (const p of parts) cur = cur?.[p]
    return cur ?? path
  }
}

export function useTranslation() {
  const { language } = useUiStore()
  return {
    t: (path: string): string | string[] => {
      const parts = path.split('.')
      let cur: any = dict[language]
      for (const p of parts) cur = cur?.[p]
      return cur ?? path
    }
  }
}


