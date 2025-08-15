import { persistentActions } from '../../state/usePersistentStore'

export interface Experiment {
  id: string
  name: string
  description: string
  variants: ExperimentVariant[]
  trafficAllocation: number // Porcentaje de tráfico (0-100)
  startDate: number
  endDate?: number
  isActive: boolean
  targetAudience?: TargetAudience
  goals: ExperimentGoal[]
}

export interface ExperimentVariant {
  id: string
  name: string
  weight: number // Peso para distribución (0-100)
  config: Record<string, any>
  isControl: boolean
}

export interface TargetAudience {
  userTypes?: string[] // 'new', 'returning', 'premium'
  networks?: string[] // 'mainnet', 'testnet'
  devices?: string[] // 'mobile', 'desktop', 'tablet'
  countries?: string[]
  walletTypes?: string[]
}

export interface ExperimentGoal {
  id: string
  name: string
  type: 'conversion' | 'engagement' | 'revenue' | 'custom'
  metric: string
  target?: number
}

export interface ExperimentResult {
  experimentId: string
  variantId: string
  userId: string
  sessionId: string
  timestamp: number
  goalAchieved?: boolean
  goalValue?: number
  metadata?: Record<string, any>
}

export interface ExperimentStats {
  experimentId: string
  totalParticipants: number
  variantStats: Record<string, VariantStats>
  conversionRates: Record<string, number>
  statisticalSignificance: Record<string, boolean>
  winner?: string
  confidence: number
}

export interface VariantStats {
  participants: number
  conversions: number
  conversionRate: number
  averageGoalValue: number
  standardError: number
}

export class ABTesting {
  private experiments: Map<string, Experiment> = new Map()
  private results: ExperimentResult[] = []
  private userAssignments: Map<string, Map<string, string>> = new Map() // userId -> experimentId -> variantId
  private isInitialized = false

  constructor(config: { enabled: boolean; experiments: Record<string, any> }) {
    if (config.enabled) {
      this.initialize()
    }
  }

  private initialize() {
    if (this.isInitialized) return

    try {
      // Cargar experimentos predefinidos
      this.loadDefaultExperiments()
      
      // Cargar asignaciones existentes
      this.loadUserAssignments()
      
      // Cargar resultados existentes
      this.loadResults()
      
      this.isInitialized = true
      console.log('✅ A/B testing framework initialized')

    } catch (error) {
      console.error('❌ Failed to initialize A/B testing:', error)
    }
  }

