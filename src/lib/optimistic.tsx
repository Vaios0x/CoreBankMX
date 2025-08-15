import React from 'react'
import { useWriteContract } from 'wagmi'
import { queryClient } from './cache'
import { CACHE_KEYS } from './cache'
import { persistentActions } from '../state/usePersistentStore'
import { SmartCache } from './cache'

// Tipos para optimistic updates
export interface OptimisticUpdate<T = any> {
  id: string
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'stake' | 'unstake' | 'approve'
  data: T
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  rollback?: () => void
}

// Store para optimistic updates
class OptimisticStore {
  private updates = new Map<string, OptimisticUpdate>()
  private listeners = new Set<(updates: OptimisticUpdate[]) => void>()

  // Agregar update optimístico
  add(update: OptimisticUpdate) {
    this.updates.set(update.id, update)
    this.notifyListeners()
    
    // Aplicar update optimístico
    this.applyOptimisticUpdate(update)
  }

  // Confirmar update
  confirm(id: string, result?: any) {
    const update = this.updates.get(id)
    if (update) {
      update.status = 'confirmed'
      update.data = { ...update.data, ...result }
      this.notifyListeners()
      
      // Limpiar después de confirmación
      setTimeout(() => {
        this.updates.delete(id)
        this.notifyListeners()
      }, 5000)
    }
  }

  // Fallar update
  fail(id: string, error?: any) {
    const update = this.updates.get(id)
    if (update) {
      update.status = 'failed'
      update.data = { ...update.data, error }
      this.notifyListeners()
      
      // Revertir update optimístico
      this.revertOptimisticUpdate(update)
      
      // Limpiar después de fallo
      setTimeout(() => {
        this.updates.delete(id)
        this.notifyListeners()
      }, 10000)
    }
  }

  // Obtener updates activos
  getActiveUpdates(): OptimisticUpdate[] {
    return Array.from(this.updates.values())
  }

  // Suscribirse a cambios
  subscribe(listener: (updates: OptimisticUpdate[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    const updates = this.getActiveUpdates()
    this.listeners.forEach(listener => listener(updates))
  }

  // Aplicar update optimístico
  private applyOptimisticUpdate(update: OptimisticUpdate) {
    switch (update.type) {
      case 'deposit':
        this.applyDepositUpdate(update)
        break
      case 'withdraw':
        this.applyWithdrawUpdate(update)
        break
      case 'borrow':
        this.applyBorrowUpdate(update)
        break
      case 'repay':
        this.applyRepayUpdate(update)
        break
      case 'stake':
        this.applyStakeUpdate(update)
        break
      case 'unstake':
        this.applyUnstakeUpdate(update)
        break
      case 'approve':
        this.applyApproveUpdate(update)
        break
    }
  }

  // Revertir update optimístico
  private revertOptimisticUpdate(update: OptimisticUpdate) {
    if (update.rollback) {
      update.rollback()
    }
  }

  // Aplicar update de depósito
  private applyDepositUpdate(update: OptimisticUpdate) {
    const { user, amount, token } = update.data
    
    // Actualizar balance optimísticamente
    queryClient.setQueryData(
      CACHE_KEYS.USER_BALANCE(user, token),
      (oldBalance: any) => (oldBalance || 0) + amount
    )
    
    // Actualizar posición optimísticamente
    queryClient.setQueryData(
      CACHE_KEYS.USER_POSITION(user),
      (oldPosition: any) => ({
        ...oldPosition,
        collateral: (oldPosition?.collateral || 0) + amount,
        lastUpdated: Date.now()
      })
    )
    
    // Actualizar TVL optimísticamente
    queryClient.setQueryData(
      CACHE_KEYS.MARKET_METRICS(),
      (oldMetrics: any) => ({
        ...oldMetrics,
        tvlUsd: (oldMetrics?.tvlUsd || 0) + (amount * (update.data.price || 0))
      })
    )
  }

  // Aplicar update de retiro
  private applyWithdrawUpdate(update: OptimisticUpdate) {
    const { user, amount, token } = update.data
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_BALANCE(user, token),
      (oldBalance: any) => Math.max(0, (oldBalance || 0) - amount)
    )
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_POSITION(user),
      (oldPosition: any) => ({
        ...oldPosition,
        collateral: Math.max(0, (oldPosition?.collateral || 0) - amount),
        lastUpdated: Date.now()
      })
    )
  }

