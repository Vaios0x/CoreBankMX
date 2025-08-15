import en from './en.json'
import es from './es.json'
import { useUiStore } from '../state/useUiStore'

// Configuración de idiomas con soporte RTL
export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  locale: string
  currency: string
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
  }
  dateFormat: {
    short: string
    long: string
    time: string
  }
}

export const LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-US',
    currency: 'USD',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '$'
    },
    dateFormat: {
      short: 'MM/dd/yyyy',
      long: 'MMMM dd, yyyy',
      time: 'HH:mm'
    }
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    locale: 'es-MX',
    currency: 'MXN',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '$'
    },
    dateFormat: {
      short: 'dd/MM/yyyy',
      long: 'dd de MMMM de yyyy',
      time: 'HH:mm'
    }
  }
}

const dict = { en, es }

// Hook principal de internacionalización
export function useI18n() {
  const { language } = useUiStore()
  
  return (path: string): string | string[] => {
    const parts = path.split('.')
    let cur: any = dict[language]
    for (const p of parts) cur = cur?.[p]
    return cur ?? path
  }
}

// Hook para obtener configuración de idioma
export function useI18nConfig() {
  const { language } = useUiStore()
  const config = LANGUAGES[language]
  
  return {
    config,
    language,
    direction: config.direction,
    locale: config.locale
  }
}

// Hook de traducción simple (mantiene compatibilidad)
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

// Funciones de formateo localizado
export function useFormatters() {
  const { config } = useI18nConfig()
  
  const formatNumber = (value: number | bigint, options?: Intl.NumberFormatOptions): string => {
    const num = typeof value === 'bigint' ? Number(value) : value
    return new Intl.NumberFormat(config.locale, {
      maximumFractionDigits: 2,
      ...options
    }).format(num)
  }

  const formatCurrency = (value: number, currency?: string, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency || config.currency,
      maximumFractionDigits: 2,
      ...options
    }).format(value)
  }

  const formatPercent = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(config.locale, {
      style: 'percent',
      maximumFractionDigits: 2,
      ...options
    }).format(value / 100)
  }

  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return new Intl.DateTimeFormat(config.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(dateObj)
  }

  const formatTime = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return new Intl.DateTimeFormat(config.locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(dateObj)
  }

  const formatDateTime = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return new Intl.DateTimeFormat(config.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(dateObj)
  }

  const formatRelativeTime = (date: Date | string | number): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
    
    const rtf = new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' })
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second')
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
    }
  }

  return {
    formatNumber,
    formatCurrency,
    formatPercent,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    config
  }
}

// Hook para manejo de dirección RTL
export function useRTL() {
  const { direction } = useI18nConfig()
  
  return {
    direction,
    isRTL: direction === 'rtl',
    isLTR: direction === 'ltr',
    // Clases CSS para RTL
    rtlClasses: {
      textAlign: direction === 'rtl' ? 'text-right' : 'text-left',
      flexDirection: direction === 'rtl' ? 'flex-row-reverse' : 'flex-row',
      marginStart: direction === 'rtl' ? 'mr' : 'ml',
      marginEnd: direction === 'rtl' ? 'ml' : 'mr',
      paddingStart: direction === 'rtl' ? 'pr' : 'pl',
      paddingEnd: direction === 'rtl' ? 'pl' : 'pr',
      borderStart: direction === 'rtl' ? 'border-r' : 'border-l',
      borderEnd: direction === 'rtl' ? 'border-l' : 'border-r'
    }
  }
}


