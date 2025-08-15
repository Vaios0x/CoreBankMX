import { createPublicClient, http, getContract, type PublicClient, type Address } from 'viem'
import { CONTRACTS } from '../../lib/contracts'
import { CACHE_KEYS, SmartCache } from '../cache'
import { persistentActions } from '../../state/usePersistentStore'
import { optimisticUtils } from '../optimistic'
import { env } from '../../lib/env'
import { coreMainnet, coreTestnet } from '../../lib/chains'

// Import ABIs
import CollateralVaultAbi from '../../abi/CollateralVault.json'
import LoanManagerAbi from '../../abi/LoanManager.json'
import OracleRouterAbi from '../../abi/OracleRouter.json'
import StakingVaultAbi from '../../abi/StakingVault.json'

// Tipos para event listeners
export interface BlockchainEvent {
  type: 'Deposit' | 'Withdraw' | 'Borrow' | 'Repay' | 'Liquidate' | 'PriceUpdate' | 'AllowanceUpdate'
  address: Address
  blockNumber: bigint
  transactionHash: string
  logIndex: number
  args: Record<string, any>
  timestamp: number
}

export interface EventListener {
  id: string
  contract: Address
  eventName: string
  callback: (event: BlockchainEvent) => void
  isActive: boolean
  lastProcessedBlock: bigint
}

// Configuración de eventos por contrato
export const EVENT_CONFIGS = {
  CollateralVault: {
    events: ['DepositCollateral', 'WithdrawCollateral'],
    abi: 'CollateralVault' as const,
    address: CONTRACTS.CollateralVault as Address,
  },
  LoanManager: {
    events: ['Borrow', 'Repay', 'InterestAccrued'],
    abi: 'LoanManager' as const,
    address: CONTRACTS.LoanManager as Address,
  },
  LiquidationModule: {
    events: ['Liquidate'],
    abi: 'LiquidationModule' as const,
    address: CONTRACTS.LiquidationModule as Address,
  },
  OracleRouter: {
    events: ['PriceUpdated'],
    abi: 'OracleRouter' as const,
    address: CONTRACTS.OracleRouter as Address,
  },
  StakingVault: {
    events: ['Deposit', 'Withdraw', 'Compound'],
    abi: 'StakingVault' as const,
    address: CONTRACTS.DualStakingVault as Address,
  },
} as const

// Manager para event listeners
class BlockchainEventManager {
  private listeners = new Map<string, EventListener>()
  private client: PublicClient
  private isRunning = false
  private pollInterval = 2000 // 2 segundos
  private maxBlockRange = 1000n
  private retryAttempts = 3
  private retryDelay = 1000

  constructor() {
    const chain = env.RPC_TESTNET.includes('test') ? coreTestnet : coreMainnet
    const rpc = env.RPC_TESTNET.includes('test') ? env.RPC_TESTNET : env.RPC_MAINNET
    
    this.client = createPublicClient({
      transport: http(rpc),
      chain,
    })
  }

  // Iniciar el sistema de event listeners
  async start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('🚀 Iniciando Blockchain Event Manager...')
    
    // Iniciar polling de eventos
    this.startEventPolling()
    
