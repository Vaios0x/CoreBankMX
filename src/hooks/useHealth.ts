import { useMemo } from 'react'
import { computeHealthFactor, computeLtv } from '../lib/ltv'

export function useHealth(collateralUsd: number, debtUsd: number) {
  return useMemo(() => {
    const ltv = computeLtv(collateralUsd, debtUsd)
    const hf = computeHealthFactor(collateralUsd, debtUsd)
    let status: 'safe' | 'warning' | 'danger' = 'safe'
    if (hf < 1.2) status = 'danger'
    else if (hf < 1.5) status = 'warning'
    return { ltv, hf, status }
  }, [collateralUsd, debtUsd])
}


