import { persistentActions } from '../../state/usePersistentStore'

export interface UserAnalyticsConfig {
  enabled: boolean
  anonymize: boolean
  trackEvents: boolean
  trackPageViews: boolean
}

export interface UserEvent {
  id: string
  name: string
  category: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
}

export interface UserSession {
  id: string
  startTime: number
  endTime?: number
  pageViews: number
  events: number
  blockchainInteractions: number
  walletConnected: boolean
  network?: string
}

export interface UserProfile {
  id: string
  address?: string
  firstSeen: number
  lastSeen: number
  totalSessions: number
  totalTransactions: number
  preferredNetwork?: string
  walletType?: string
  deviceInfo: DeviceInfo
}

export interface DeviceInfo {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export class UserAnalytics {
  private config: UserAnalyticsConfig
  private events: UserEvent[] = []
  private sessions: UserSession[] = []
  private currentSession: UserSession | null = null
  private userProfile: UserProfile | null = null
  private isInitialized = false

  constructor(config: UserAnalyticsConfig) {
    this.config = config
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized || !this.config.enabled) return

    try {
      // Inicializar sesión actual
      this.initializeSession()
      
      // Inicializar perfil de usuario
      this.initializeUserProfile()
      
      // Configurar listeners de eventos
      this.setupEventListeners()
      
      // Configurar tracking de navegación
      if (this.config.trackPageViews) {
        this.setupPageViewTracking()
      }
      
      this.isInitialized = true
      console.log('✅ User analytics initialized')

    } catch (error) {
      console.error('❌ Failed to initialize user analytics:', error)
    }
  }

  private initializeSession() {
    const sessionId = this.generateSessionId()
    const startTime = Date.now()
    
    this.currentSession = {
      id: sessionId,
      startTime,
      pageViews: 0,
      events: 0,
      blockchainInteractions: 0,
      walletConnected: false,
    }

    this.sessions.push(this.currentSession)
    
    // Guardar en localStorage
    localStorage.setItem('banobs_session_id', sessionId)
    localStorage.setItem('banobs_session_start', startTime.toString())
  }

  private initializeUserProfile() {
    const userId = this.getUserId()
    const deviceInfo = this.getDeviceInfo()
    
    this.userProfile = {
      id: userId,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      totalSessions: 1,
      totalTransactions: 0,
      deviceInfo,
    }

    // Cargar perfil existente si existe
    const existingProfile = localStorage.getItem('banobs_user_profile')
    if (existingProfile) {
      try {
        const profile = JSON.parse(existingProfile)
        this.userProfile = {
          ...this.userProfile,
          ...profile,
          lastSeen: Date.now(),
          totalSessions: profile.totalSessions + 1,
        }
      } catch (error) {
        console.warn('Failed to load existing user profile:', error)
      }
    }

    // Guardar perfil actualizado
    this.saveUserProfile()
  }

  private setupEventListeners() {
    // Listener para cambios de wallet
    window.addEventListener('wallet-connected', (event: any) => {
      this.trackWalletConnection(event.detail)
    })

    window.addEventListener('wallet-disconnected', () => {
      this.trackWalletDisconnection()
    })

    // Listener para transacciones blockchain
    window.addEventListener('transaction-sent', (event: any) => {
      this.trackTransactionSent(event.detail)
    })

    window.addEventListener('transaction-confirmed', (event: any) => {
      this.trackTransactionConfirmed(event.detail)
    })

    window.addEventListener('transaction-failed', (event: any) => {
      this.trackTransactionFailed(event.detail)
    })
  }

