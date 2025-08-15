import { ErrorTracker } from './errorTracker'
import { PerformanceMonitor } from './performanceMonitor'
import { UserAnalytics } from './userAnalytics'
import { ABTesting } from './abTesting'

export interface AnalyticsSystems {
  errorTracker?: ErrorTracker
  performanceMonitor?: PerformanceMonitor
  userAnalytics?: UserAnalytics
  abTesting?: ABTesting
}

export class Analytics {
  private systems: AnalyticsSystems
  private isInitialized = false

  constructor(systems: AnalyticsSystems) {
    this.systems = systems
    this.isInitialized = true
  }

  // Métodos de conveniencia para error tracking
  captureError(error: Error, context?: any) {
    this.systems.errorTracker?.captureError(error, context)
  }

  captureMessage(message: string, level: any = 'info', context?: any) {
    this.systems.errorTracker?.captureMessage(message, level, context)
  }

  setUser(userId: string, address?: string, network?: string) {
    this.systems.errorTracker?.setUser(userId, address, network)
  }

  clearUser() {
    this.systems.errorTracker?.clearUser()
  }

  // Métodos de conveniencia para performance monitoring
  measure<T>(name: string, fn: () => T): T {
    return this.systems.performanceMonitor?.measure(name, fn) || fn()
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.systems.performanceMonitor?.measureAsync(name, fn) || fn()
  }

  trackBlockchainTransaction(metric: any) {
    this.systems.performanceMonitor?.trackBlockchainTransaction(metric)
  }

  trackGasUsage(transactionHash: string, gasUsed: number, gasPrice: number, gasLimit: number, type: string) {
    this.systems.performanceMonitor?.trackGasUsage(transactionHash, gasUsed, gasPrice, gasLimit, type)
  }

  trackTransactionConfirmation(transactionHash: string, type: string, confirmationTime: number, blockNumber: number) {
    this.systems.performanceMonitor?.trackTransactionConfirmation(transactionHash, type, confirmationTime, blockNumber)
  }

  // Métodos de conveniencia para user analytics
  trackEvent(name: string, properties?: Record<string, any>) {
    this.systems.userAnalytics?.trackEvent(name, properties)
  }

  trackPageView(pageName: string, properties?: Record<string, any>) {
    this.systems.userAnalytics?.trackPageView(pageName, properties)
  }

  trackWalletConnection(walletInfo: { type: string; address: string; network: string }) {
    this.systems.userAnalytics?.trackWalletConnection(walletInfo)
  }

  trackWalletDisconnection() {
    this.systems.userAnalytics?.trackWalletDisconnection()
  }

  trackTransactionSent(transactionInfo: any) {
    this.systems.userAnalytics?.trackTransactionSent(transactionInfo)
  }

  trackTransactionConfirmed(transactionInfo: any) {
    this.systems.userAnalytics?.trackTransactionConfirmed(transactionInfo)
  }

  trackTransactionFailed(transactionInfo: any) {
    this.systems.userAnalytics?.trackTransactionFailed(transactionInfo)
  }

  trackContractInteraction(contractInfo: any) {
    this.systems.userAnalytics?.trackContractInteraction(contractInfo)
  }

