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
        console.error('Fee estimation failed:', error)
        throw new Error('Fee estimation failed')
      }
    },
    enabled: Boolean(amount && amount > 0),
    staleTime: 30_000,
  })
}


