import { createPublicClient, http, getContract, type PublicClient, type Address } from 'viem'
import { CONTRACTS } from '../../lib/contracts'
import { CACHE_KEYS, SmartCache } from '../cache'
import { persistentActions } from '../../state/usePersistentStore'
import { transactionQueueManager } from './transactionQueue'
import { env } from '../../lib/env'
import { coreMainnet, coreTestnet } from '../../lib/chains'
import MockERC20Abi from '../../abi/MockERC20.json'

// Tipos para allowance management
export interface AllowanceInfo {
  token: Address
  spender: Address
  owner: Address
  currentAllowance: bigint
  requiredAmount: bigint
  needsApproval: boolean
  lastChecked: number
}

export interface AllowanceRequest {
  id: string
  token: Address
  spender: Address
  owner: Address
  amount: bigint
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'failed'
  createdAt: number
  transactionId?: string
}

export interface AllowanceConfig {
  autoApprove: boolean
  maxAutoApproveAmount: bigint
  approvalBuffer: number // Porcentaje de buffer para approvals
  cacheExpiry: number // Tiempo en ms para cache de allowances
  checkBeforeTransaction: boolean
}

// Manager para allowance management
class AllowanceManager {
  private allowances = new Map<string, AllowanceInfo>()
  private pendingRequests = new Map<string, AllowanceRequest>()
  private client: PublicClient
  private config: AllowanceConfig

  constructor() {
    const chain = env.RPC_TESTNET.includes('test') ? coreTestnet : coreMainnet
    const rpc = env.RPC_TESTNET.includes('test') ? env.RPC_TESTNET : env.RPC_MAINNET
    
    this.client = createPublicClient({
      transport: http(rpc),
      chain,
    })

    this.config = {
      autoApprove: true,
      maxAutoApproveAmount: 1000000n * 10n ** 18n, // 1M tokens
      approvalBuffer: 10, // 10% buffer
      cacheExpiry: 5 * 60 * 1000, // 5 minutos
      checkBeforeTransaction: true,
    }
  }

  // Verificar allowance antes de una transacción
  async checkAllowance(
    token: Address,
    spender: Address,
    owner: Address,
    requiredAmount: bigint
  ): Promise<AllowanceInfo> {
    const key = this.getAllowanceKey(token, spender, owner)
    
    // Verificar cache primero
    const cached = this.allowances.get(key)
    if (cached && Date.now() - cached.lastChecked < this.config.cacheExpiry) {
      // Actualizar required amount
      cached.requiredAmount = requiredAmount
      cached.needsApproval = cached.currentAllowance < requiredAmount
      return cached
    }

    try {
      // Obtener allowance actual
      const contract = getContract({
        address: token,
        abi: MockERC20Abi as any,
        client: this.client,
      })

      const currentAllowance = await contract.read.allowance([owner, spender])
      
      // Calcular si necesita approval
      const needsApproval = currentAllowance < requiredAmount
      
      const allowanceInfo: AllowanceInfo = {
        token,
        spender,
        owner,
        currentAllowance,
        requiredAmount,
        needsApproval,
        lastChecked: Date.now(),
      }

      // Actualizar cache
      this.allowances.set(key, allowanceInfo)
      
      // Actualizar cache persistente
      persistentActions.updateAllowanceCache(key, currentAllowance)
      
      return allowanceInfo

    } catch (error) {
      console.error('Error verificando allowance:', error)
      throw new Error('Failed to check allowance')
    }
  }

  // Solicitar approval automático
  async requestApproval(
    token: Address,
    spender: Address,
    owner: Address,
    amount: bigint,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const requestId = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const request: AllowanceRequest = {
      id: requestId,
      token,
      spender,
      owner,
      amount,
      priority,
      status: 'pending',
      createdAt: Date.now(),
    }

    this.pendingRequests.set(requestId, request)

    // Si auto-approve está habilitado y el monto es menor al máximo
    if (this.config.autoApprove && amount <= this.config.maxAutoApproveAmount) {
      await this.executeApproval(request)
    }

    return requestId
  }

