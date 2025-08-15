import { useFormatters } from '../i18n/i18n'

// Funciones de formateo legacy (mantienen compatibilidad)
export function formatAmount(value: number | bigint, decimals = 2): string {
  const num = typeof value === 'bigint' ? Number(value) : value
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(num)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatPercentDecimal(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatUSD(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: decimals }).format(value)
}

export function formatCurrency(value: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: decimals 
  }).format(value)
}

export function formatNumber(value: number | bigint, decimals = 2): string {
  const num = typeof value === 'bigint' ? Number(value) : value
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(num)
}

// Hook para usar formateo localizado
export function useLocalizedFormat() {
  return useFormatters()
}

// Funciones utilitarias para formateo específico
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

export function formatCompactCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address) return ''
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}


