import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

// Tipos para el sistema de referral
export interface ReferralData {
  // Información del referidor
  referrer: {
    address: string
    code: string
    totalReferrals: number
    totalEarnings: number
    activeReferrals: number
    commissionRate: number
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
    joinedAt: number
  }
  
  // Información del referido
  referred: {
    address: string
    referrerCode: string
    referrerAddress: string
    joinedAt: number
    totalVolume: number
    lastActivity: number
    status: 'active' | 'inactive' | 'suspended'
  }
  
  // Historial de comisiones
  commissionHistory: {
    id: string
    referrerAddress: string
    referredAddress: string
    transactionHash: string
    amount: number
    commission: number
    type: 'borrow' | 'stake' | 'trade' | 'liquidation'
    timestamp: number
    status: 'pending' | 'paid' | 'failed'
  }[]
  
  // Códigos de referral generados
  referralCodes: {
    code: string
    address: string
    usageCount: number
    totalEarnings: number
    createdAt: number
    isActive: boolean
  }[]
  
  // Configuración del sistema
  config: {
    baseCommissionRate: number
    maxCommissionRate: number
    minimumPayout: number
    referralBonus: number
    levels: {
      bronze: { minReferrals: 0, commissionRate: 0.05 }
      silver: { minReferrals: 5, commissionRate: 0.075 }
      gold: { minReferrals: 15, commissionRate: 0.10 }
      platinum: { minReferrals: 50, commissionRate: 0.125 }
      diamond: { minReferrals: 100, commissionRate: 0.15 }
    }
  }
}

// Estado inicial
const initialState: ReferralData = {
  referrer: {
    address: '',
    code: '',
    totalReferrals: 0,
    totalEarnings: 0,
    activeReferrals: 0,
    commissionRate: 0.05,
    level: 'bronze',
    joinedAt: 0
  },
  referred: {
    address: '',
    referrerCode: '',
    referrerAddress: '',
    joinedAt: 0,
    totalVolume: 0,
    lastActivity: 0,
    status: 'inactive'
  },
  commissionHistory: [],
  referralCodes: [],
  config: {
    baseCommissionRate: 0.05,
    maxCommissionRate: 0.15,
    minimumPayout: 10,
    referralBonus: 5,
    levels: {
      bronze: { minReferrals: 0, commissionRate: 0.05 },
      silver: { minReferrals: 5, commissionRate: 0.075 },
      gold: { minReferrals: 15, commissionRate: 0.10 },
      platinum: { minReferrals: 50, commissionRate: 0.125 },
      diamond: { minReferrals: 100, commissionRate: 0.15 }
    }
  }
}

