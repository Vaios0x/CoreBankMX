import { CONTRACTS } from '../lib/contracts'
import { env } from '../lib/env'
import { useWriteContract, usePublicClient, useAccount } from 'wagmi'
import { parseEther, type Abi } from 'viem'
import { useOptimisticTransaction, optimisticUtils } from '../lib/optimistic'
import { CACHE_KEYS, SmartCache } from '../lib/cache'
import { persistentActions } from '../state/usePersistentStore'
import { useTransactionQueue } from '../lib/blockchain/transactionQueue'
import { useAllowanceManager } from '../lib/blockchain/allowanceManager'
import { blockchainEventManager } from '../lib/blockchain/eventListeners'

import MockERC20Abi from '../abi/MockERC20.json'
import CollateralVaultAbi from '../abi/CollateralVault.json'
import LoanManagerAbi from '../abi/LoanManager.json'

export function useTx() {
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const { address } = useAccount()
  const { executeWithOptimistic } = useOptimisticTransaction()
  const { addTransaction, getGasEstimate } = useTransactionQueue()
  const { ensureAllowance } = useAllowanceManager()

  function toWei(amount: number, decimals = 18): bigint {
    // simple path: assume 18d unless token decimals fetched
    if (decimals === 18) return parseEther(String(amount))
    return BigInt(Math.trunc(amount * Math.pow(10, decimals)))
  }

  async function getCollateralToken(): Promise<`0x${string}`> {
    if (!publicClient) throw new Error('No client')
    const token = await publicClient.readContract({ address: CONTRACTS.CollateralVault as `0x${string}`, abi: CollateralVaultAbi as any, functionName: 'asset', args: [] })
    return token as `0x${string}`
  }

  // Obtener precio actual para cálculos optimísticos
  async function getCurrentPrice(): Promise<number> {
    try {
      const priceData = SmartCache.getData(CACHE_KEYS.ORACLE_PRICE('BTC'))
      return typeof priceData === 'number' ? priceData : 60000 // Fallback
    } catch {
      return 60000 // Fallback
    }
  }

  // Función helper para crear transacción con allowance check
  async function createTransactionWithAllowance(
    type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'stake' | 'unstake' | 'approve',
    contractAddress: `0x${string}`,
    abi: any,
    functionName: string,
    args: any[],
    token: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
    optimisticData: any
  ) {
    // Verificar allowance antes de la transacción
    const { approved } = await ensureAllowance(token, spender, address!, amount)

    if (!approved) {
      throw new Error('Allowance not approved. Please approve tokens first.')
    }

    // Obtener gas estimation
    const gasEstimate = await getGasEstimate({
      to: contractAddress,
      data: '0x', // Placeholder, will be filled by the contract call
    })

    // Crear transacción
    const transactionRequest = {
      to: contractAddress,
      data: '0x' as `0x${string}`, // Will be filled by writeContractAsync
      from: address!,
      value: type === 'deposit' || type === 'withdraw' ? amount : 0n,
      gas: gasEstimate.standard,
      gasPrice: gasEstimate.standard,
    }

    // Agregar a transaction queue
    const queueId = await addTransaction(
      type,
      transactionRequest,
      'medium',
      optimisticData
    )

    // Ejecutar con optimistic updates
    return await executeWithOptimistic(
      type,
      () => writeContractAsync({
        address: contractAddress,
        abi,
        functionName,
        args,
      }),
      optimisticData
    )
  }

  return {
    approve: async (amount?: number) => {
      const token = CONTRACTS.LSTBTC || (await getCollateralToken())
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      
      return await executeWithOptimistic(
        'approve',
        () => writeContractAsync({ 
          address: token as `0x${string}`, 
          abi: MockERC20Abi as any, 
          functionName: 'approve', 
          args: [CONTRACTS.CollateralVault as `0x${string}`, value] 
        }),
        {
          user: address,
          token: token,
          spender: CONTRACTS.CollateralVault,
          amount: value
        }
      )
    },
    
    approveCollateral: async (amount?: number) => {
      const token = CONTRACTS.LSTBTC || (await getCollateralToken())
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      
      return await executeWithOptimistic(
        'approve',
        () => writeContractAsync({ 
          address: token as `0x${string}`, 
          abi: MockERC20Abi as any, 
          functionName: 'approve', 
          args: [CONTRACTS.CollateralVault as `0x${string}`, value] 
        }),
        {
          user: address,
          token: token,
          spender: CONTRACTS.CollateralVault,
          amount: value
        }
      )
    },
    
    approveDebt: async (amount?: number) => {
      const token = CONTRACTS.USDT as `0x${string}`
      const value = amount && amount > 0 ? toWei(amount) : (BigInt(2) ** BigInt(256) - BigInt(1))
      
      return await executeWithOptimistic(
        'approve',
        () => writeContractAsync({ 
          address: token, 
          abi: MockERC20Abi as any, 
          functionName: 'approve', 
          args: [CONTRACTS.LoanManager as `0x${string}`, value] 
        }),
        {
          user: address,
          token: token,
          spender: CONTRACTS.LoanManager,
          amount: value
        }
      )
    },
    
    deposit: async (amount: number) => {
      const value = toWei(amount)
      const price = await getCurrentPrice()
      const token = CONTRACTS.LSTBTC || (await getCollateralToken())
      
      return await createTransactionWithAllowance(
        'deposit',
        CONTRACTS.CollateralVault as `0x${string}`,
        CollateralVaultAbi as any,
        'deposit',
        [value],
        token as `0x${string}`,
        CONTRACTS.CollateralVault as `0x${string}`,
        value,
        {
          user: address,
          amount: amount,
          token: 'LSTBTC',
          price: price
        }
      )
    },
    
    borrow: async (amount: number) => {
      const value = toWei(amount)
      const price = await getCurrentPrice()
      
      return await createTransactionWithAllowance(
        'borrow',
        CONTRACTS.LoanManager as `0x${string}`,
        LoanManagerAbi as any,
        'borrow',
        [value],
        CONTRACTS.USDT as `0x${string}`,
        CONTRACTS.LoanManager as `0x${string}`,
        value,
        {
          user: address,
          amount: amount,
          token: 'USDT',
          collateralPrice: price
        }
      )
    },
    
    repay: async (amount?: number) => {
      const value = toWei(amount ?? 0)
      const price = await getCurrentPrice()
      
      return await createTransactionWithAllowance(
        'repay',
        CONTRACTS.LoanManager as `0x${string}`,
        LoanManagerAbi as any,
        'repay',
        [value],
        CONTRACTS.USDT as `0x${string}`,
        CONTRACTS.LoanManager as `0x${string}`,
        value,
        {
          user: address,
          amount: amount || 0,
          token: 'USDT',
          collateralPrice: price
        }
      )
    },
    
    withdraw: async (amount: number) => {
      const value = toWei(amount)
      const price = await getCurrentPrice()
      const token = CONTRACTS.LSTBTC || (await getCollateralToken())
      
      return await createTransactionWithAllowance(
        'withdraw',
        CONTRACTS.CollateralVault as `0x${string}`,
        CollateralVaultAbi as any,
        'withdraw',
        [value],
        token as `0x${string}`,
        CONTRACTS.CollateralVault as `0x${string}`,
        value,
        {
          user: address,
          amount: amount,
          token: 'LSTBTC',
          price: price
        }
      )
    },

    // Métodos adicionales para gas estimation
    getGasEstimate: async (request: any) => {
      return await getGasEstimate(request)
    },

    // Métodos para allowance management
    checkAllowance: async (token: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
      return await ensureAllowance(token, spender, address!, amount)
    },
  }
}