  // Ejecutar approval
  private async executeApproval(request: AllowanceRequest) {
    try {
      // Calcular monto con buffer
      const bufferAmount = (request.amount * BigInt(this.config.approvalBuffer)) / 100n
      const approvalAmount = request.amount + bufferAmount

      // Crear transacción de approval
      const approvalRequest = {
        to: request.token,
        data: this.encodeApproveData(request.spender, approvalAmount),
        from: request.owner,
      }

      // Agregar a transaction queue
      const transactionId = await transactionQueueManager.addTransaction(
        'approve',
        approvalRequest,
        request.priority,
        {
          user: request.owner,
          token: request.token,
          spender: request.spender,
          amount: approvalAmount,
        }
      )

      // Actualizar request
      request.transactionId = transactionId
      request.status = 'approved'

      console.log(`✅ Approval ejecutado: ${request.id} (${transactionId})`)

    } catch (error) {
      console.error(`❌ Error ejecutando approval ${request.id}:`, error)
      request.status = 'failed'
    }
  }

  // Verificar y aprobar automáticamente si es necesario
  async ensureAllowance(
    token: Address,
    spender: Address,
    owner: Address,
    amount: bigint
  ): Promise<{ approved: boolean; requestId?: string }> {
    const allowanceInfo = await this.checkAllowance(token, spender, owner, amount)

    if (!allowanceInfo.needsApproval) {
      return { approved: true }
    }

    // Solicitar approval automático
    const requestId = await this.requestApproval(token, spender, owner, amount)
    
    return { approved: false, requestId }
  }

  // Verificar allowance antes de transacción
  async checkBeforeTransaction(
    transactionType: string,
    token: Address,
    spender: Address,
    owner: Address,
    amount: bigint
  ): Promise<boolean> {
    if (!this.config.checkBeforeTransaction) return true

    try {
      const { approved } = await this.ensureAllowance(token, spender, owner, amount)
      return approved
    } catch (error) {
      console.error('Error verificando allowance antes de transacción:', error)
      return false
    }
  }

  // Obtener allowance actual
  async getCurrentAllowance(
    token: Address,
    spender: Address,
    owner: Address
  ): Promise<bigint> {
    const key = this.getAllowanceKey(token, spender, owner)
    const cached = this.allowances.get(key)
    
    if (cached && Date.now() - cached.lastChecked < this.config.cacheExpiry) {
      return cached.currentAllowance
    }

    try {
      const contract = getContract({
        address: token,
        abi: MockERC20Abi as any,
        client: this.client,
      })

      const allowance = await contract.read.allowance([owner, spender])
      
      // Actualizar cache
      this.allowances.set(key, {
        token,
        spender,
        owner,
        currentAllowance: allowance,
        requiredAmount: 0n,
        needsApproval: false,
        lastChecked: Date.now(),
      })

      return allowance

    } catch (error) {
      console.error('Error obteniendo allowance actual:', error)
      return 0n
    }
  }

  // Revocar allowance (set to 0)
  async revokeAllowance(
    token: Address,
    spender: Address,
    owner: Address
  ): Promise<string> {
    return this.requestApproval(token, spender, owner, 0n, 'high')
  }

  // Incrementar allowance existente
  async incrementAllowance(
    token: Address,
    spender: Address,
    owner: Address,
    additionalAmount: bigint
  ): Promise<string> {
    const currentAllowance = await this.getCurrentAllowance(token, spender, owner)
    const newAmount = currentAllowance + additionalAmount
    
    return this.requestApproval(token, spender, owner, newAmount)
  }

  // Obtener estado de requests pendientes
  getPendingRequests(): AllowanceRequest[] {
    return Array.from(this.pendingRequests.values()).filter(
      req => req.status === 'pending'
    )
  }

  // Obtener estadísticas de allowances
  getAllowanceStats() {
    const totalAllowances = this.allowances.size
    const pendingRequests = this.getPendingRequests().length
    const approvedRequests = Array.from(this.pendingRequests.values()).filter(
      req => req.status === 'approved'
    ).length
    const failedRequests = Array.from(this.pendingRequests.values()).filter(
      req => req.status === 'failed'
    ).length

    return {
      totalAllowances,
      pendingRequests,
      approvedRequests,
      failedRequests,
      autoApprove: this.config.autoApprove,
      maxAutoApproveAmount: this.config.maxAutoApproveAmount,
    }
  }