  private setupPageViewTracking() {
    // Trackear página inicial
    this.trackPageView(window.location.pathname)

    // Listener para cambios de ruta
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      this.trackPageView(window.location.pathname)
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      this.trackPageView(window.location.pathname)
    }

    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname)
    })
  }

  // Trackear evento de usuario
  trackEvent(name: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized || !this.config.trackEvents) return

    const event: UserEvent = {
      id: this.generateEventId(),
      name,
      category: this.getEventCategory(name),
      properties: this.anonymizeData(properties),
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || '',
      userId: this.userProfile?.id,
    }

    this.events.push(event)
    
    if (this.currentSession) {
      this.currentSession.events++
    }

    // Enviar a analytics externo
    this.sendToExternalAnalytics('event', event)

    console.log('📊 User event tracked:', { name, properties: event.properties })
  }

  // Trackear vista de página
  trackPageView(pageName: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized || !this.config.trackPageViews) return

    this.trackEvent('page_view', {
      page_name: pageName,
      page_url: window.location.href,
      referrer: document.referrer,
      ...properties,
    })

    if (this.currentSession) {
      this.currentSession.pageViews++
    }
  }

  // Trackear conexión de wallet
  trackWalletConnection(walletInfo: { type: string; address: string; network: string }) {
    if (!this.isInitialized) return

    this.trackEvent('wallet_connected', {
      wallet_type: walletInfo.type,
      wallet_address: this.anonymizeAddress(walletInfo.address),
      network: walletInfo.network,
    })

    if (this.currentSession) {
      this.currentSession.walletConnected = true
      this.currentSession.network = walletInfo.network
    }

    if (this.userProfile) {
      this.userProfile.address = this.anonymizeAddress(walletInfo.address)
      this.userProfile.preferredNetwork = walletInfo.network
      this.userProfile.walletType = walletInfo.type
      this.saveUserProfile()
    }
  }

  // Trackear desconexión de wallet
  trackWalletDisconnection() {
    if (!this.isInitialized) return

    this.trackEvent('wallet_disconnected')

    if (this.currentSession) {
      this.currentSession.walletConnected = false
    }
  }

  // Trackear transacción enviada
  trackTransactionSent(transactionInfo: {
    hash: string
    type: string
    amount: string
    token: string
    gasPrice: string
    gasLimit: number
  }) {
    if (!this.isInitialized) return

    this.trackEvent('transaction_sent', {
      transaction_hash: this.anonymizeHash(transactionInfo.hash),
      transaction_type: transactionInfo.type,
      amount: transactionInfo.amount,
      token: transactionInfo.token,
      gas_price: transactionInfo.gasPrice,
      gas_limit: transactionInfo.gasLimit,
    })

    if (this.currentSession) {
      this.currentSession.blockchainInteractions++
    }

    if (this.userProfile) {
      this.userProfile.totalTransactions++
      this.saveUserProfile()
    }
  }

  // Trackear transacción confirmada
  trackTransactionConfirmed(transactionInfo: {
    hash: string
    type: string
    blockNumber: number
    gasUsed: number
    confirmationTime: number
  }) {
    if (!this.isInitialized) return

    this.trackEvent('transaction_confirmed', {
      transaction_hash: this.anonymizeHash(transactionInfo.hash),
      transaction_type: transactionInfo.type,
      block_number: transactionInfo.blockNumber,
      gas_used: transactionInfo.gasUsed,
      confirmation_time: transactionInfo.confirmationTime,
    })
  }

  // Trackear transacción fallida
  trackTransactionFailed(transactionInfo: {
    hash: string
    type: string
    error: string
    gasUsed?: number
  }) {
    if (!this.isInitialized) return

    this.trackEvent('transaction_failed', {
      transaction_hash: this.anonymizeHash(transactionInfo.hash),
      transaction_type: transactionInfo.type,
      error: transactionInfo.error,
      gas_used: transactionInfo.gasUsed,
    })
  }

  // Trackear interacción con contrato
  trackContractInteraction(contractInfo: {
    address: string
    function: string
    args: any[]
    gasUsed?: number
  }) {
    if (!this.isInitialized) return

    this.trackEvent('contract_interaction', {
      contract_address: this.anonymizeAddress(contractInfo.address),
      function_name: contractInfo.function,
      args_count: contractInfo.args.length,
      gas_used: contractInfo.gasUsed,
    })
  }

  // Trackear error de usuario
  trackUserError(errorInfo: {
    message: string
    stack?: string
    component?: string
    action?: string
  }) {
    if (!this.isInitialized) return

    this.trackEvent('user_error', {
      error_message: errorInfo.message,
      component: errorInfo.component,
      action: errorInfo.action,
      // No trackear stack trace por privacidad
    })
  }

  // Trackear feature usage
  trackFeatureUsage(feature: string, action: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized) return

    this.trackEvent('feature_usage', {
      feature,
      action,
      ...properties,
    })
  }

  // Trackear funnel de conversión
  trackFunnelStep(funnelName: string, step: string, stepNumber: number, properties: Record<string, any> = {}) {
    if (!this.isInitialized) return

    this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step,
      step_number: stepNumber,
      ...properties,
    })
  }

  // Finalizar sesión actual
  endSession() {
    if (!this.isInitialized || !this.currentSession) return

    this.currentSession.endTime = Date.now()
    
    this.trackEvent('session_end', {
      session_duration: this.currentSession.endTime - this.currentSession.startTime,
      page_views: this.currentSession.pageViews,
      events: this.currentSession.events,
      blockchain_interactions: this.currentSession.blockchainInteractions,
    })

    // Limpiar datos de sesión
    localStorage.removeItem('banobs_session_id')
    localStorage.removeItem('banobs_session_start')
  }

  // Obtener estadísticas de usuario
  getUserStats() {
    if (!this.isInitialized) return null

    const currentTime = Date.now()
    const oneDayAgo = currentTime - 24 * 60 * 60 * 1000
    const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000

    const recentEvents = this.events.filter(e => e.timestamp > oneDayAgo)
    const recentSessions = this.sessions.filter(s => s.startTime > oneWeekAgo)

    return {
      userProfile: this.userProfile,
      currentSession: this.currentSession,
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      totalSessions: this.sessions.length,
      recentSessions: recentSessions.length,
      averageSessionDuration: this.calculateAverageSessionDuration(),
      mostUsedFeatures: this.getMostUsedFeatures(),
      transactionStats: this.getTransactionStats(),
    }
  }

  // Utilidades privadas
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getUserId(): string {
    let userId = localStorage.getItem('banobs_user_id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('banobs_user_id', userId)
    }
    return userId
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent
    const screen = window.screen
    
    return {
      userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent),
      isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)),
    }
  }

  private getEventCategory(eventName: string): string {
    const categories: Record<string, string> = {
      page_view: 'navigation',
      wallet_connected: 'wallet',
      wallet_disconnected: 'wallet',
      transaction_sent: 'blockchain',
      transaction_confirmed: 'blockchain',
      transaction_failed: 'blockchain',
      contract_interaction: 'blockchain',
      user_error: 'error',
      feature_usage: 'feature',
      funnel_step: 'conversion',
      session_end: 'session',
    }

    return categories[eventName] || 'general'
  }

  private anonymizeData(data: Record<string, any>): Record<string, any> {
    if (!this.config.anonymize) return data

    const anonymized = { ...data }

    // Anonimizar direcciones de wallet
    Object.keys(anonymized).forEach(key => {
      const value = anonymized[key]
      if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
        anonymized[key] = this.anonymizeAddress(value)
      }
    })

    return anonymized
  }

  private anonymizeAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  private anonymizeHash(hash: string): string {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  private saveUserProfile() {
    if (this.userProfile) {
      localStorage.setItem('banobs_user_profile', JSON.stringify(this.userProfile))
    }
  }

  private sendToExternalAnalytics(type: string, data: any) {
    // Enviar a Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', type, data)
    }

    // Enviar a sistema interno
    persistentActions.addAnalyticsEvent({
      type,
      data,
      timestamp: Date.now(),
    })
  }

  private calculateAverageSessionDuration(): number {
    const completedSessions = this.sessions.filter(s => s.endTime)
    if (completedSessions.length === 0) return 0

    const totalDuration = completedSessions.reduce((sum, session) => {
      return sum + (session.endTime! - session.startTime)
    }, 0)

    return totalDuration / completedSessions.length
  }

  private getMostUsedFeatures(): Record<string, number> {
    const featureEvents = this.events.filter(e => e.category === 'feature')
    const featureCounts: Record<string, number> = {}

    featureEvents.forEach(event => {
      const feature = event.properties.feature
      if (feature) {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1
      }
    })

    return featureCounts
  }

  private getTransactionStats() {
    const transactionEvents = this.events.filter(e => 
      e.name.startsWith('transaction_')
    )

    return {
      total: transactionEvents.length,
      sent: transactionEvents.filter(e => e.name === 'transaction_sent').length,
      confirmed: transactionEvents.filter(e => e.name === 'transaction_confirmed').length,
      failed: transactionEvents.filter(e => e.name === 'transaction_failed').length,
      successRate: transactionEvents.length > 0 
        ? (transactionEvents.filter(e => e.name === 'transaction_confirmed').length / transactionEvents.length) * 100
        : 0,
    }
  }
}
