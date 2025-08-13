import { create } from 'zustand'

export type Position = {
  id: string
  collateralBtc: number
  debtUsdt: number
}

type PositionsState = {
  positions: Position[]
  setPositions: (p: Position[]) => void
}

export const usePositionsStore = create<PositionsState>((set) => ({
  positions: [],
  setPositions: (positions) => set({ positions }),
}))


