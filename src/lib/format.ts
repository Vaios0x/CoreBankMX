export function formatAmount(value: number | bigint, decimals = 2): string {
  const num = typeof value === 'bigint' ? Number(value) : value
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals }).format(num)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatUSD(value: number, decimals = 2): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: decimals }).format(value)
}

export function formatCurrency(value: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat(undefined, { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: decimals 
  }).format(value)
}

export function formatNumber(value: number | bigint, decimals = 2): string {
  const num = typeof value === 'bigint' ? Number(value) : value
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals }).format(num)
}


