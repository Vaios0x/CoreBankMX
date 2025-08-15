import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount, usePublicClient } from 'wagmi'
import { CONTRACTS } from '../lib/contracts'
import { CACHE_KEYS, CACHE_CONFIGS, SmartCache } from '../lib/cache'
import { persistentActions } from '../state/usePersistentStore'
import { optimisticUtils } from '../lib/optimistic'
import { parseEther, formatEther } from 'viem'

import MockERC20Abi from '../abi/MockERC20.json'
import CollateralVaultAbi from '../abi/CollateralVault.json'
import LoanManagerAbi from '../abi/LoanManager.json'
import StakingVaultAbi from '../abi/StakingVault.json'

// Tipos para datos de usuario
export interface UserPosition {
  collateral: number
  debt: number
  healthFactor: number
  maxBorrow: number
  liquidationPrice: number
  lastUpdated: number
}

export interface UserBalances {
  [token: string]: number
}

export interface UserAllowances {
  [key: string]: bigint
}

export function useUserData() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  // Hook para obtener posición del usuario
  const useUserPosition = () => {
    const config = CACHE_CONFIGS.POSITIONS
    
    return useQuery({
      queryKey: CACHE_KEYS.USER_POSITION(address || ''),
      queryFn: async (): Promise<UserPosition> => {
        if (!address || !publicClient) throw new Error('No address or client')
        
        const [collateral, debt, healthFactor] = await publicClient.readContract({
          address: CONTRACTS.LoanManager as `0x${string}`,
          abi: LoanManagerAbi as any,
          functionName: 'getAccountData',
          args: [address]
        }) as [bigint, bigint, bigint]
        
        const collateralValue = Number(formatEther(collateral))
        const debtValue = Number(formatEther(debt))
        const healthFactorValue = Number(formatEther(healthFactor))
        
        // Calcular valores derivados
        const maxBorrow = collateralValue * 0.8 - debtValue // 80% LTV
        const liquidationPrice = debtValue > 0 ? debtValue / (collateralValue * 0.8) : 0
        
        const position: UserPosition = {
          collateral: collateralValue,
          debt: debtValue,
          healthFactor: healthFactorValue,
          maxBorrow: Math.max(0, maxBorrow),
          liquidationPrice,
          lastUpdated: Date.now()
        }
        
        // Actualizar cache persistente
        persistentActions.updateUserPosition(address, position)
        
        return position
      },
      enabled: !!address && !!publicClient,
      staleTime: config.staleTime,
      gcTime: config.gcTime,
      retry: config.retry,
      refetchInterval: config.background ? 30_000 : false,
      placeholderData: () => {
        // Usar datos del cache persistente como fallback
        if (!address) return undefined
        const cachedData = SmartCache.getData(CACHE_KEYS.USER_POSITION(address))
        return cachedData as UserPosition || undefined
      }
    })
  }

  // Hook para obtener balances de tokens
  const useUserBalances = () => {
    const config = CACHE_CONFIGS.USER_DATA
    
    return useQuery({
      queryKey: CACHE_KEYS.USER_BALANCE(address || '', 'all'),
      queryFn: async (): Promise<UserBalances> => {
        if (!address || !publicClient) throw new Error('No address or client')
        
        const [lstbtcBalance, usdtBalance] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.LSTBTC as `0x${string}`,
            abi: MockERC20Abi as any,
            functionName: 'balanceOf',
            args: [address]
          }),
          publicClient.readContract({
            address: CONTRACTS.USDT as `0x${string}`,
            abi: MockERC20Abi as any,
            functionName: 'balanceOf',
            args: [address]
          })
        ])
        
        const balances: UserBalances = {
          LSTBTC: Number(formatEther(lstbtcBalance as bigint)),
          USDT: Number(formatEther(usdtBalance as bigint))
        }
        
        return balances
      },
      enabled: !!address && !!publicClient,
      staleTime: config.staleTime,
      gcTime: config.gcTime,
      retry: config.retry,
      refetchInterval: config.background ? 60_000 : false
    })
  }

  // Hook para obtener allowances
  const useUserAllowances = () => {
    const config = CACHE_CONFIGS.ALLOWANCES
    
    return useQuery({
      queryKey: CACHE_KEYS.USER_ALLOWANCE(address || '', 'all', 'all'),
      queryFn: async (): Promise<UserAllowances> => {
        if (!address || !publicClient) throw new Error('No address or client')
        
        const [lstbtcVaultAllowance, lstbtcStakingAllowance, usdtLoanAllowance] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.LSTBTC as `0x${string}`,
            abi: MockERC20Abi as any,
            functionName: 'allowance',
            args: [address, CONTRACTS.CollateralVault as `0x${string}`]
          }),
          publicClient.readContract({
            address: CONTRACTS.LSTBTC as `0x${string}`,
            abi: MockERC20Abi as any,
            functionName: 'allowance',
            args: [address, CONTRACTS.DualStakingVault as `0x${string}`]
          }),
          publicClient.readContract({
            address: CONTRACTS.USDT as `0x${string}`,
            abi: MockERC20Abi as any,
            functionName: 'allowance',
            args: [address, CONTRACTS.LoanManager as `0x${string}`]
          })
        ])
        
        const allowances: UserAllowances = {
          [`${address}-LSTBTC-${CONTRACTS.CollateralVault}`]: lstbtcVaultAllowance as bigint,
          [`${address}-LSTBTC-${CONTRACTS.DualStakingVault}`]: lstbtcStakingAllowance as bigint,
          [`${address}-USDT-${CONTRACTS.LoanManager}`]: usdtLoanAllowance as bigint
        }
        
        // Actualizar cache persistente
        Object.entries(allowances).forEach(([key, amount]) => {
          persistentActions.updateAllowanceCache(key, amount)
        })
        
        return allowances
      },
      enabled: !!address && !!publicClient,
      staleTime: config.staleTime,
      gcTime: config.gcTime,
      retry: config.retry,
      refetchInterval: false // Allowances no cambian frecuentemente
    })
  }

  // Hook para obtener balance de staking
  const useStakingBalance = () => {
    const config = CACHE_CONFIGS.USER_DATA
    
    return useQuery({
      queryKey: CACHE_KEYS.STAKING_BALANCE(address || ''),
      queryFn: async (): Promise<number> => {
        if (!address || !publicClient) throw new Error('No address or client')
        
        const balance = await publicClient.readContract({
          address: CONTRACTS.DualStakingVault as `0x${string}`,
          abi: StakingVaultAbi as any,
          functionName: 'balanceOf',
          args: [address]
        })
        
        return Number(formatEther(balance as bigint))
      },
      enabled: !!address && !!publicClient,
      staleTime: config.staleTime,
      gcTime: config.gcTime,
      retry: config.retry,
      refetchInterval: config.background ? 60_000 : false
    })
  }

  // Mutación para invalidar datos de usuario
  const invalidateUserData = useMutation({
    mutationFn: async () => {
      if (!address) return
      
      // Invalidar todos los caches relacionados con el usuario
      await Promise.all([
        SmartCache.invalidate(CACHE_KEYS.USER_POSITION(address)),
        SmartCache.invalidate(CACHE_KEYS.USER_BALANCE(address, 'all')),
        SmartCache.invalidate(CACHE_KEYS.USER_ALLOWANCE(address, 'all', 'all')),
        SmartCache.invalidate(CACHE_KEYS.STAKING_BALANCE(address))
      ])
    }
  })

  // Función para actualizar datos optimísticamente
  const updateOptimistic = (updates: {
    position?: Partial<UserPosition>
    balances?: Partial<UserBalances>
    allowances?: Partial<UserAllowances>
    staking?: number
  }) => {
    if (!address) return
    
    // Actualizar posición optimísticamente
    if (updates.position) {
      queryClient.setQueryData(
        CACHE_KEYS.USER_POSITION(address),
        (oldData: UserPosition | undefined) => ({
          ...oldData,
          ...updates.position,
          lastUpdated: Date.now()
        })
      )
    }
    
    // Actualizar balances optimísticamente
    if (updates.balances) {
      queryClient.setQueryData(
        CACHE_KEYS.USER_BALANCE(address, 'all'),
        (oldData: UserBalances | undefined) => ({
          ...oldData,
          ...updates.balances
        })
      )
    }
    
    // Actualizar allowances optimísticamente
    if (updates.allowances) {
      queryClient.setQueryData(
        CACHE_KEYS.USER_ALLOWANCE(address, 'all', 'all'),
        (oldData: UserAllowances | undefined) => ({
          ...oldData,
          ...updates.allowances
        })
      )
    }
    
    // Actualizar staking optimísticamente
    if (updates.staking !== undefined) {
      queryClient.setQueryData(
        CACHE_KEYS.STAKING_BALANCE(address),
        updates.staking
      )
    }
  }

  return {
    useUserPosition,
    useUserBalances,
    useUserAllowances,
    useStakingBalance,
    invalidateUserData,
    updateOptimistic
  }
}
