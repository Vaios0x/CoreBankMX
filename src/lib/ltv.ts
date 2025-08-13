export const MARKET_CONSTANTS = {
  targetLtv: 0.6,
  liquidationLtv: 0.8,
}

export function computeLtv(collateralUsd: number, debtUsd: number): number {
  if (collateralUsd <= 0) return 0
  return debtUsd / collateralUsd
}

export function computeHealthFactor(collateralUsd: number, debtUsd: number): number {
  if (debtUsd === 0) return Infinity
  const maxDebtUsd = collateralUsd * MARKET_CONSTANTS.liquidationLtv
  return maxDebtUsd / debtUsd
}


