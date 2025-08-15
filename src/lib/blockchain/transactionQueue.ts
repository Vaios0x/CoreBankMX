import { createPublicClient, http, type PublicClient, type Address, type TransactionRequest, type Hash } from 'viem'
import { CONTRACTS } from '../../lib/contracts'
import { CACHE_KEYS, SmartCache } from '../cache'
import { persistentActions } from '../../state/usePersistentStore'
import { optimisticUtils } from '../optimistic'
import { env } from '../../lib/env'
import { coreMainnet, coreTestnet } from '../../lib/chains'

// Tipos para transaction queue
export interface QueuedTransaction {
  id: string
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'stake' | 'unstake' | 'approve'
  request: TransactionRequest
  priority: 'high' | 'medium' | 'low'
  retryCount: number
  maxRetries: number
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'cancelled'
  createdAt: number
  updatedAt: number
  hash?: Hash
  error?: string
  gasEstimate?: bigint
  gasPrice?: bigint
  optimisticData?: any
}

export interface GasEstimate {
  slow: bigint
  standard: bigint
  fast: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

export interface QueueConfig {
  maxConcurrent: number
  retryDelay: number
  maxRetries: number
  gasBuffer: number // Porcentaje de buffer para gas estimation
  priorityWeights: {
    high: number
    medium: number
    low: number
  }
}

// Manager para transaction queue
class TransactionQueueManager {
  private queue: QueuedTransaction[] = []
  private processing: Set<string> = new Set()
  private client: PublicClient
  private config: QueueConfig
  private isRunning = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    const chain = env.RPC_TESTNET.includes('test') ? coreTestnet : coreMainnet
    const rpc = env.RPC_TESTNET.includes('test') ? env.RPC_TESTNET : env.RPC_MAINNET
    
    this.client = createPublicClient({
      transport: http(rpc),
      chain,
    })

    this.config = {
      maxConcurrent: 3,
      retryDelay: 5000, // 5 segundos
      maxRetries: 3,
      gasBuffer: 20, // 20% buffer
      priorityWeights: {
        high: 3,
        medium: 2,
        low: 1,
      },
    }
  }

  // Iniciar el queue manager
  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('🚀 Iniciando Transaction Queue Manager...')
    
