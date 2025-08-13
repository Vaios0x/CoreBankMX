import { useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import CollateralVault from '../abi/CollateralVault.json'
import LoanManager from '../abi/LoanManager.json'
import StakingVault from '../abi/StakingVault.json'
import { env } from '../lib/env'

export function useContracts() {
  const { address } = useAccount()
  const contracts = useMemo(
    () => ({
      collateralVault: { address: env.COLLATERAL_VAULT as `0x${string}`, abi: CollateralVault as any },
      loanManager: { address: env.LOAN_MANAGER as `0x${string}`, abi: LoanManager as any },
      stakingVault: { address: env.STAKING_VAULT as `0x${string}`, abi: StakingVault as any },
    }),
    [],
  )

  return { address, ...contracts, useReadContract, useWriteContract }
}


