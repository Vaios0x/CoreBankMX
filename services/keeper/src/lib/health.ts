export function computeHealthFactor(collateralUsd: number, debtUsd: number, liquidationLtv: number) {
  if (debtUsd === 0) return Number.POSITIVE_INFINITY
  const maxDebt = collateralUsd * liquidationLtv
  return maxDebt / debtUsd
}