  private loadDefaultExperiments() {
    // Experimento: UI Layout
    const uiLayoutExperiment: Experiment = {
      id: 'ui-layout-2024',
      name: 'UI Layout Optimization',
      description: 'Testing different UI layouts for better user engagement',
      variants: [
        {
          id: 'control',
          name: 'Current Layout',
          weight: 50,
          config: { layout: 'current', sidebar: 'left', header: 'standard' },
          isControl: true,
        },
        {
          id: 'variant-a',
          name: 'Compact Layout',
          weight: 25,
          config: { layout: 'compact', sidebar: 'collapsible', header: 'minimal' },
          isControl: false,
        },
        {
          id: 'variant-b',
          name: 'Wide Layout',
          weight: 25,
          config: { layout: 'wide', sidebar: 'right', header: 'extended' },
          isControl: false,
        },
      ],
      trafficAllocation: 100,
      startDate: Date.now(),
      isActive: true,
      targetAudience: {
        userTypes: ['new', 'returning'],
        devices: ['desktop', 'tablet'],
      },
      goals: [
        {
          id: 'engagement',
          name: 'User Engagement',
          type: 'engagement',
          metric: 'session_duration',
          target: 300, // 5 minutos
        },
        {
          id: 'conversion',
          name: 'Transaction Conversion',
          type: 'conversion',
          metric: 'transaction_completed',
        },
      ],
    }

    // Experimento: Onboarding Flow
    const onboardingExperiment: Experiment = {
      id: 'onboarding-flow-2024',
      name: 'Onboarding Flow Optimization',
      description: 'Testing different onboarding flows for new users',
      variants: [
        {
          id: 'control',
          name: 'Standard Onboarding',
          weight: 50,
          config: { steps: 5, tutorial: true, skipOption: false },
          isControl: true,
        },
        {
          id: 'variant-a',
          name: 'Quick Onboarding',
          weight: 25,
          config: { steps: 3, tutorial: false, skipOption: true },
          isControl: false,
        },
        {
          id: 'variant-b',
          name: 'Interactive Onboarding',
          weight: 25,
          config: { steps: 7, tutorial: true, skipOption: true, interactive: true },
          isControl: false,
        },
      ],
      trafficAllocation: 100,
      startDate: Date.now(),
      isActive: true,
      targetAudience: {
        userTypes: ['new'],
        devices: ['mobile', 'desktop'],
      },
      goals: [
        {
          id: 'completion',
          name: 'Onboarding Completion',
          type: 'conversion',
          metric: 'onboarding_completed',
        },
        {
          id: 'wallet_connection',
          name: 'Wallet Connection',
          type: 'conversion',
          metric: 'wallet_connected',
        },
      ],
    }

    // Experimento: Gas Fee Display
    const gasFeeExperiment: Experiment = {
      id: 'gas-fee-display-2024',
      name: 'Gas Fee Display Optimization',
      description: 'Testing different ways to display gas fees',
      variants: [
        {
          id: 'control',
          name: 'Standard Display',
          weight: 50,
          config: { showGasEstimate: true, showGasPrice: true, showTotalCost: false },
          isControl: true,
        },
        {
          id: 'variant-a',
          name: 'Detailed Display',
          weight: 25,
          config: { showGasEstimate: true, showGasPrice: true, showTotalCost: true, breakdown: true },
          isControl: false,
        },
        {
          id: 'variant-b',
          name: 'Simplified Display',
          weight: 25,
          config: { showGasEstimate: false, showGasPrice: false, showTotalCost: true, simple: true },
          isControl: false,
        },
      ],
      trafficAllocation: 100,
      startDate: Date.now(),
      isActive: true,
      targetAudience: {
        userTypes: ['new', 'returning'],
        networks: ['mainnet', 'testnet'],
      },
      goals: [
        {
          id: 'transaction_success',
          name: 'Transaction Success Rate',
          type: 'conversion',
          metric: 'transaction_confirmed',
        },
        {
          id: 'user_satisfaction',
          name: 'User Satisfaction',
          type: 'engagement',
          metric: 'user_feedback_score',
        },
      ],
    }

    this.experiments.set(uiLayoutExperiment.id, uiLayoutExperiment)
    this.experiments.set(onboardingExperiment.id, onboardingExperiment)
    this.experiments.set(gasFeeExperiment.id, gasFeeExperiment)
  }

  // Obtener variante para un experimento
  getVariant(experimentId: string, userId?: string): string | null {
    if (!this.isInitialized) return null

    const experiment = this.experiments.get(experimentId)
    if (!experiment || !experiment.isActive) return null

    // Verificar si el usuario está en la audiencia objetivo
    if (!this.isUserInTargetAudience(experiment.targetAudience, userId)) {
      return null
    }

    // Verificar asignación de tráfico
    if (Math.random() * 100 > experiment.trafficAllocation) {
      return null
    }

    // Obtener o crear asignación de usuario
    const userAssignment = this.getUserAssignment(experimentId, userId)
    if (userAssignment) {
      return userAssignment
    }

    // Asignar nueva variante
    const variant = this.assignVariant(experiment)
    if (variant && userId) {
      this.setUserAssignment(experimentId, userId, variant.id)
    }

    return variant?.id || null
  }

  // Obtener configuración de variante
  getVariantConfig(experimentId: string, userId?: string): Record<string, any> | null {
    const variantId = this.getVariant(experimentId, userId)
    if (!variantId) return null

    const experiment = this.experiments.get(experimentId)
    if (!experiment) return null

    const variant = experiment.variants.find(v => v.id === variantId)
    return variant?.config || null
  }

  // Registrar resultado de experimento
  recordResult(
    experimentId: string,
    variantId: string,
    goalId: string,
    userId?: string,
    goalValue?: number,
    metadata?: Record<string, any>
  ) {
    if (!this.isInitialized) return

    const experiment = this.experiments.get(experimentId)
    if (!experiment) return

    const goal = experiment.goals.find(g => g.id === goalId)
    if (!goal) return

    const result: ExperimentResult = {
      experimentId,
      variantId,
      userId: userId || 'anonymous',
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      goalAchieved: goalValue !== undefined ? goalValue >= (goal.target || 0) : undefined,
      goalValue,
      metadata,
    }

    this.results.push(result)
    this.saveResults()

    console.log('📊 A/B test result recorded:', {
      experimentId,
      variantId,
      goalId,
      goalValue,
    })
  }

