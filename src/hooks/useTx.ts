import { CONTRACTS } from '../lib/contracts'
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

  function toWei(amount: number, decimals = 18): bigint {
    // simple path: assume 18d unless token decimals fetched
    if (decimals === 18) return parseEther(String(amount))
    return BigInt(Math.trunc(amount * Math.pow(10, decimals)))
  }

  async function getCollateralToken(): Promise<`0x${string}`> {
    if (!publicClient) throw new Error('No client')
    const token = await publicClient.readContract({ address: CONTRACTS.CollateralVault as `0x${string}`, abi: vaultAbi, functionName: 'asset', args: [] })
    return token as `0x${string}`
  }

  return {
    approve: async (amount?: number) => {
      const token = CONTRACTS.LSTBTC || (await getCollateralToken())
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      return await writeContractAsync({ address: token as `0x${string}`, abi: erc20Abi, functionName: 'approve', args: [CONTRACTS.CollateralVault as `0x${string}`, value] })
    },
    approveCollateral: async (amount?: number) => {
      const token = CONTRACTS.LSTBTC || (await getCollateralToken())
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      return await writeContractAsync({ address: token as `0x${string}`, abi: erc20Abi, functionName: 'approve', args: [CONTRACTS.CollateralVault as `0x${string}`, value] })
    },
    approveDebt: async (amount?: number) => {
      const token = CONTRACTS.USDT as `0x${string}`
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      return await writeContractAsync({ address: token, abi: erc20Abi, functionName: 'approve', args: [CONTRACTS.LoanManager as `0x${string}`, value] })
    },
    deposit: async (amount: number) => {
      const value = toWei(amount)
      return await writeContractAsync({ address: CONTRACTS.CollateralVault as `0x${string}`, abi: vaultAbi, functionName: 'deposit', args: [value] })
    },
    borrow: async (amount: number) => {
      const value = toWei(amount)
      return await writeContractAsync({ address: CONTRACTS.LoanManager as `0x${string}`, abi: loanAbi, functionName: 'borrow', args: [value] })
    },
    repay: async (amount?: number) => {
      const value = toWei(amount ?? 0)
      // Si hay token de deuda declarado, hacer approve al LoanManager antes (fuera de este método el front ya maneja allowances)
      return await writeContractAsync({ address: CONTRACTS.LoanManager as `0x${string}`, abi: loanAbi, functionName: 'repay', args: [value] })
    },
    withdraw: async (amount: number) => {
      const value = toWei(amount)
      return await writeContractAsync({ address: CONTRACTS.CollateralVault as `0x${string}`, abi: vaultAbi, functionName: 'withdraw', args: [value] })
    },
  }
}


