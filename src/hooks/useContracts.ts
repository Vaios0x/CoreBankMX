import { useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import CollateralVault from '../abi/CollateralVault.json'
import LoanManager from '../abi/LoanManager.json'
import StakingVault from '../abi/StakingVault.json'
import { CONTRACTS } from '../lib/contracts'

export function useContracts() {
  const { address } = useAccount()
  const contracts = useMemo(
    () => ({
      collateralVault: { address: CONTRACTS.CollateralVault as `0x${string}`, abi: CollateralVault as any },
      loanManager: { address: CONTRACTS.LoanManager as `0x${string}`, abi: LoanManager as any },
      stakingVault: { address: CONTRACTS.DualStakingVault as `0x${string}`, abi: StakingVault as any },
      liquidationModule: { address: CONTRACTS.LiquidationModule as `0x${string}`, abi: [] as any },
      feeController: { address: CONTRACTS.FeeController as `0x${string}`, abi: [] as any },
      oracleRouter: { address: CONTRACTS.OracleRouter as `0x${string}`, abi: [] as any },
    }),
    [],
  )

  return { address, ...contracts, useReadContract, useWriteContract }
}


