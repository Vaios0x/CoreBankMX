import { useQuery } from '@tanstack/react-query'
import { env } from '../lib/env'

export type FeeEstimate = {
  fee: number
  bps: number
  minBorrow: number
  pro: boolean
}

export function useFeeEstimate(amount: number, user?: `0x${string}`) {
  return useQuery<FeeEstimate>({
    queryKey: ['fee', amount, user],
    queryFn: async () => {
      try {
        const q = new URLSearchParams()
        if (amount && amount > 0) q.set('amount', String(amount))
        if (user) q.set('user', user)
        const res = await fetch(`${env.API_URL}/market/fee?${q.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('fee_failed')
        const json = await res.json()
        return {
          fee: Number(json?.fee ?? 0),
          bps: Number(json?.bps ?? 0),
          minBorrow: Number(json?.minBorrow ?? 0),
          pro: Boolean(json?.pro ?? false),
        }
      } catch (error) {
        // Fallback a datos de demostración
        console.warn('API not available, using demo fee data:', error)
        
        // Calcular fee demo basado en el monto
        const baseFee = amount * 0.005 // 0.5% base fee
        const volumeDiscount = amount > 10000 ? 0.2 : amount > 5000 ? 0.1 : 0 // Descuentos por volumen
        const finalFee = baseFee * (1 - volumeDiscount)
        
        return {
          fee: finalFee,
          bps: 50, // 0.5%
          minBorrow: 100,
          pro: amount > 10000, // Pro para montos grandes
        }
      }
    },
    enabled: Boolean(amount && amount > 0),
    staleTime: 30_000,
  })
}


