import { CONTRACTS } from '../lib/contracts'
import { env } from '../lib/env'
import { useWriteContract, usePublicClient } from 'wagmi'
import { parseEther, type Abi } from 'viem'

const erc20Abi = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
] as const satisfies Abi

const stakingAbi = [
  { inputs: [], name: 'asset', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'assets', type: 'uint256' }], name: 'deposit', outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'assets', type: 'uint256' }], name: 'withdraw', outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
] as const satisfies Abi

export function useStaking() {
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  function toWei(amount: number): bigint {
    return parseEther(String(amount))
  }

  async function getStakeAsset(): Promise<`0x${string}`> {
    if (!publicClient) throw new Error('No client')
    const token = await publicClient.readContract({ address: CONTRACTS.DualStakingVault as `0x${string}`, abi: stakingAbi, functionName: 'asset', args: [] })
    return token as `0x${string}`
  }

  return {
    approveStake: async (amount?: number) => {
      const token = await getStakeAsset()
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      return await writeContractAsync({ address: token, abi: erc20Abi, functionName: 'approve', args: [CONTRACTS.DualStakingVault as `0x${string}`, value] })
    },
    stake: async (amount: number) => {
      const value = toWei(amount)
      return await writeContractAsync({ address: CONTRACTS.DualStakingVault as `0x${string}`, abi: stakingAbi, functionName: 'deposit', args: [value] })
    },
    unstake: async (amount: number) => {
      const value = toWei(amount)
      return await writeContractAsync({ address: CONTRACTS.DualStakingVault as `0x${string}`, abi: stakingAbi, functionName: 'withdraw', args: [value] })
    },
  }
}