  trackUserError(errorInfo: any) {
    this.systems.userAnalytics?.trackUserError(errorInfo)
  }

  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    this.systems.userAnalytics?.trackFeatureUsage(feature, action, properties)
  }

  trackFunnelStep(funnelName: string, step: string, stepNumber: number, properties?: Record<string, any>) {
    this.systems.userAnalytics?.trackFunnelStep(funnelName, step, stepNumber, properties)
  }

  endSession() {
    this.systems.userAnalytics?.endSession()
  }

  // Métodos de conveniencia para A/B testing
  getVariant(experimentId: string, userId?: string): string | null {
    return this.systems.abTesting?.getVariant(experimentId, userId) || null
  }

  getVariantConfig(experimentId: string, userId?: string): Record<string, any> | null {
    return this.systems.abTesting?.getVariantConfig(experimentId, userId) || null
  }

  recordConversion(experimentId: string, goalId: string, userId?: string, metadata?: Record<string, any>) {
    this.systems.abTesting?.recordConversion(experimentId, goalId, userId, metadata)
  }

  recordMetric(experimentId: string, goalId: string, value: number, userId?: string, metadata?: Record<string, any>) {
    this.systems.abTesting?.recordMetric(experimentId, goalId, value, userId, metadata)
  }

  // Métodos combinados para tracking completo
  trackTransactionComplete(transactionInfo: {
    hash: string
    type: string
    amount: string
    token: string
    gasUsed: number
    gasPrice: number
    gasLimit: number
    blockNumber: number
    confirmationTime: number
    success: boolean
    error?: string
  }) {
    // Performance tracking
    this.trackBlockchainTransaction({
      transactionHash: transactionInfo.hash,
      type: transactionInfo.type,
      gasUsed: transactionInfo.gasUsed,
      gasPrice: transactionInfo.gasPrice,
      blockNumber: transactionInfo.blockNumber,
      confirmationTime: transactionInfo.confirmationTime,
    })

    this.trackGasUsage(
      transactionInfo.hash,
      transactionInfo.gasUsed,
      transactionInfo.gasPrice,
      transactionInfo.gasLimit,
      transactionInfo.type
    )

    // User analytics tracking
    if (transactionInfo.success) {
      this.trackTransactionConfirmed({
        hash: transactionInfo.hash,
        type: transactionInfo.type,
        blockNumber: transactionInfo.blockNumber,
        gasUsed: transactionInfo.gasUsed,
        confirmationTime: transactionInfo.confirmationTime,
      })
    } else {
      this.trackTransactionFailed({
        hash: transactionInfo.hash,
        type: transactionInfo.type,
        error: transactionInfo.error || 'Unknown error',
        gasUsed: transactionInfo.gasUsed,
      })
    }

    // Error tracking
    if (!transactionInfo.success) {
      this.captureError(new Error(transactionInfo.error || 'Transaction failed'), {
        transaction: {
          hash: transactionInfo.hash,
          type: transactionInfo.type,
          amount: transactionInfo.amount,
          token: transactionInfo.token,
        },
      })
    }
  }

  trackUserJourney(journeyInfo: {
    step: string
    action: string
    success: boolean
    duration?: number
    metadata?: Record<string, any>
  }) {
    // User analytics
    this.trackEvent('user_journey_step', {
      step: journeyInfo.step,
      action: journeyInfo.action,
      success: journeyInfo.success,
      duration: journeyInfo.duration,
      ...journeyInfo.metadata,
    })

    // Performance tracking
    if (journeyInfo.duration) {
      this.systems.performanceMonitor?.addMetric({
        name: `Journey_${journeyInfo.step}`,
        value: journeyInfo.duration,
        rating: this.getRating('Journey_Performance', journeyInfo.duration),
        timestamp: Date.now(),
        metadata: journeyInfo.metadata,
      })
    }

    // Error tracking
    if (!journeyInfo.success) {
      this.captureError(new Error(`Journey step failed: ${journeyInfo.step}`), {
        journey: {
          step: journeyInfo.step,
          action: journeyInfo.action,
          ...journeyInfo.metadata,
        },
      })
    }
  }

  trackFeatureInteraction(featureInfo: {
    feature: string
    action: string
    success: boolean
    duration?: number
    metadata?: Record<string, any>
  }) {
    // User analytics
    this.trackFeatureUsage(featureInfo.feature, featureInfo.action, featureInfo.metadata)

    // Performance tracking
    if (featureInfo.duration) {
      this.systems.performanceMonitor?.addMetric({
        name: `Feature_${featureInfo.feature}`,
        value: featureInfo.duration,
        rating: this.getRating('Feature_Performance', featureInfo.duration),
        timestamp: Date.now(),
        metadata: featureInfo.metadata,
      })
    }

    // Error tracking
    if (!featureInfo.success) {
      this.captureError(new Error(`Feature interaction failed: ${featureInfo.feature}`), {
        feature: {
          name: featureInfo.feature,
          action: featureInfo.action,
          ...featureInfo.metadata,
        },
      })
    }
  }

  // Métodos para obtener estadísticas combinadas
  getAnalyticsStats() {
    return {
      errorStats: this.systems.errorTracker?.getErrorStats(),
      performanceStats: this.systems.performanceMonitor?.getPerformanceStats(),
      userStats: this.systems.userAnalytics?.getUserStats(),
      abTestingStats: this.systems.abTesting?.getExperiments().map(exp => ({
        id: exp.id,
        name: exp.name,
        stats: this.systems.abTesting?.getExperimentStats(exp.id),
      })),
    }
  }

  // Métodos de limpieza
  cleanup() {
    this.systems.performanceMonitor?.cleanup()
    this.systems.userAnalytics?.endSession()
  }

  destroy() {
    this.systems.performanceMonitor?.destroy()
    this.isInitialized = false
  }

  // Utilidades privadas
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      Journey_Performance: { good: 2000, poor: 5000 },
      Feature_Performance: { good: 1000, poor: 3000 },
    }

    const threshold = thresholds[metricName]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }
}
