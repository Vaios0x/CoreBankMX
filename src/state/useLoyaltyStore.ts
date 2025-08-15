import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

// Tipos para el sistema de loyalty
export interface LoyaltyData {
  // Información del usuario
  user: {
    address: string
    points: number
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
    totalPointsEarned: number
    totalPointsSpent: number
    joinedAt: number
    lastActivity: number
    streak: number
    achievements: string[]
  }
  
  // Historial de puntos
  pointsHistory: {
    id: string
    type: 'earned' | 'spent' | 'expired' | 'bonus'
    amount: number
    reason: string
    transactionHash?: string
    timestamp: number
    metadata?: any
  }[]
  
  // Recompensas disponibles
  rewards: {
    id: string
    name: string
    description: string
    pointsCost: number
    type: 'discount' | 'bonus' | 'nft' | 'cashback' | 'feature'
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
    isActive: boolean
    maxRedemptions: number
    currentRedemptions: number
    expiresAt?: number
  }[]
  
  // Recompensas reclamadas
  claimedRewards: {
    id: string
    rewardId: string
    address: string
    claimedAt: number
    status: 'active' | 'used' | 'expired'
    metadata?: any
  }[]
  
  // Logros y badges
  achievements: {
    id: string
    name: string
    description: string
    icon: string
    pointsReward: number
    criteria: {
      type: 'transactions' | 'volume' | 'streak' | 'referrals' | 'custom'
      value: number
      timeframe?: number
    }
    isUnlocked: boolean
    unlockedAt?: number
  }[]
  
  // Configuración del sistema
  config: {
    // Puntos por actividad
    pointsPerActivity: {
      borrow: number
      repay: number
      stake: number
      unstake: number
      trade: number
      referral: number
      dailyLogin: number
      weeklyStreak: number
    }
    
    // Multiplicadores por nivel
    levelMultipliers: {
      bronze: number
      silver: number
      gold: number
      platinum: number
      diamond: number
    }
    
    // Requisitos de nivel
    levelRequirements: {
      bronze: { minPoints: 0, minTransactions: 0 }
      silver: { minPoints: 1000, minTransactions: 5 }
      gold: { minPoints: 5000, minTransactions: 20 }
      platinum: { minPoints: 15000, minTransactions: 50 }
      diamond: { minPoints: 50000, minTransactions: 100 }
    }
    
    // Configuración de expiración
    pointsExpiration: {
      enabled: boolean
      daysToExpire: number
      gracePeriod: number
    }
    
    // Configuración de streak
    streakConfig: {
      maxStreak: number
      bonusMultiplier: number
      resetAfterDays: number
    }
  }
}