  // Registrar conversión
  recordConversion(experimentId: string, goalId: string, userId?: string, metadata?: Record<string, any>) {
    this.recordResult(experimentId, this.getVariant(experimentId, userId) || '', goalId, userId, 1, metadata)
  }

  // Registrar valor de métrica
  recordMetric(experimentId: string, goalId: string, value: number, userId?: string, metadata?: Record<string, any>) {
    this.recordResult(experimentId, this.getVariant(experimentId, userId) || '', goalId, userId, value, metadata)
  }

  // Obtener estadísticas de experimento
  getExperimentStats(experimentId: string): ExperimentStats | null {
    if (!this.isInitialized) return null

    const experiment = this.experiments.get(experimentId)
    if (!experiment) return null

    const experimentResults = this.results.filter(r => r.experimentId === experimentId)
    const totalParticipants = new Set(experimentResults.map(r => r.userId)).size

    const variantStats: Record<string, VariantStats> = {}
    const conversionRates: Record<string, number> = {}

    // Calcular estadísticas por variante
    experiment.variants.forEach(variant => {
      const variantResults = experimentResults.filter(r => r.variantId === variant.id)
      const participants = new Set(variantResults.map(r => r.userId)).size
      const conversions = variantResults.filter(r => r.goalAchieved).length
      const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0

      const goalValues = variantResults
        .filter(r => r.goalValue !== undefined)
        .map(r => r.goalValue!)

      const averageGoalValue = goalValues.length > 0 
        ? goalValues.reduce((a, b) => a + b, 0) / goalValues.length 
        : 0

      const standardError = this.calculateStandardError(goalValues, averageGoalValue)

      variantStats[variant.id] = {
        participants,
        conversions,
        conversionRate,
        averageGoalValue,
        standardError,
      }

      conversionRates[variant.id] = conversionRate
    })

    // Calcular significancia estadística
    const statisticalSignificance = this.calculateStatisticalSignificance(variantStats, experiment.variants)

    // Determinar ganador
    const winner = this.determineWinner(variantStats, statisticalSignificance)

    // Calcular nivel de confianza
    const confidence = this.calculateConfidence(variantStats, experiment.variants)

    return {
      experimentId,
      totalParticipants,
      variantStats,
      conversionRates,
      statisticalSignificance,
      winner,
      confidence,
    }
  }

  // Crear nuevo experimento
  createExperiment(experiment: Experiment): string {
    if (!this.isInitialized) return ''

    this.experiments.set(experiment.id, experiment)
    this.saveExperiments()

    console.log('📊 New experiment created:', experiment.name)
    return experiment.id
  }

  // Actualizar experimento
  updateExperiment(experimentId: string, updates: Partial<Experiment>): boolean {
    if (!this.isInitialized) return false

    const experiment = this.experiments.get(experimentId)
    if (!experiment) return false

    const updatedExperiment = { ...experiment, ...updates }
    this.experiments.set(experimentId, updatedExperiment)
    this.saveExperiments()

    console.log('📊 Experiment updated:', experimentId)
    return true
  }

  // Pausar experimento
  pauseExperiment(experimentId: string): boolean {
    return this.updateExperiment(experimentId, { isActive: false })
  }

  // Reanudar experimento
  resumeExperiment(experimentId: string): boolean {
    return this.updateExperiment(experimentId, { isActive: true })
  }

  // Finalizar experimento
  endExperiment(experimentId: string): boolean {
    return this.updateExperiment(experimentId, { 
      isActive: false, 
      endDate: Date.now() 
    })
  }

