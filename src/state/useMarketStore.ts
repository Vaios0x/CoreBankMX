import { create } from 'zustand'

type MarketParams = {
  baseRate: number
  targetLtv: number
  liquidationLtv: number
  tvlUsd: number
}

type MarketState = MarketParams & {
  setParams: (p: Partial<MarketParams>) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  baseRate: 0.05,
  targetLtv: 0.6,
  liquidationLtv: 0.8,
  tvlUsd: 1_000_000,
  setParams: (p) => set((s) => ({ ...s, ...p })),
}))