// Estado inicial
const initialState: LoyaltyData = {
  user: {
    address: '',
    points: 0,
    level: 'bronze',
    totalPointsEarned: 0,
    totalPointsSpent: 0,
    joinedAt: 0,
    lastActivity: 0,
    streak: 0,
    achievements: []
  },
  pointsHistory: [],
  rewards: [
    {
      id: 'welcome-bonus',
      name: 'Bono de Bienvenida',
      description: '5% de descuento en tu primera transacción',
      pointsCost: 0,
      type: 'discount',
      level: 'bronze',
      isActive: true,
      maxRedemptions: 1,
      currentRedemptions: 0
    },
    {
      id: 'fee-reduction',
      name: 'Reducción de Comisiones',
      description: '10% de reducción en comisiones por 30 días',
      pointsCost: 500,
      type: 'discount',
      level: 'silver',
      isActive: true,
      maxRedemptions: 10,
      currentRedemptions: 0
    },
    {
      id: 'cashback-bonus',
      name: 'Cashback Extra',
      description: '1% adicional de cashback en todas las transacciones',
      pointsCost: 1000,
      type: 'cashback',
      level: 'gold',
      isActive: true,
      maxRedemptions: 5,
      currentRedemptions: 0
    },
    {
      id: 'premium-features',
      name: 'Características Premium',
      description: 'Acceso a características avanzadas por 7 días',
      pointsCost: 2000,
      type: 'feature',
      level: 'platinum',
      isActive: true,
      maxRedemptions: 3,
      currentRedemptions: 0
    },
    {
      id: 'exclusive-nft',
      name: 'NFT Exclusivo',
      description: 'NFT único de Diamond Member',
      pointsCost: 10000,
      type: 'nft',
      level: 'diamond',
      isActive: true,
      maxRedemptions: 1,
      currentRedemptions: 0
    }
  ],
  claimedRewards: [],
  achievements: [
    {
      id: 'first-transaction',
      name: 'Primer Paso',
      description: 'Completa tu primera transacción',
      icon: '🎯',
      pointsReward: 100,
      criteria: { type: 'transactions', value: 1 },
      isUnlocked: false
    },
    {
      id: 'volume-master',
      name: 'Maestro del Volumen',
      description: 'Alcanza $10,000 en volumen total',
      icon: '📈',
      pointsReward: 500,
      criteria: { type: 'volume', value: 10000 },
      isUnlocked: false
    },
    {
      id: 'streak-champion',
      name: 'Campeón de Racha',
      description: 'Mantén una racha de 7 días',
      icon: '🔥',
      pointsReward: 300,
      criteria: { type: 'streak', value: 7 },
      isUnlocked: false
    },
    {
      id: 'referral-king',
      name: 'Rey de los Referidos',
      description: 'Invita a 10 usuarios',
      icon: '👑',
      pointsReward: 1000,
      criteria: { type: 'referrals', value: 10 },
      isUnlocked: false
    },
    {
      id: 'diamond-status',
      name: 'Estado Diamante',
      description: 'Alcanza el nivel Diamond',
      icon: '💎',
      pointsReward: 5000,
      criteria: { type: 'custom', value: 1 },
      isUnlocked: false
    }
  ],
  config: {
    pointsPerActivity: {
      borrow: 50,
      repay: 30,
      stake: 40,
      unstake: 20,
      trade: 25,
      referral: 100,
      dailyLogin: 10,
      weeklyStreak: 50
    },
    levelMultipliers: {
      bronze: 1.0,
      silver: 1.2,
      gold: 1.5,
      platinum: 2.0,
      diamond: 3.0
    },
    levelRequirements: {
      bronze: { minPoints: 0, minTransactions: 0 },
      silver: { minPoints: 1000, minTransactions: 5 },
      gold: { minPoints: 5000, minTransactions: 20 },
      platinum: { minPoints: 15000, minTransactions: 50 },
      diamond: { minPoints: 50000, minTransactions: 100 }
    },
    pointsExpiration: {
      enabled: true,
      daysToExpire: 365,
      gracePeriod: 30
    },
    streakConfig: {
      maxStreak: 30,
      bonusMultiplier: 0.5,
      resetAfterDays: 2
    }
  }
}

