import { env } from '../lib/env'
import { useWriteContract, usePublicClient } from 'wagmi'
import { parseEther, type Abi } from 'viem'

const erc20Abi = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
] as const satisfies Abi

const vaultAbi = [
  { inputs: [], name: 'asset', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'deposit', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'user', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
 ] as const satisfies Abi

const loanAbi = [
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'borrow', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'repay', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const satisfies Abi

export function useTx() {
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  async function mockTx(action: string) {
    await new Promise((r) => setTimeout(r, 700))
    return `0xmock_${action}_${Date.now()}` as `0x${string}`
  }

  function toWei(amount: number, decimals = 18): bigint {
    // simple path: assume 18d unless token decimals fetched
    if (decimals === 18) return parseEther(String(amount))
    return BigInt(Math.trunc(amount * Math.pow(10, decimals)))
  }

  async function getCollateralToken(): Promise<`0x${string}`> {
    if (!publicClient) throw new Error('No client')
    const token = await publicClient.readContract({ address: env.COLLATERAL_VAULT as `0x${string}`, abi: vaultAbi, functionName: 'asset', args: [] })
    return token as `0x${string}`
  }

  return {
    approve: async (amount?: number) => {
      if (env.USE_MOCKS) return mockTx('approve')
      const token = await getCollateralToken()
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      return await writeContractAsync({ address: token, abi: erc20Abi, functionName: 'approve', args: [env.COLLATERAL_VAULT as `0x${string}`, value] })
    },
    deposit: async (amount: number) => {
      if (env.USE_MOCKS) return mockTx('deposit')
      const value = toWei(amount)
      return await writeContractAsync({ address: env.COLLATERAL_VAULT as `0x${string}`, abi: vaultAbi, functionName: 'deposit', args: [value] })
    },
    withdraw: async (amount: number) => {
      if (env.USE_MOCKS) return mockTx('withdraw')
      const value = toWei(amount)
      return await writeContractAsync({ address: env.COLLATERAL_VAULT as `0x${string}`, abi: vaultAbi, functionName: 'withdraw', args: [value] })
    },
    borrow: async (amount: number) => {
      if (env.USE_MOCKS) return mockTx('borrow')
      const value = toWei(amount)
      return await writeContractAsync({ address: env.LOAN_MANAGER as `0x${string}`, abi: loanAbi, functionName: 'borrow', args: [value] })
    },
    repay: async (amount?: number) => {
      if (env.USE_MOCKS) return mockTx('repay')
      const value = toWei(amount ?? 0)
      return await writeContractAsync({ address: env.LOAN_MANAGER as `0x${string}`, abi: loanAbi, functionName: 'repay', args: [value] })
    },
  }
}