    // Configurar listeners por defecto
    await this.setupDefaultListeners()
  }

  // Detener el sistema
  stop() {
    this.isRunning = false
    console.log('⏹️ Deteniendo Blockchain Event Manager...')
  }

  // Configurar listeners por defecto
  private async setupDefaultListeners() {
    // Listener para eventos de colateral
    this.addListener({
      id: 'collateral-events',
      contract: EVENT_CONFIGS.CollateralVault.address,
      eventName: 'DepositCollateral',
      callback: this.handleCollateralEvent.bind(this),
      isActive: true,
      lastProcessedBlock: 0n,
    })

    this.addListener({
      id: 'collateral-withdraw-events',
      contract: EVENT_CONFIGS.CollateralVault.address,
      eventName: 'WithdrawCollateral',
      callback: this.handleCollateralEvent.bind(this),
      isActive: true,
      lastProcessedBlock: 0n,
    })

    // Listener para eventos de préstamos
    this.addListener({
      id: 'loan-borrow-events',
      contract: EVENT_CONFIGS.LoanManager.address,
      eventName: 'Borrow',
      callback: this.handleLoanEvent.bind(this),
      isActive: true,
      lastProcessedBlock: 0n,
    })

    this.addListener({
      id: 'loan-repay-events',
      contract: EVENT_CONFIGS.LoanManager.address,
      eventName: 'Repay',
      callback: this.handleLoanEvent.bind(this),
      isActive: true,
      lastProcessedBlock: 0n,
    })

    // Listener para liquidaciones
    this.addListener({
      id: 'liquidation-events',
      contract: EVENT_CONFIGS.LiquidationModule.address,
      eventName: 'Liquidate',
      callback: this.handleLiquidationEvent.bind(this),
      isActive: true,
      lastProcessedBlock: 0n,
    })

    // Listener para actualizaciones de precio
    this.addListener({
      id: 'price-update-events',
      contract: EVENT_CONFIGS.OracleRouter.address,
      eventName: 'PriceUpdated',
      callback: this.handlePriceUpdateEvent.bind(this),
      isActive: true,
      lastProcessedBlock: 0n,
    })

    // Listener para eventos de staking
    this.addListener({
      id: 'staking-events',
      contract: EVENT_CONFIGS.StakingVault.address,
      eventName: 'Deposit',
      callback: this.handleStakingEvent.bind(this),
      isActive: true,
      lastProcessedBlock: 0n,
    })
  }

  // Agregar listener personalizado
  addListener(listener: EventListener) {
    this.listeners.set(listener.id, listener)
    console.log(`📡 Agregado listener: ${listener.id} para ${listener.eventName}`)
  }

  // Remover listener
  removeListener(id: string) {
    const listener = this.listeners.get(id)
    if (listener) {
      listener.isActive = false
      this.listeners.delete(id)
      console.log(`🗑️ Removido listener: ${id}`)
    }
  }

  // Iniciar polling de eventos
  private startEventPolling() {
    const pollEvents = async () => {
      if (!this.isRunning) return

      try {
        await this.processEvents()
      } catch (error) {
        console.error('Error en polling de eventos:', error)
      }

      // Continuar polling
      setTimeout(pollEvents, this.pollInterval)
    }

    pollEvents()
  }

  // Procesar eventos
  private async processEvents() {
    const currentBlock = await this.client.getBlockNumber()
    
    for (const [id, listener] of this.listeners) {
      if (!listener.isActive) continue

      try {
        const fromBlock = listener.lastProcessedBlock + 1n
        const toBlock = currentBlock

        if (fromBlock > toBlock) continue

        // Limitar el rango de bloques para evitar timeouts
        const actualToBlock = fromBlock + this.maxBlockRange > toBlock 
          ? toBlock 
          : fromBlock + this.maxBlockRange

        const events = await this.getEvents(listener, fromBlock, actualToBlock)
        
        for (const event of events) {
          await this.processEvent(listener, event)
        }

        // Actualizar último bloque procesado
        listener.lastProcessedBlock = actualToBlock

      } catch (error) {
        console.error(`Error procesando listener ${id}:`, error)
      }
    }
  }

  // Obtener eventos del contrato
  private async getEvents(listener: EventListener, fromBlock: bigint, toBlock: bigint) {
    const contract = getContract({
      address: listener.contract,
      abi: this.getAbiForContract(listener.contract),
      client: this.client,
    })

    const logs = await this.client.getLogs({
      address: listener.contract,
      event: {
        type: 'event',
        name: listener.eventName,
        inputs: this.getEventInputs(listener.eventName),
      } as any,
      fromBlock,
      toBlock,
    })

    return logs.map(log => ({
      type: this.mapEventType(listener.eventName),
      address: listener.contract,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      args: (log as any).args || {},
      timestamp: Date.now(), // En producción, obtener del bloque
    }))
  }

  // Procesar evento individual
  private async processEvent(listener: EventListener, event: BlockchainEvent) {
    try {
      // Ejecutar callback del listener
      await listener.callback(event)

      // Actualizar caches relacionados
      await this.updateRelatedCaches(event)

      console.log(`📡 Evento procesado: ${event.type} en ${event.transactionHash}`)

    } catch (error) {
      console.error(`Error procesando evento ${event.type}:`, error)
    }
  }

  // Actualizar caches relacionados
  private async updateRelatedCaches(event: BlockchainEvent) {
    switch (event.type) {
      case 'Deposit':
      case 'Withdraw':
        // Invalidar caches de posición y balance
        if (event.args.user) {
          SmartCache.invalidate(CACHE_KEYS.USER_POSITION(event.args.user))
          SmartCache.invalidate(CACHE_KEYS.USER_BALANCE(event.args.user, 'all'))
        }
        break

      case 'Borrow':
      case 'Repay':
        // Invalidar caches de posición y métricas
        if (event.args.user) {
          SmartCache.invalidate(CACHE_KEYS.USER_POSITION(event.args.user))
          SmartCache.invalidate(CACHE_KEYS.MARKET_METRICS())
        }
        break

      case 'Liquidate':
        // Invalidar caches de liquidaciones y métricas
        SmartCache.invalidate(CACHE_KEYS.LIQUIDATIONS())
        SmartCache.invalidate(CACHE_KEYS.MARKET_METRICS())
        break

      case 'PriceUpdate':
        // Actualizar cache de precios
        if (event.args.token && event.args.price) {
          const price = Number(event.args.price) / 1e18
          persistentActions.updatePriceCache(
            event.args.token,
            price,
            'onchain'
          )
        }
        break
    }
  }

  // Handlers específicos para cada tipo de evento
  private async handleCollateralEvent(event: BlockchainEvent) {
    const { user, amount } = event.args
    
    // Actualizar posición optimísticamente
    if (user && amount) {
      const amountValue = Number(amount) / 1e18
      
      if (event.type === 'Deposit') {
        optimisticUtils.createUpdate('deposit', {
          user,
          amount: amountValue,
          token: 'LSTBTC',
          price: await this.getCurrentPrice(),
        })
      } else if (event.type === 'Withdraw') {
        optimisticUtils.createUpdate('withdraw', {
          user,
          amount: amountValue,
          token: 'LSTBTC',
          price: await this.getCurrentPrice(),
        })
      }
    }
  }

  private async handleLoanEvent(event: BlockchainEvent) {
    const { user, amount } = event.args
    
    if (user && amount) {
      const amountValue = Number(amount) / 1e18
      
      if (event.type === 'Borrow') {
        optimisticUtils.createUpdate('borrow', {
          user,
          amount: amountValue,
          token: 'USDT',
          collateralPrice: await this.getCurrentPrice(),
        })
      } else if (event.type === 'Repay') {
        optimisticUtils.createUpdate('repay', {
          user,
          amount: amountValue,
          token: 'USDT',
          collateralPrice: await this.getCurrentPrice(),
        })
      }
    }
  }

  private async handleLiquidationEvent(event: BlockchainEvent) {
    const { user, repayAmount, collateralSeized, incentive } = event.args
    
    // Agregar a historial de liquidaciones
    const liquidation = {
      tx: event.transactionHash,
      user,
      repayAmount: Number(repayAmount) / 1e18,
      collateralSeized: Number(collateralSeized) / 1e18,
      incentive: Number(incentive) / 1e18,
      blockNumber: Number(event.blockNumber),
    }

    // Actualizar cache de liquidaciones
    const currentLiquidations = SmartCache.getData(CACHE_KEYS.LIQUIDATIONS()) || []
    const liquidationsArray = Array.isArray(currentLiquidations) ? currentLiquidations : []
    SmartCache.setOptimistic(CACHE_KEYS.LIQUIDATIONS(), [liquidation, ...liquidationsArray])
  }

  private async handlePriceUpdateEvent(event: BlockchainEvent) {
    const { token, price } = event.args
    
    if (token && price) {
      const priceValue = Number(price) / 1e18
      
      // Actualizar cache de precios
      persistentActions.updatePriceCache(token, priceValue, 'onchain')
      
      // Invalidar caches relacionados
      SmartCache.invalidate(CACHE_KEYS.MARKET_METRICS())
      SmartCache.invalidate(CACHE_KEYS.USER_POSITION('all'))
    }
  }

  private async handleStakingEvent(event: BlockchainEvent) {
    const { owner, assets } = event.args
    
    if (owner && assets) {
      const amountValue = Number(assets) / 1e18
      
      if (event.type === 'Deposit') {
        optimisticUtils.createUpdate('stake', {
          user: owner,
          amount: amountValue,
          token: 'LSTBTC',
        })
      } else if (event.type === 'Withdraw') {
        optimisticUtils.createUpdate('unstake', {
          user: owner,
          amount: amountValue,
          token: 'LSTBTC',
        })
      }
    }
  }

  // Utilidades
  private getAbiForContract(address: Address) {
    // Mapear dirección a ABI correspondiente
    const abiMap: Record<string, any> = {
      [CONTRACTS.CollateralVault]: CollateralVaultAbi,
      [CONTRACTS.LoanManager]: LoanManagerAbi,
      [CONTRACTS.LiquidationModule]: [], // LiquidationModule no tiene ABI público
      [CONTRACTS.OracleRouter]: OracleRouterAbi,
      [CONTRACTS.DualStakingVault]: StakingVaultAbi,
    }
    
    return abiMap[address] || []
  }

  private getEventInputs(eventName: string) {
    // Definir inputs para cada evento
    const eventInputs: Record<string, any[]> = {
      DepositCollateral: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
      ],
      WithdrawCollateral: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
      ],
      Borrow: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
      ],
      Repay: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
      ],
      Liquidate: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'repayAmount', type: 'uint256' },
        { indexed: false, name: 'collateralSeized', type: 'uint256' },
        { indexed: false, name: 'incentive', type: 'uint256' },
      ],
      PriceUpdated: [
        { indexed: true, name: 'token', type: 'address' },
        { indexed: false, name: 'price', type: 'uint256' },
        { indexed: false, name: 'timestamp', type: 'uint256' },
      ],
      Deposit: [
        { indexed: true, name: 'caller', type: 'address' },
        { indexed: true, name: 'owner', type: 'address' },
        { indexed: false, name: 'assets', type: 'uint256' },
        { indexed: false, name: 'shares', type: 'uint256' },
      ],
      Withdraw: [
        { indexed: true, name: 'caller', type: 'address' },
        { indexed: true, name: 'receiver', type: 'address' },
        { indexed: true, name: 'owner', type: 'address' },
        { indexed: false, name: 'assets', type: 'uint256' },
        { indexed: false, name: 'shares', type: 'uint256' },
      ],
    }
    
    return eventInputs[eventName] || []
  }

  private mapEventType(eventName: string): BlockchainEvent['type'] {
    const typeMap: Record<string, BlockchainEvent['type']> = {
      DepositCollateral: 'Deposit',
      WithdrawCollateral: 'Withdraw',
      Borrow: 'Borrow',
      Repay: 'Repay',
      Liquidate: 'Liquidate',
      PriceUpdated: 'PriceUpdate',
      Deposit: 'Deposit',
      Withdraw: 'Withdraw',
    }
    
    return typeMap[eventName] || 'Deposit'
  }

  private async getCurrentPrice(): Promise<number> {
    try {
      const priceData = SmartCache.getData(CACHE_KEYS.ORACLE_PRICE('BTC'))
      return typeof priceData === 'number' ? priceData : 60000
    } catch {
      return 60000
    }
  }

  // Métodos públicos para control
  getActiveListeners() {
    return Array.from(this.listeners.values()).filter(l => l.isActive)
  }

  getListenerStats() {
    const active = this.getActiveListeners()
    return {
      total: this.listeners.size,
      active: active.length,
      listeners: active.map(l => ({
        id: l.id,
        contract: l.contract,
        eventName: l.eventName,
        lastProcessedBlock: l.lastProcessedBlock,
      })),
    }
  }
}

// Instancia global del event manager
export const blockchainEventManager = new BlockchainEventManager()

// Hook para usar event listeners
export function useBlockchainEvents() {
  const startEvents = () => blockchainEventManager.start()
  const stopEvents = () => blockchainEventManager.stop()
  const getStats = () => blockchainEventManager.getListenerStats()
  const addListener = (listener: EventListener) => blockchainEventManager.addListener(listener)
  const removeListener = (id: string) => blockchainEventManager.removeListener(id)

  return {
    startEvents,
    stopEvents,
    getStats,
    addListener,
    removeListener,
  }
}