  // Obtener lista de experimentos
  getExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
  }

  // Obtener experimentos activos
  getActiveExperiments(): Experiment[] {
    return this.getExperiments().filter(e => e.isActive)
  }

  // Utilidades privadas
  private isUserInTargetAudience(targetAudience?: TargetAudience, userId?: string): boolean {
    if (!targetAudience) return true

    // Implementar lógica de targeting basada en perfil de usuario
    // Por ahora, retornar true para todos los usuarios
    return true
  }

  private getUserAssignment(experimentId: string, userId?: string): string | null {
    if (!userId) return null

    const userAssignments = this.userAssignments.get(userId)
    return userAssignments?.get(experimentId) || null
  }

  private setUserAssignment(experimentId: string, userId: string, variantId: string) {
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map())
    }

    this.userAssignments.get(userId)!.set(experimentId, variantId)
    this.saveUserAssignments()
  }

  private assignVariant(experiment: Experiment): ExperimentVariant | null {
    const random = Math.random() * 100
    let cumulativeWeight = 0

    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight
      if (random <= cumulativeWeight) {
        return variant
      }
    }

    return experiment.variants[0] || null
  }

  private calculateStandardError(values: number[], mean: number): number {
    if (values.length <= 1) return 0

    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1)
    return Math.sqrt(variance / values.length)
  }

  private calculateStatisticalSignificance(
    variantStats: Record<string, VariantStats>,
    variants: ExperimentVariant[]
  ): Record<string, boolean> {
    const significance: Record<string, boolean> = {}
    const controlVariant = variants.find(v => v.isControl)

    if (!controlVariant) return significance

    const controlStats = variantStats[controlVariant.id]
    if (!controlStats) return significance

    variants.forEach(variant => {
      if (variant.isControl) {
        significance[variant.id] = false
        return
      }

      const variantStatsData = variantStats[variant.id]
      if (!variantStatsData) {
        significance[variant.id] = false
        return
      }

      // Test de significancia estadística (Z-test simplificado)
      const zScore = Math.abs(
        (variantStatsData.conversionRate - controlStats.conversionRate) /
        Math.sqrt(
          (controlStats.conversionRate * (100 - controlStats.conversionRate)) / controlStats.participants +
          (variantStatsData.conversionRate * (100 - variantStatsData.conversionRate)) / variantStatsData.participants
        )
      )

      // 95% de confianza (Z = 1.96)
      significance[variant.id] = zScore > 1.96
    })

    return significance
  }

  private determineWinner(
    variantStats: Record<string, VariantStats>,
    statisticalSignificance: Record<string, boolean>
  ): string | undefined {
    let bestVariant: string | undefined
    let bestRate = 0

    Object.entries(variantStats).forEach(([variantId, stats]) => {
      if (statisticalSignificance[variantId] && stats.conversionRate > bestRate) {
        bestRate = stats.conversionRate
        bestVariant = variantId
      }
    })

    return bestVariant
  }

  private calculateConfidence(
    variantStats: Record<string, VariantStats>,
    variants: ExperimentVariant[]
  ): number {
    // Calcular nivel de confianza basado en el tamaño de muestra
    const totalParticipants = Object.values(variantStats).reduce(
      (sum, stats) => sum + stats.participants, 0
    )

    // Fórmula simplificada para confianza
    if (totalParticipants < 100) return 0.5
    if (totalParticipants < 500) return 0.7
    if (totalParticipants < 1000) return 0.8
    if (totalParticipants < 5000) return 0.9
    return 0.95
  }

  private getSessionId(): string {
    return localStorage.getItem('banobs_session_id') || 'unknown'
  }

  private loadUserAssignments() {
    try {
      const stored = localStorage.getItem('banobs_ab_assignments')
      if (stored) {
        const assignments = JSON.parse(stored)
        Object.entries(assignments).forEach(([userId, experiments]) => {
          this.userAssignments.set(userId, new Map(Object.entries(experiments as Record<string, string>)))
        })
      }
    } catch (error) {
      console.warn('Failed to load A/B test assignments:', error)
    }
  }

  private saveUserAssignments() {
    try {
      const assignments: Record<string, Record<string, string>> = {}
      this.userAssignments.forEach((experiments, userId) => {
        assignments[userId] = Object.fromEntries(experiments)
      })
      localStorage.setItem('banobs_ab_assignments', JSON.stringify(assignments))
    } catch (error) {
      console.warn('Failed to save A/B test assignments:', error)
    }
  }

  private loadResults() {
    try {
      const stored = localStorage.getItem('banobs_ab_results')
      if (stored) {
        this.results = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load A/B test results:', error)
    }
  }

  private saveResults() {
    try {
      localStorage.setItem('banobs_ab_results', JSON.stringify(this.results))
    } catch (error) {
      console.warn('Failed to save A/B test results:', error)
    }
  }

  private saveExperiments() {
    try {
      const experimentsArray = Array.from(this.experiments.values())
      localStorage.setItem('banobs_experiments', JSON.stringify(experimentsArray))
    } catch (error) {
      console.warn('Failed to save experiments:', error)
    }
  }
}