    // Iniciar procesamiento
    this.startProcessing()
  }

  // Detener el queue manager
  stop() {
    this.isRunning = false
    console.log('⏹️ Deteniendo Transaction Queue Manager...')
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  // Agregar transacción a la cola
  async addTransaction(
    type: QueuedTransaction['type'],
    request: TransactionRequest,
    priority: QueuedTransaction['priority'] = 'medium',
    optimisticData?: any
  ): Promise<string> {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Estimar gas antes de agregar a la cola
    const gasEstimate = await this.estimateGas(request)
    
    const transaction: QueuedTransaction = {
      id,
      type,
      request,
      priority,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gasEstimate,
      optimisticData,
    }

    // Agregar a la cola con prioridad
    this.addToQueue(transaction)
    
    console.log(`📝 Transacción agregada a la cola: ${id} (${type})`)
    
    return id
  }

  // Agregar transacción a la cola con prioridad
  private addToQueue(transaction: QueuedTransaction) {
    const priorityWeight = this.config.priorityWeights[transaction.priority]
    
    // Encontrar posición correcta basada en prioridad
    let insertIndex = 0
    for (let i = 0; i < this.queue.length; i++) {
      const currentWeight = this.config.priorityWeights[this.queue[i].priority]
      if (priorityWeight > currentWeight) {
        insertIndex = i
        break
      }
      insertIndex = i + 1
    }
    
    this.queue.splice(insertIndex, 0, transaction)
  }

  // Iniciar procesamiento de la cola
  private startProcessing() {
    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 1000) // Procesar cada segundo
  }

  // Procesar la cola de transacciones
  private async processQueue() {
    if (!this.isRunning) return
    
    // Verificar si podemos procesar más transacciones
    if (this.processing.size >= this.config.maxConcurrent) return
    
    // Obtener siguiente transacción
    const transaction = this.getNextTransaction()
    if (!transaction) return
    
    // Marcar como procesando
    this.processing.add(transaction.id)
    this.updateTransactionStatus(transaction.id, 'processing')
    
    try {
      // Procesar transacción
      await this.processTransaction(transaction)
    } catch (error) {
      console.error(`Error procesando transacción ${transaction.id}:`, error)
      
      // Manejar retry
      await this.handleTransactionError(transaction, error as Error)
    } finally {
      // Remover de procesamiento
      this.processing.delete(transaction.id)
    }
  }

  // Obtener siguiente transacción de la cola
  private getNextTransaction(): QueuedTransaction | null {
    return this.queue.find(tx => tx.status === 'pending') || null
  }

  // Procesar transacción individual
  private async processTransaction(transaction: QueuedTransaction) {
    console.log(`🔄 Procesando transacción: ${transaction.id}`)
    
    try {
      // Actualizar gas estimation si es necesario
      const updatedRequest = await this.updateGasEstimation(transaction.request)
      
      // Enviar transacción
      const hash = await this.client.sendTransaction(updatedRequest)
      
      // Actualizar transacción con hash
      this.updateTransaction(transaction.id, {
        hash,
        status: 'confirmed',
        updatedAt: Date.now(),
      })
      
      // Confirmar optimistic update
      if (transaction.optimisticData) {
        optimisticUtils.confirm(transaction.id, { hash })
      }
      
      // Agregar a historial
      persistentActions.addTransaction({
        id: transaction.id,
        type: transaction.type,
        amount: this.extractAmount(transaction.request),
        token: this.extractToken(transaction.request),
        status: 'confirmed',
        hash,
        timestamp: Date.now(),
        gasUsed: Number(transaction.gasEstimate),
        gasPrice: Number(transaction.gasPrice),
      })
      
      console.log(`✅ Transacción confirmada: ${transaction.id} (${hash})`)
      
    } catch (error) {
      throw error
    }
  }

  // Manejar error de transacción
  private async handleTransactionError(transaction: QueuedTransaction, error: Error) {
    console.error(`❌ Error en transacción ${transaction.id}:`, error.message)
    
    // Incrementar contador de retry
    const retryCount = transaction.retryCount + 1
    
    if (retryCount <= transaction.maxRetries) {
      // Reintentar
      this.updateTransaction(transaction.id, {
        retryCount,
        status: 'pending',
        updatedAt: Date.now(),
        error: error.message,
      })
      
      // Revertir optimistic update temporalmente
      if (transaction.optimisticData) {
        optimisticUtils.fail(transaction.id, error)
      }
      
      console.log(`🔄 Reintentando transacción ${transaction.id} (${retryCount}/${transaction.maxRetries})`)
      
      // Esperar antes del retry
      await this.delay(this.config.retryDelay * retryCount)
      
    } else {
      // Máximo de retries alcanzado
      this.updateTransaction(transaction.id, {
        status: 'failed',
        updatedAt: Date.now(),
        error: error.message,
      })
      
      // Fallar optimistic update permanentemente
      if (transaction.optimisticData) {
        optimisticUtils.fail(transaction.id, error)
      }
      
      console.log(`💀 Transacción fallida permanentemente: ${transaction.id}`)
    }
  }

  // Estimar gas para una transacción
  private async estimateGas(request: TransactionRequest): Promise<bigint> {
    try {
      const gasEstimate = await this.client.estimateGas(request)
      
      // Aplicar buffer de seguridad
      const buffer = (gasEstimate * BigInt(this.config.gasBuffer)) / 100n
      return gasEstimate + buffer
      
    } catch (error) {
      console.warn('Error estimando gas, usando valor por defecto:', error)
      return 300000n // Valor por defecto
    }
  }

  // Actualizar gas estimation para una transacción
  private async updateGasEstimation(request: TransactionRequest): Promise<TransactionRequest> {
    try {
      // Obtener gas price actual
      const gasPrice = await this.getCurrentGasPrice()
      
      // Obtener nonce si no está presente
      if (!request.nonce && request.from) {
        const nonce = await this.client.getTransactionCount({ address: request.from })
        request.nonce = nonce
      }
      
      return {
        ...request,
        gasPrice,
      }
      
    } catch (error) {
      console.warn('Error actualizando gas estimation:', error)
      return request
    }
  }

  // Obtener gas price actual
  private async getCurrentGasPrice(): Promise<bigint> {
    try {
      const gasPrice = await this.client.getGasPrice()
      return gasPrice
    } catch (error) {
      console.warn('Error obteniendo gas price, usando valor por defecto:', error)
      return 20000000000n // 20 gwei por defecto
    }
  }

  // Obtener estimación de gas con diferentes velocidades
  async getGasEstimate(request: TransactionRequest): Promise<GasEstimate> {
    try {
      const baseGasPrice = await this.client.getGasPrice()
      
      // Calcular diferentes velocidades
      const slow = (baseGasPrice * 80n) / 100n // 80% del precio base
      const standard = baseGasPrice
      const fast = (baseGasPrice * 120n) / 100n // 120% del precio base
      
      // Obtener max fee y priority fee (EIP-1559)
      const feeHistory = await this.client.getFeeHistory({
        blockCount: 1,
        rewardPercentiles: [25, 75],
      })
      
      const maxFeePerGas = feeHistory.baseFeePerGas?.[0] || baseGasPrice
      const maxPriorityFeePerGas = feeHistory.reward?.[0]?.[1] || 1500000000n // 1.5 gwei
      
      return {
        slow,
        standard,
        fast,
        maxFeePerGas,
        maxPriorityFeePerGas,
      }
      
    } catch (error) {
      console.warn('Error obteniendo gas estimate:', error)
      
      // Valores por defecto
      const defaultPrice = 20000000000n // 20 gwei
      return {
        slow: defaultPrice,
        standard: defaultPrice,
        fast: defaultPrice,
        maxFeePerGas: defaultPrice,
        maxPriorityFeePerGas: 1500000000n,
      }
    }
  }

  // Actualizar estado de transacción
  private updateTransactionStatus(id: string, status: QueuedTransaction['status']) {
    const transaction = this.queue.find(tx => tx.id === id)
    if (transaction) {
      transaction.status = status
      transaction.updatedAt = Date.now()
    }
  }

  // Actualizar transacción
  private updateTransaction(id: string, updates: Partial<QueuedTransaction>) {
    const transaction = this.queue.find(tx => tx.id === id)
    if (transaction) {
      Object.assign(transaction, updates)
      transaction.updatedAt = Date.now()
    }
  }

  // Cancelar transacción
  cancelTransaction(id: string): boolean {
    const transaction = this.queue.find(tx => tx.id === id)
    if (transaction && transaction.status === 'pending') {
      this.updateTransactionStatus(id, 'cancelled')
      
      // Remover de la cola
      this.queue = this.queue.filter(tx => tx.id !== id)
      
      // Revertir optimistic update
      if (transaction.optimisticData) {
        optimisticUtils.fail(id, new Error('Transaction cancelled'))
      }
      
      console.log(`❌ Transacción cancelada: ${id}`)
      return true
    }
    return false
  }

  // Obtener estado de la cola
  getQueueStatus() {
    const pending = this.queue.filter(tx => tx.status === 'pending').length
    const processing = this.processing.size
    const confirmed = this.queue.filter(tx => tx.status === 'confirmed').length
    const failed = this.queue.filter(tx => tx.status === 'failed').length
    const cancelled = this.queue.filter(tx => tx.status === 'cancelled').length
    
    return {
      total: this.queue.length,
      pending,
      processing,
      confirmed,
      failed,
      cancelled,
      queue: this.queue.map(tx => ({
        id: tx.id,
        type: tx.type,
        priority: tx.priority,
        status: tx.status,
        retryCount: tx.retryCount,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        hash: tx.hash,
        error: tx.error,
      })),
    }
  }

  // Limpiar transacciones completadas
  clearCompletedTransactions() {
    const completed = this.queue.filter(tx => 
      tx.status === 'confirmed' || tx.status === 'failed' || tx.status === 'cancelled'
    )
    
    this.queue = this.queue.filter(tx => 
      tx.status === 'pending' || tx.status === 'processing'
    )
    
    console.log(`🧹 Limpiadas ${completed.length} transacciones completadas`)
  }

  // Utilidades
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private extractAmount(request: TransactionRequest): number {
    if (request.value) {
      return Number(request.value) / 1e18
    }
    return 0
  }

  private extractToken(request: TransactionRequest): string {
    // Extraer token basado en la dirección del contrato
    const address = request.to
    if (!address) return 'UNKNOWN'
    
    const tokenMap: Record<string, string> = {
      [CONTRACTS.LSTBTC]: 'LSTBTC',
      [CONTRACTS.USDT]: 'USDT',
      [CONTRACTS.CollateralVault]: 'LSTBTC',
      [CONTRACTS.LoanManager]: 'USDT',
      [CONTRACTS.DualStakingVault]: 'LSTBTC',
    }
    
    return tokenMap[address] || 'UNKNOWN'
  }

  // Configurar el queue
  configure(config: Partial<QueueConfig>) {
    this.config = { ...this.config, ...config }
    console.log('⚙️ Transaction Queue configurado:', this.config)
  }
}

// Instancia global del queue manager
export const transactionQueueManager = new TransactionQueueManager()

// Hook para usar transaction queue
export function useTransactionQueue() {
  const addTransaction = (
    type: QueuedTransaction['type'],
    request: TransactionRequest,
    priority?: QueuedTransaction['priority'],
    optimisticData?: any
  ) => transactionQueueManager.addTransaction(type, request, priority, optimisticData)
  
  const cancelTransaction = (id: string) => transactionQueueManager.cancelTransaction(id)
  const getStatus = () => transactionQueueManager.getQueueStatus()
  const clearCompleted = () => transactionQueueManager.clearCompletedTransactions()
  const getGasEstimate = (request: TransactionRequest) => transactionQueueManager.getGasEstimate(request)
  const configure = (config: Partial<QueueConfig>) => transactionQueueManager.configure(config)

  return {
    addTransaction,
    cancelTransaction,
    getStatus,
    clearCompleted,
    getGasEstimate,
    configure,
  }
}