// Store principal
export const useReferralStore = create<ReferralData & {
  // Acciones
  actions: {
    // Generar código de referral
    generateReferralCode: (address: string) => string
    
    // Registrar referido
    registerReferral: (referrerCode: string, referredAddress: string) => void
    
    // Calcular comisión
    calculateCommission: (amount: number, referrerAddress: string) => number
    
    // Registrar transacción con comisión
    recordCommission: (data: {
      referrerAddress: string
      referredAddress: string
      transactionHash: string
      amount: number
      type: 'borrow' | 'stake' | 'trade' | 'liquidation'
    }) => void
    
    // Actualizar nivel del referidor
    updateReferrerLevel: (address: string) => void
    
    // Obtener estadísticas
    getReferralStats: (address: string) => {
      totalReferrals: number
      activeReferrals: number
      totalEarnings: number
      level: string
      nextLevel: string | null
      progressToNextLevel: number
    }
    
    // Validar código de referral
    validateReferralCode: (code: string) => boolean
    
    // Obtener historial de comisiones
    getCommissionHistory: (address: string, limit?: number) => any[]
    
    // Calcular ganancias totales
    calculateTotalEarnings: (address: string) => number
    
    // Obtener referidos activos
    getActiveReferrals: (address: string) => any[]
    
    // Resetear estado
    reset: () => void
  }
}>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      actions: {
        // Generar código de referral único
        generateReferralCode: (address: string) => {
          const code = `${address.slice(0, 6)}${Date.now().toString(36)}`.toUpperCase()
          
          set((state) => ({
            referralCodes: [
              ...state.referralCodes,
              {
                code,
                address,
                usageCount: 0,
                totalEarnings: 0,
                createdAt: Date.now(),
                isActive: true
              }
            ]
          }))
          
          return code
        },
        
        // Registrar nuevo referido
        registerReferral: (referrerCode: string, referredAddress: string) => {
          const referrerCodeData = get().referralCodes.find(c => c.code === referrerCode)
          
          if (!referrerCodeData) {
            throw new Error('Código de referral inválido')
          }
          
          // Verificar que no se auto-referencie
          if (referrerCodeData.address.toLowerCase() === referredAddress.toLowerCase()) {
            throw new Error('No puedes referirte a ti mismo')
          }
          
          // Verificar que no esté ya referido
          const existingReferral = get().commissionHistory.find(
            c => c.referredAddress.toLowerCase() === referredAddress.toLowerCase()
          )
          
          if (existingReferral) {
            throw new Error('Esta dirección ya está referida')
          }
          
          set((state) => ({
            referred: {
              address: referredAddress,
              referrerCode,
              referrerAddress: referrerCodeData.address,
              joinedAt: Date.now(),
              totalVolume: 0,
              lastActivity: Date.now(),
              status: 'active'
            },
            referralCodes: state.referralCodes.map(c => 
              c.code === referrerCode 
                ? { ...c, usageCount: c.usageCount + 1 }
                : c
            )
          }))
          
          // Actualizar nivel del referidor
          get().actions.updateReferrerLevel(referrerCodeData.address)
        },
        
        // Calcular comisión basada en nivel
        calculateCommission: (amount: number, referrerAddress: string) => {
          const referrer = get().referralCodes.find(c => c.address === referrerAddress)
          if (!referrer) return 0
          
          const level = get().referrer.level
          const commissionRate = get().config.levels[level].commissionRate
          
          return amount * commissionRate
        },
        
        // Registrar transacción con comisión
        recordCommission: (data) => {
          const commission = get().actions.calculateCommission(data.amount, data.referrerAddress)
          
          if (commission <= 0) return
          
          const commissionRecord = {
            id: `${data.transactionHash}-${Date.now()}`,
            referrerAddress: data.referrerAddress,
            referredAddress: data.referredAddress,
            transactionHash: data.transactionHash,
            amount: data.amount,
            commission,
            type: data.type,
            timestamp: Date.now(),
            status: 'pending' as const
          }
          
          set((state) => ({
            commissionHistory: [commissionRecord, ...state.commissionHistory],
            referralCodes: state.referralCodes.map(c => 
              c.address === data.referrerAddress
                ? { ...c, totalEarnings: c.totalEarnings + commission }
                : c
            )
          }))
        },
        
        // Actualizar nivel del referidor
        updateReferrerLevel: (address: string) => {
          const stats = get().actions.getReferralStats(address)
          const levels = get().config.levels
          
          let newLevel = 'bronze' as const
          
          if (stats.totalReferrals >= levels.diamond.minReferrals) {
            newLevel = 'diamond'
          } else if (stats.totalReferrals >= levels.platinum.minReferrals) {
            newLevel = 'platinum'
          } else if (stats.totalReferrals >= levels.gold.minReferrals) {
            newLevel = 'gold'
          } else if (stats.totalReferrals >= levels.silver.minReferrals) {
            newLevel = 'silver'
          }
          
          set((state) => ({
            referrer: {
              ...state.referrer,
              level: newLevel,
              commissionRate: levels[newLevel].commissionRate
            }
          }))
        },
        
        // Obtener estadísticas del referidor
        getReferralStats: (address: string) => {
          const referrer = get().referralCodes.find(c => c.address === address)
          if (!referrer) {
            return {
              totalReferrals: 0,
              activeReferrals: 0,
              totalEarnings: 0,
              level: 'bronze',
              nextLevel: 'silver',
              progressToNextLevel: 0
            }
          }
          
          const activeReferrals = get().commissionHistory.filter(
            c => c.referrerAddress === address && c.status === 'paid'
          ).length
          
          const levels = get().config.levels
          const currentLevel = get().referrer.level
          const currentLevelData = levels[currentLevel]
          
          let nextLevel: string | null = null
          let progressToNextLevel = 0
          
          if (currentLevel === 'bronze' && referrer.usageCount < levels.silver.minReferrals) {
            nextLevel = 'silver'
            progressToNextLevel = (referrer.usageCount / levels.silver.minReferrals) * 100
          } else if (currentLevel === 'silver' && referrer.usageCount < levels.gold.minReferrals) {
            nextLevel = 'gold'
            progressToNextLevel = (referrer.usageCount / levels.gold.minReferrals) * 100
          } else if (currentLevel === 'gold' && referrer.usageCount < levels.platinum.minReferrals) {
            nextLevel = 'platinum'
            progressToNextLevel = (referrer.usageCount / levels.platinum.minReferrals) * 100
          } else if (currentLevel === 'platinum' && referrer.usageCount < levels.diamond.minReferrals) {
            nextLevel = 'diamond'
            progressToNextLevel = (referrer.usageCount / levels.diamond.minReferrals) * 100
          }
          
          return {
            totalReferrals: referrer.usageCount,
            activeReferrals,
            totalEarnings: referrer.totalEarnings,
            level: currentLevel,
            nextLevel,
            progressToNextLevel
          }
        },
        
        // Validar código de referral
        validateReferralCode: (code: string) => {
          return get().referralCodes.some(c => c.code === code && c.isActive)
        },
        
        // Obtener historial de comisiones
        getCommissionHistory: (address: string, limit = 50) => {
          return get().commissionHistory
            .filter(c => c.referrerAddress === address)
            .slice(0, limit)
        },
        
        // Calcular ganancias totales
        calculateTotalEarnings: (address: string) => {
          return get().commissionHistory
            .filter(c => c.referrerAddress === address && c.status === 'paid')
            .reduce((total, c) => total + c.commission, 0)
        },
        
        // Obtener referidos activos
        getActiveReferrals: (address: string) => {
          const referrals = get().commissionHistory
            .filter(c => c.referrerAddress === address)
            .map(c => c.referredAddress)
          
          return [...new Set(referrals)]
        },
        
        // Resetear estado
        reset: () => set(initialState)
      }
    })),
    {
      name: 'referral-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        referrer: state.referrer,
        referred: state.referred,
        commissionHistory: state.commissionHistory,
        referralCodes: state.referralCodes,
        config: state.config
      })
    }
  )
)
