import { CONTRACTS } from '../lib/contracts'
import { env } from '../lib/env'
import { useWriteContract, usePublicClient } from 'wagmi'
import { parseEther, type Abi } from 'viem'

import MockERC20Abi from '../abi/MockERC20.json'
import StakingVaultAbi from '../abi/StakingVault.json'

export function useStaking() {
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  function toWei(amount: number): bigint {
    return parseEther(String(amount))
  }

  async function getStakeAsset(): Promise<`0x${string}`> {
    if (!publicClient) throw new Error('No client')
    const token = await publicClient.readContract({ address: CONTRACTS.DualStakingVault as `0x${string}`, abi: StakingVaultAbi as any, functionName: 'asset', args: [] })
    return token as `0x${string}`
  }

  return {
    approveStake: async (amount?: number) => {
      const token = await getStakeAsset()
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      return await writeContractAsync({ address: token, abi: MockERC20Abi as any, functionName: 'approve', args: [CONTRACTS.DualStakingVault as `0x${string}`, value] })
    },
    stake: async (amount: number) => {
      const value = toWei(amount)
      return await writeContractAsync({ address: CONTRACTS.DualStakingVault as `0x${string}`, abi: StakingVaultAbi as any, functionName: 'deposit', args: [value] })
    },
    unstake: async (amount: number) => {
      const value = toWei(amount)
      return await writeContractAsync({ address: CONTRACTS.DualStakingVault as `0x${string}`, abi: StakingVaultAbi as any, functionName: 'withdraw', args: [value] })
    },
  }
}