// Store principal
export const useLoyaltyStore = create<LoyaltyData & {
  actions: {
    // Ganar puntos
    earnPoints: (amount: number, reason: string, metadata?: any) => void
    
    // Gastar puntos
    spendPoints: (amount: number, reason: string, metadata?: any) => boolean
    
    // Actualizar nivel
    updateLevel: (address: string) => void
    
    // Reclamar recompensa
    claimReward: (rewardId: string, address: string) => boolean
    
    // Usar recompensa
    useReward: (claimedRewardId: string) => boolean
    
    // Verificar logros
    checkAchievements: (address: string) => void
    
    // Actualizar streak
    updateStreak: (address: string) => void
    
    // Obtener estadísticas
    getLoyaltyStats: (address: string) => {
      points: number
      level: string
      nextLevel: string | null
      progressToNextLevel: number
      streak: number
      achievements: number
      totalRewards: number
    }
    
    // Obtener recompensas disponibles
    getAvailableRewards: (level: string) => any[]
    
    // Obtener historial de puntos
    getPointsHistory: (address: string, limit?: number) => any[]
    
    // Calcular puntos con multiplicadores
    calculatePoints: (basePoints: number, activity: string) => number
    
    // Verificar expiración de puntos
    checkPointsExpiration: () => void
    
    // Resetear estado
    reset: () => void
  }
}>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      actions: {
        // Ganar puntos con multiplicadores
        earnPoints: (amount: number, reason: string, metadata?: any) => {
          const currentLevel = get().user.level
          const multiplier = get().config.levelMultipliers[currentLevel]
          const finalAmount = Math.floor(amount * multiplier)
          
          set((state) => ({
            user: {
              ...state.user,
              points: state.user.points + finalAmount,
              totalPointsEarned: state.user.totalPointsEarned + finalAmount,
              lastActivity: Date.now()
            },
            pointsHistory: [
              {
                id: `earn-${Date.now()}`,
                type: 'earned',
                amount: finalAmount,
                reason,
                timestamp: Date.now(),
                metadata
              },
              ...state.pointsHistory
            ]
          }))
          
          // Verificar logros después de ganar puntos
          get().actions.checkAchievements(get().user.address)
        },
        
        // Gastar puntos
        spendPoints: (amount: number, reason: string, metadata?: any) => {
          const currentPoints = get().user.points
          
          if (currentPoints < amount) {
            return false
          }
          
          set((state) => ({
            user: {
              ...state.user,
              points: state.user.points - amount,
              totalPointsSpent: state.user.totalPointsSpent + amount
            },
            pointsHistory: [
              {
                id: `spend-${Date.now()}`,
                type: 'spent',
                amount,
                reason,
                timestamp: Date.now(),
                metadata
              },
              ...state.pointsHistory
            ]
          }))
          
          return true
        },
        
        // Actualizar nivel basado en puntos y transacciones
        updateLevel: (address: string) => {
          const user = get().user
          const requirements = get().config.levelRequirements
          const pointsHistory = get().pointsHistory
          
          // Contar transacciones
          const transactions = pointsHistory.filter(
            p => p.type === 'earned' && ['borrow', 'repay', 'stake', 'unstake', 'trade'].includes(p.reason)
          ).length
          
          let newLevel = 'bronze' as const
          
          if (user.totalPointsEarned >= requirements.diamond.minPoints && transactions >= requirements.diamond.minTransactions) {
            newLevel = 'diamond'
          } else if (user.totalPointsEarned >= requirements.platinum.minPoints && transactions >= requirements.platinum.minTransactions) {
            newLevel = 'platinum'
          } else if (user.totalPointsEarned >= requirements.gold.minPoints && transactions >= requirements.gold.minTransactions) {
            newLevel = 'gold'
          } else if (user.totalPointsEarned >= requirements.silver.minPoints && transactions >= requirements.silver.minTransactions) {
            newLevel = 'silver'
          }
          
          if (newLevel !== user.level) {
            set((state) => ({
              user: {
                ...state.user,
                level: newLevel
              }
            }))
            
            // Verificar logros después de cambio de nivel
            get().actions.checkAchievements(address)
          }
        },
        
        // Reclamar recompensa
        claimReward: (rewardId: string, address: string) => {
          const reward = get().rewards.find(r => r.id === rewardId)
          const user = get().user
          
          if (!reward || !reward.isActive) {
            return false
          }
          
          if (user.points < reward.pointsCost) {
            return false
          }
          
          if (reward.currentRedemptions >= reward.maxRedemptions) {
            return false
          }
          
          // Verificar nivel requerido
          const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
          const userLevelIndex = levelOrder.indexOf(user.level)
          const requiredLevelIndex = levelOrder.indexOf(reward.level)
          
          if (userLevelIndex < requiredLevelIndex) {
            return false
          }
          
          // Gastar puntos
          if (!get().actions.spendPoints(reward.pointsCost, `Recompensa: ${reward.name}`)) {
            return false
          }
          
          // Registrar recompensa reclamada
          set((state) => ({
            claimedRewards: [
              {
                id: `claim-${Date.now()}`,
                rewardId,
                address,
                claimedAt: Date.now(),
                status: 'active'
              },
              ...state.claimedRewards
            ],
            rewards: state.rewards.map(r => 
              r.id === rewardId 
                ? { ...r, currentRedemptions: r.currentRedemptions + 1 }
                : r
            )
          }))
          
          return true
        },
        
        // Usar recompensa reclamada
        useReward: (claimedRewardId: string) => {
          const claimedReward = get().claimedRewards.find(cr => cr.id === claimedRewardId)
          
          if (!claimedReward || claimedReward.status !== 'active') {
            return false
          }
          
          set((state) => ({
            claimedRewards: state.claimedRewards.map(cr => 
              cr.id === claimedRewardId 
                ? { ...cr, status: 'used' }
                : cr
            )
          }))
          
          return true
        },
        
        // Verificar y desbloquear logros
        checkAchievements: (address: string) => {
          const user = get().user
          const pointsHistory = get().pointsHistory
          const achievements = get().achievements
          
          achievements.forEach(achievement => {
            if (achievement.isUnlocked) return
            
            let isUnlocked = false
            
            switch (achievement.criteria.type) {
              case 'transactions':
                const transactions = pointsHistory.filter(
                  p => p.type === 'earned' && ['borrow', 'repay', 'stake', 'unstake', 'trade'].includes(p.reason)
                ).length
                isUnlocked = transactions >= achievement.criteria.value
                break
                
              case 'volume':
                // Simular volumen total (en producción vendría de transacciones reales)
                const volume = user.totalPointsEarned * 100 // Simulación
                isUnlocked = volume >= achievement.criteria.value
                break
                
              case 'streak':
                isUnlocked = user.streak >= achievement.criteria.value
                break
                
              case 'referrals':
                // Simular referidos (en producción vendría del sistema de referral)
                const referrals = Math.floor(user.totalPointsEarned / 1000) // Simulación
                isUnlocked = referrals >= achievement.criteria.value
                break
                
              case 'custom':
                if (achievement.id === 'diamond-status') {
                  isUnlocked = user.level === 'diamond'
                }
                break
            }
            
            if (isUnlocked) {
              set((state) => ({
                achievements: state.achievements.map(a => 
                  a.id === achievement.id 
                    ? { ...a, isUnlocked: true, unlockedAt: Date.now() }
                    : a
                ),
                user: {
                  ...state.user,
                  achievements: [...state.user.achievements, achievement.id]
                }
              }))
              
              // Otorgar puntos del logro
              get().actions.earnPoints(achievement.pointsReward, `Logro: ${achievement.name}`)
            }
          })
        },
        
        // Actualizar streak de actividad
        updateStreak: (address: string) => {
          const user = get().user
          const now = Date.now()
          const lastActivity = user.lastActivity
          const daysSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60 * 24)
          
          if (daysSinceLastActivity <= get().config.streakConfig.resetAfterDays) {
            set((state) => ({
              user: {
                ...state.user,
                streak: state.user.streak + 1
              }
            }))
          } else {
            set((state) => ({
              user: {
                ...state.user,
                streak: 1
              }
            }))
          }
          
          // Verificar logros después de actualizar streak
          get().actions.checkAchievements(address)
        },
        
        // Obtener estadísticas del usuario
        getLoyaltyStats: (address: string) => {
          const user = get().user
          const requirements = get().config.levelRequirements
          const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
          const currentLevelIndex = levelOrder.indexOf(user.level)
          
          let nextLevel: string | null = null
          let progressToNextLevel = 0
          
          if (currentLevelIndex < levelOrder.length - 1) {
            nextLevel = levelOrder[currentLevelIndex + 1]
            const nextLevelReqs = requirements[nextLevel as keyof typeof requirements]
            progressToNextLevel = Math.min(
              (user.totalPointsEarned / nextLevelReqs.minPoints) * 100,
              100
            )
          }
          
          return {
            points: user.points,
            level: user.level,
            nextLevel,
            progressToNextLevel,
            streak: user.streak,
            achievements: user.achievements.length,
            totalRewards: get().claimedRewards.filter(cr => cr.address === address).length
          }
        },
        
        // Obtener recompensas disponibles para el nivel
        getAvailableRewards: (level: string) => {
          const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
          const userLevelIndex = levelOrder.indexOf(level)
          
          return get().rewards.filter(reward => {
            const rewardLevelIndex = levelOrder.indexOf(reward.level)
            return reward.isActive && 
                   rewardLevelIndex <= userLevelIndex &&
                   reward.currentRedemptions < reward.maxRedemptions
          })
        },
        
        // Obtener historial de puntos
        getPointsHistory: (address: string, limit = 50) => {
          return get().pointsHistory
            .filter(p => p.metadata?.address === address)
            .slice(0, limit)
        },
        
        // Calcular puntos con multiplicadores
        calculatePoints: (basePoints: number, activity: string) => {
          const config = get().config
          const activityPoints = config.pointsPerActivity[activity as keyof typeof config.pointsPerActivity] || 0
          const currentLevel = get().user.level
          const multiplier = config.levelMultipliers[currentLevel]
          
          return Math.floor((basePoints + activityPoints) * multiplier)
        },
        
        // Verificar expiración de puntos
        checkPointsExpiration: () => {
          const config = get().config.pointsExpiration
          if (!config.enabled) return
          
          const now = Date.now()
          const expirationTime = config.daysToExpire * 24 * 60 * 60 * 1000
          const graceTime = config.gracePeriod * 24 * 60 * 60 * 1000
          
          set((state) => ({
            pointsHistory: state.pointsHistory.filter(point => {
              const pointAge = now - point.timestamp
              return pointAge < (expirationTime + graceTime)
            })
          }))
        },
        
        // Resetear estado
        reset: () => set(initialState)
      }
    })),
    {
      name: 'loyalty-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        pointsHistory: state.pointsHistory,
        rewards: state.rewards,
        claimedRewards: state.claimedRewards,
        achievements: state.achievements,
        config: state.config
      })
    }
  )
)