  // Aplicar update de préstamo
  private applyBorrowUpdate(update: OptimisticUpdate) {
    const { user, amount, token } = update.data
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_BALANCE(user, token),
      (oldBalance: any) => (oldBalance || 0) + amount
    )
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_POSITION(user),
      (oldPosition: any) => ({
        ...oldPosition,
        debt: (oldPosition?.debt || 0) + amount,
        healthFactor: this.calculateHealthFactor(
          oldPosition?.collateral || 0,
          (oldPosition?.debt || 0) + amount,
          update.data.collateralPrice || 0
        ),
        lastUpdated: Date.now()
      })
    )
  }

  // Aplicar update de pago
  private applyRepayUpdate(update: OptimisticUpdate) {
    const { user, amount, token } = update.data
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_BALANCE(user, token),
      (oldBalance: any) => Math.max(0, (oldBalance || 0) - amount)
    )
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_POSITION(user),
      (oldPosition: any) => ({
        ...oldPosition,
        debt: Math.max(0, (oldPosition?.debt || 0) - amount),
        healthFactor: this.calculateHealthFactor(
          oldPosition?.collateral || 0,
          Math.max(0, (oldPosition?.debt || 0) - amount),
          update.data.collateralPrice || 0
        ),
        lastUpdated: Date.now()
      })
    )
  }

  // Aplicar update de staking
  private applyStakeUpdate(update: OptimisticUpdate) {
    const { user, amount, token } = update.data
    
    queryClient.setQueryData(
      CACHE_KEYS.STAKING_BALANCE(user),
      (oldBalance: any) => (oldBalance || 0) + amount
    )
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_BALANCE(user, token),
      (oldBalance: any) => Math.max(0, (oldBalance || 0) - amount)
    )
  }

  // Aplicar update de unstaking
  private applyUnstakeUpdate(update: OptimisticUpdate) {
    const { user, amount, token } = update.data
    
    queryClient.setQueryData(
      CACHE_KEYS.STAKING_BALANCE(user),
      (oldBalance: any) => Math.max(0, (oldBalance || 0) - amount)
    )
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_BALANCE(user, token),
      (oldBalance: any) => (oldBalance || 0) + amount
    )
  }

  // Aplicar update de aprobación
  private applyApproveUpdate(update: OptimisticUpdate) {
    const { user, token, spender, amount } = update.data
    
    queryClient.setQueryData(
      CACHE_KEYS.USER_ALLOWANCE(user, token, spender),
      { allowance: amount, timestamp: Date.now() }
    )
  }

  // Calcular health factor
  private calculateHealthFactor(collateral: number, debt: number, price: number): number {
    if (debt === 0) return Infinity
    const collateralValue = collateral * price
    const liquidationThreshold = 0.8 // 80% LTV
    return (collateralValue * liquidationThreshold) / debt
  }
}

// Instancia global del store optimístico
export const optimisticStore = new OptimisticStore()

// Hook para optimistic updates
export function useOptimisticUpdates() {
  const [updates, setUpdates] = React.useState<OptimisticUpdate[]>([])

  React.useEffect(() => {
    const unsubscribe = optimisticStore.subscribe(setUpdates)
    return unsubscribe
  }, [])

  return updates
}

// Utilidades para optimistic updates
export const optimisticUtils = {
  // Crear update optimístico
  createUpdate<T>(
    type: OptimisticUpdate['type'],
    data: T,
    rollback?: () => void
  ): OptimisticUpdate<T> {
    return {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending',
      rollback
    }
  },

  // Aplicar update optimístico
  apply<T>(update: OptimisticUpdate<T>) {
    optimisticStore.add(update)
    return update.id
  },

  // Confirmar update
  confirm(id: string, result?: any) {
    optimisticStore.confirm(id, result)
  },

  // Fallar update
  fail(id: string, error?: any) {
    optimisticStore.fail(id, error)
  },

  // Batch updates
  batch(updates: OptimisticUpdate[]) {
    const ids: string[] = []
    updates.forEach(update => {
      optimisticStore.add(update)
      ids.push(update.id)
    })
    return ids
  },

  // Confirmar batch
  confirmBatch(ids: string[], results?: any[]) {
    ids.forEach((id, index) => {
      optimisticStore.confirm(id, results?.[index])
    })
  },

  // Fallar batch
  failBatch(ids: string[], errors?: any[]) {
    ids.forEach((id, index) => {
      optimisticStore.fail(id, errors?.[index])
    })
  }
}

// Middleware para transacciones con optimistic updates
export const optimisticTransactionMiddleware = {
  // Antes de la transacción
  before: (tx: any) => {
    const update = optimisticUtils.createUpdate(
      tx.type,
      {
        user: tx.from,
        amount: tx.amount,
        token: tx.token,
        price: tx.price,
        collateralPrice: tx.collateralPrice,
        spender: tx.spender
      },
      () => {
        // Rollback function - revertir cambios optimísticos
        SmartCache.invalidate(CACHE_KEYS.USER_POSITION(tx.from))
        SmartCache.invalidate(CACHE_KEYS.USER_BALANCE(tx.from, tx.token))
        SmartCache.invalidate(CACHE_KEYS.MARKET_METRICS())
      }
    )

    const id = optimisticUtils.apply(update)
    return { ...tx, optimisticId: id }
  },

  // Después de la transacción exitosa
  after: (tx: any, result: any) => {
    if (tx.optimisticId) {
      optimisticUtils.confirm(tx.optimisticId, result)
    }
  },

  // En caso de error
  error: (tx: any, error: any) => {
    if (tx.optimisticId) {
      optimisticUtils.fail(tx.optimisticId, error)
    }
  }
}

// Componente para mostrar updates optimísticos
export const OptimisticUpdatesIndicator: React.FC = () => {
  const updates = useOptimisticUpdates()
  const pendingUpdates = updates.filter(u => u.status === 'pending')

  if (pendingUpdates.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm font-medium">
            {pendingUpdates.length} transacción{pendingUpdates.length > 1 ? 'es' : ''} pendiente{pendingUpdates.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// Hook para transacciones con optimistic updates
export function useOptimisticTransaction() {
  const { writeContractAsync } = useWriteContract()

  const executeWithOptimistic = async (
    type: OptimisticUpdate['type'],
    contractCall: () => Promise<any>,
    optimisticData: any
  ) => {
    // Crear update optimístico
    const update = optimisticUtils.createUpdate(type, optimisticData)
    const id = optimisticUtils.apply(update)

    try {
      // Ejecutar transacción
      const result = await contractCall()
      
      // Confirmar update optimístico
      optimisticUtils.confirm(id, result)
      
      return result
    } catch (error) {
      // Fallar update optimístico
      optimisticUtils.fail(id, error)
      throw error
    }
  }

  return { executeWithOptimistic }
}