  // Limpiar cache expirado
  clearExpiredCache() {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, allowance] of this.allowances) {
      if (now - allowance.lastChecked > this.config.cacheExpiry) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.allowances.delete(key))
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Limpiados ${expiredKeys.length} allowances expirados`)
    }
  }

  // Configurar allowance manager
  configure(config: Partial<AllowanceConfig>) {
    this.config = { ...this.config, ...config }
    console.log('⚙️ Allowance Manager configurado:', this.config)
  }

  // Utilidades
  private getAllowanceKey(token: Address, spender: Address, owner: Address): string {
    return `${token}-${spender}-${owner}`
  }

  private encodeApproveData(spender: Address, amount: bigint): string {
    // Encode approve function call
    const functionSignature = 'approve(address,uint256)'
    const spenderParam = spender.slice(2).padStart(64, '0') // Remove 0x and pad
    const amountParam = amount.toString(16).padStart(64, '0') // Convert to hex and pad
    
    return `0x${functionSignature}${spenderParam}${amountParam}`
  }

  // Métodos para hooks
  async batchCheckAllowances(checks: Array<{
    token: Address
    spender: Address
    owner: Address
    amount: bigint
  }>): Promise<AllowanceInfo[]> {
    const results = await Promise.all(
      checks.map(check => 
        this.checkAllowance(check.token, check.spender, check.owner, check.amount)
      )
    )
    
    return results
  }

  async batchRequestApprovals(requests: Array<{
    token: Address
    spender: Address
    owner: Address
    amount: bigint
    priority?: 'high' | 'medium' | 'low'
  }>): Promise<string[]> {
    const results = await Promise.all(
      requests.map(req => 
        this.requestApproval(req.token, req.spender, req.owner, req.amount, req.priority)
      )
    )
    
    return results
  }
}

// Instancia global del allowance manager
export const allowanceManager = new AllowanceManager()

// Hook para usar allowance management
export function useAllowanceManager() {
  const checkAllowance = (
    token: Address,
    spender: Address,
    owner: Address,
    amount: bigint
  ) => allowanceManager.checkAllowance(token, spender, owner, amount)

  const requestApproval = (
    token: Address,
    spender: Address,
    owner: Address,
    amount: bigint,
    priority?: 'high' | 'medium' | 'low'
  ) => allowanceManager.requestApproval(token, spender, owner, amount, priority)

  const ensureAllowance = (
    token: Address,
    spender: Address,
    owner: Address,
    amount: bigint
  ) => allowanceManager.ensureAllowance(token, spender, owner, amount)

  const getCurrentAllowance = (
    token: Address,
    spender: Address,
    owner: Address
  ) => allowanceManager.getCurrentAllowance(token, spender, owner)

  const revokeAllowance = (
    token: Address,
    spender: Address,
    owner: Address
  ) => allowanceManager.revokeAllowance(token, spender, owner)

  const incrementAllowance = (
    token: Address,
    spender: Address,
    owner: Address,
    additionalAmount: bigint
  ) => allowanceManager.incrementAllowance(token, spender, owner, additionalAmount)

  const getPendingRequests = () => allowanceManager.getPendingRequests()
  const getStats = () => allowanceManager.getAllowanceStats()
  const clearExpiredCache = () => allowanceManager.clearExpiredCache()
  const configure = (config: Partial<AllowanceConfig>) => allowanceManager.configure(config)

  const batchCheckAllowances = (checks: Array<{
    token: Address
    spender: Address
    owner: Address
    amount: bigint
  }>) => allowanceManager.batchCheckAllowances(checks)

  const batchRequestApprovals = (requests: Array<{
    token: Address
    spender: Address
    owner: Address
    amount: bigint
    priority?: 'high' | 'medium' | 'low'
  }>) => allowanceManager.batchRequestApprovals(requests)

  return {
    checkAllowance,
    requestApproval,
    ensureAllowance,
    getCurrentAllowance,
    revokeAllowance,
    incrementAllowance,
    getPendingRequests,
    getStats,
    clearExpiredCache,
    configure,
    batchCheckAllowances,
    batchRequestApprovals,
  }
}
