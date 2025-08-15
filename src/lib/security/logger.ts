// Security Logger System
export interface SecurityEvent {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'critical'
  category: string
  action: string
  details: any
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  url?: string
  referrer?: string
}

export interface SecurityAlert {
  id: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  message: string
  details: any
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

export class SecurityLogger {
  private static instance: SecurityLogger
  private events: SecurityEvent[] = []
  private alerts: SecurityAlert[] = []
  private maxEvents: number = 1000
  private maxAlerts: number = 100
  private enabled: boolean = true
  private logToConsole: boolean = true
  private logToStorage: boolean = true
  private logToServer: boolean = false
  private serverEndpoint?: string
  
  private constructor() {
    this.loadFromStorage()
    this.setupPeriodicCleanup()
  }
  
  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }
  
  // Configurar logger
  configure(config: {
    enabled?: boolean
    logToConsole?: boolean
    logToStorage?: boolean
    logToServer?: boolean
    serverEndpoint?: string
    maxEvents?: number
    maxAlerts?: number
  }): void {
    this.enabled = config.enabled ?? this.enabled
    this.logToConsole = config.logToConsole ?? this.logToConsole
    this.logToStorage = config.logToStorage ?? this.logToStorage
    this.logToServer = config.logToServer ?? this.logToServer
    this.serverEndpoint = config.serverEndpoint
    this.maxEvents = config.maxEvents ?? this.maxEvents
    this.maxAlerts = config.maxAlerts ?? this.maxAlerts
  }
  
  // Log de eventos de seguridad
  logEvent(
    level: SecurityEvent['level'],
    category: string,
    action: string,
    details: any = {}
  ): void {
    if (!this.enabled) return
    
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      details: this.sanitizeDetails(details),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      ip: this.getClientIP(),
      userAgent: this.getUserAgent(),
      url: this.getCurrentURL(),
      referrer: this.getReferrer()
    }
    
    this.events.push(event)
    this.trimEvents()
    
    if (this.logToConsole) {
      this.logToConsole(event)
    }
    
    if (this.logToStorage) {
      this.saveToStorage()
    }
    
    if (this.logToServer && this.serverEndpoint) {
      this.sendToServer(event)
    }
    
    // Crear alerta si es crítico
    if (level === 'critical') {
      this.createAlert('critical', 'security_critical', `Critical security event: ${action}`, details)
    }
  }
  
  // Log de información
  logInfo(category: string, action: string, details?: any): void {
    this.logEvent('info', category, action, details)
  }
  
  // Log de advertencias
  logWarning(category: string, action: string, details?: any): void {
    this.logEvent('warning', category, action, details)
  }
  
  // Log de errores
  logError(category: string, action: string, details?: any): void {
    this.logEvent('error', category, action, details)
  }
  
  // Log de eventos críticos
  logCritical(category: string, action: string, details?: any): void {
    this.logEvent('critical', category, action, details)
  }
  
  // Log de intentos de rate limit
  logRateLimitExceeded(action: string, ip?: string): void {
    this.logWarning('rate_limit', 'exceeded', {
      action,
      ip: ip || this.getClientIP(),
      userAgent: this.getUserAgent(),
      url: this.getCurrentURL()
    })
    
    this.createAlert('high', 'rate_limit_exceeded', `Rate limit exceeded for action: ${action}`, {
      action,
      ip: ip || this.getClientIP()
    })
  }
  
  // Log de intentos de autenticación fallidos
  logFailedAuth(attempt: number, maxAttempts: number, details?: any): void {
    this.logWarning('authentication', 'failed_attempt', {
      attempt,
      maxAttempts,
      ...details
    })
    
    if (attempt >= maxAttempts) {
      this.createAlert('high', 'auth_blocked', 'Account temporarily blocked due to failed attempts', {
        attempt,
        maxAttempts,
        ...details
      })
    }
  }
  
  // Log de intentos de CSRF
  logCSRFAttempt(details?: any): void {
    this.logError('csrf', 'attempt', details)
    this.createAlert('high', 'csrf_attempt', 'CSRF attack attempt detected', details)
  }
  
  // Log de intentos de XSS
  logXSSAttempt(input: string, details?: any): void {
    this.logError('xss', 'attempt', {
      input: this.sanitizeInput(input),
      ...details
    })
    this.createAlert('high', 'xss_attempt', 'XSS attack attempt detected', {
      input: this.sanitizeInput(input),
      ...details
    })
  }
  
  // Log de intentos de inyección SQL
  logSQLInjectionAttempt(input: string, details?: any): void {
    this.logError('sql_injection', 'attempt', {
      input: this.sanitizeInput(input),
      ...details
    })
    this.createAlert('high', 'sql_injection_attempt', 'SQL injection attempt detected', {
      input: this.sanitizeInput(input),
      ...details
    })
  }
  
  // Log de intentos de manipulación de contratos
  logContractManipulationAttempt(contractAddress: string, details?: any): void {
    this.logError('contract_security', 'manipulation_attempt', {
      contractAddress,
      ...details
    })
    this.createAlert('critical', 'contract_manipulation', 'Contract manipulation attempt detected', {
      contractAddress,
      ...details
    })
  }
  
  // Log de intentos de manipulación de oracle
  logOracleManipulationAttempt(oracleAddress: string, details?: any): void {
    this.logError('oracle_security', 'manipulation_attempt', {
      oracleAddress,
      ...details
    })
    this.createAlert('critical', 'oracle_manipulation', 'Oracle manipulation attempt detected', {
      oracleAddress,
      ...details
    })
  }
  
  // Log de transacciones sospechosas
  logSuspiciousTransaction(txHash: string, details?: any): void {
    this.logWarning('transaction', 'suspicious', {
      txHash,
      ...details
    })
    this.createAlert('medium', 'suspicious_transaction', 'Suspicious transaction detected', {
      txHash,
      ...details
    })
  }
  
  // Log de intentos de acceso no autorizado
  logUnauthorizedAccess(resource: string, details?: any): void {
    this.logError('authorization', 'unauthorized_access', {
      resource,
      ...details
    })
    this.createAlert('high', 'unauthorized_access', 'Unauthorized access attempt detected', {
      resource,
      ...details
    })
  }
  
  // Log de intentos de escalación de privilegios
  logPrivilegeEscalationAttempt(privilege: string, details?: any): void {
    this.logError('authorization', 'privilege_escalation', {
      privilege,
      ...details
    })
    this.createAlert('critical', 'privilege_escalation', 'Privilege escalation attempt detected', {
      privilege,
      ...details
    })
  }
  
  // Log de intentos de bypass de validación
  logValidationBypassAttempt(validationType: string, details?: any): void {
    this.logError('validation', 'bypass_attempt', {
      validationType,
      ...details
    })
    this.createAlert('high', 'validation_bypass', 'Validation bypass attempt detected', {
      validationType,
      ...details
    })
  }
  
  // Crear alerta de seguridad
  createAlert(
    severity: SecurityAlert['severity'],
    type: string,
    message: string,
    details: any = {}
  ): void {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      severity,
      type,
      message,
      details: this.sanitizeDetails(details),
      resolved: false
    }
    
    this.alerts.push(alert)
    this.trimAlerts()
    
    if (this.logToConsole) {
      console.warn(`🚨 SECURITY ALERT [${severity.toUpperCase()}]: ${message}`, details)
    }
    
    if (this.logToStorage) {
      this.saveToStorage()
    }
    
    if (this.logToServer && this.serverEndpoint) {
      this.sendAlertToServer(alert)
    }
  }
  
  // Resolver alerta
  resolveAlert(alertId: string, resolvedBy?: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date().toISOString()
      alert.resolvedBy = resolvedBy
      
      if (this.logToStorage) {
        this.saveToStorage()
      }
    }
  }
  
  // Obtener eventos
  getEvents(
    filter?: {
      level?: SecurityEvent['level']
      category?: string
      action?: string
      startDate?: string
      endDate?: string
    }
  ): SecurityEvent[] {
    let events = [...this.events]
    
    if (filter) {
      if (filter.level) {
        events = events.filter(e => e.level === filter.level)
      }
      if (filter.category) {
        events = events.filter(e => e.category === filter.category)
      }
      if (filter.action) {
        events = events.filter(e => e.action === filter.action)
      }
      if (filter.startDate) {
        events = events.filter(e => e.timestamp >= filter.startDate!)
      }
      if (filter.endDate) {
        events = events.filter(e => e.timestamp <= filter.endDate!)
      }
    }
    
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
  
  // Obtener alertas
  getAlerts(
    filter?: {
      severity?: SecurityAlert['severity']
      type?: string
      resolved?: boolean
    }
  ): SecurityAlert[] {
    let alerts = [...this.alerts]
    
    if (filter) {
      if (filter.severity) {
        alerts = alerts.filter(a => a.severity === filter.severity)
      }
      if (filter.type) {
        alerts = alerts.filter(a => a.type === filter.type)
      }
      if (filter.resolved !== undefined) {
        alerts = alerts.filter(a => a.resolved === filter.resolved)
      }
    }
    
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
  
  // Obtener estadísticas
  getStats(): {
    totalEvents: number
    eventsByLevel: Record<SecurityEvent['level'], number>
    eventsByCategory: Record<string, number>
    totalAlerts: number
    alertsBySeverity: Record<SecurityAlert['severity'], number>
    unresolvedAlerts: number
  } {
    const eventsByLevel = this.events.reduce((acc, event) => {
      acc[event.level] = (acc[event.level] || 0) + 1
      return acc
    }, {} as Record<SecurityEvent['level'], number>)
    
    const eventsByCategory = this.events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const alertsBySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<SecurityAlert['severity'], number>)
    
    return {
      totalEvents: this.events.length,
      eventsByLevel,
      eventsByCategory,
      totalAlerts: this.alerts.length,
      alertsBySeverity,
      unresolvedAlerts: this.alerts.filter(a => !a.resolved).length
    }
  }
  
  // Limpiar eventos antiguos
  clearOldEvents(daysToKeep: number = 30): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoffDate
    )
    
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > cutoffDate
    )
    
    this.saveToStorage()
  }
  
  // Exportar datos
  exportData(): {
    events: SecurityEvent[]
    alerts: SecurityAlert[]
    stats: ReturnType<SecurityLogger['getStats']>
  } {
    return {
      events: this.getEvents(),
      alerts: this.getAlerts(),
      stats: this.getStats()
    }
  }
  
  // Métodos privados
  private sanitizeDetails(details: any): any {
    if (typeof details === 'string') {
      return this.sanitizeInput(details)
    }
    
    if (typeof details === 'object' && details !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(details)) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeInput(value)
        } else {
          sanitized[key] = value
        }
      }
      return sanitized
    }
    
    return details
  }
  
  private sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
      .slice(0, 1000)
  }
  
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private getUserId(): string | undefined {
    // Implementar según tu sistema de autenticación
    return undefined
  }
  
  private getSessionId(): string | undefined {
    return sessionStorage.getItem('session_id') || undefined
  }
  
  private getClientIP(): string | undefined {
    // En el frontend no podemos obtener la IP real
    // Esto se maneja en el backend
    return undefined
  }
  
  private getUserAgent(): string | undefined {
    return navigator.userAgent
  }
  
  private getCurrentURL(): string | undefined {
    return window.location.href
  }
  
  private getReferrer(): string | undefined {
    return document.referrer
  }
  
  private trimEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }
  
  private trimAlerts(): void {
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts)
    }
  }
  
  private logToConsole(event: SecurityEvent): void {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    }[event.level]
    
    console.log(`${emoji} SECURITY [${event.level.toUpperCase()}]: ${event.category}/${event.action}`, event.details)
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem('security_events', JSON.stringify(this.events))
      localStorage.setItem('security_alerts', JSON.stringify(this.alerts))
    } catch (error) {
      console.warn('Failed to save security data to storage:', error)
    }
  }
  
  private loadFromStorage(): void {
    try {
      const events = localStorage.getItem('security_events')
      const alerts = localStorage.getItem('security_alerts')
      
      if (events) {
        this.events = JSON.parse(events)
      }
      if (alerts) {
        this.alerts = JSON.parse(alerts)
      }
    } catch (error) {
      console.warn('Failed to load security data from storage:', error)
    }
  }
  
  private async sendToServer(event: SecurityEvent): Promise<void> {
    if (!this.serverEndpoint) return
    
    try {
      await fetch(this.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.warn('Failed to send security event to server:', error)
    }
  }
  
  private async sendAlertToServer(alert: SecurityAlert): Promise<void> {
    if (!this.serverEndpoint) return
    
    try {
      await fetch(`${this.serverEndpoint}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert)
      })
    } catch (error) {
      console.warn('Failed to send security alert to server:', error)
    }
  }
  
  private setupPeriodicCleanup(): void {
    // Limpiar eventos antiguos cada día
    setInterval(() => {
      this.clearOldEvents(30)
    }, 24 * 60 * 60 * 1000)
  }
}

// Instancia global
export const securityLogger = SecurityLogger.getInstance()

// Funciones de conveniencia
export const logSecurityInfo = (category: string, action: string, details?: any) => 
  securityLogger.logInfo(category, action, details)

export const logSecurityWarning = (category: string, action: string, details?: any) => 
  securityLogger.logWarning(category, action, details)

export const logSecurityError = (category: string, action: string, details?: any) => 
  securityLogger.logError(category, action, details)

export const logSecurityCritical = (category: string, action: string, details?: any) => 
  securityLogger.logCritical(category, action, details)

export const logRateLimitExceeded = (action: string, ip?: string) => 
  securityLogger.logRateLimitExceeded(action, ip)

export const logFailedAuth = (attempt: number, maxAttempts: number, details?: any) => 
  securityLogger.logFailedAuth(attempt, maxAttempts, details)

export const logCSRFAttempt = (details?: any) => 
  securityLogger.logCSRFAttempt(details)

export const logXSSAttempt = (input: string, details?: any) => 
  securityLogger.logXSSAttempt(input, details)

export const logSQLInjectionAttempt = (input: string, details?: any) => 
  securityLogger.logSQLInjectionAttempt(input, details)

export const logContractManipulationAttempt = (contractAddress: string, details?: any) => 
  securityLogger.logContractManipulationAttempt(contractAddress, details)

export const logOracleManipulationAttempt = (oracleAddress: string, details?: any) => 
  securityLogger.logOracleManipulationAttempt(oracleAddress, details)

export const logSuspiciousTransaction = (txHash: string, details?: any) => 
  securityLogger.logSuspiciousTransaction(txHash, details)

export const logUnauthorizedAccess = (resource: string, details?: any) => 
  securityLogger.logUnauthorizedAccess(resource, details)

export const logPrivilegeEscalationAttempt = (privilege: string, details?: any) => 
  securityLogger.logPrivilegeEscalationAttempt(privilege, details)

export const logValidationBypassAttempt = (validationType: string, details?: any) => 
  securityLogger.logValidationBypassAttempt(validationType, details)

// Hook para React
export function useSecurityLogger() {
  return {
    logInfo: logSecurityInfo,
    logWarning: logSecurityWarning,
    logError: logSecurityError,
    logCritical: logSecurityCritical,
    logRateLimitExceeded,
    logFailedAuth,
    logCSRFAttempt,
    logXSSAttempt,
    logSQLInjectionAttempt,
    logContractManipulationAttempt,
    logOracleManipulationAttempt,
    logSuspiciousTransaction,
    logUnauthorizedAccess,
    logPrivilegeEscalationAttempt,
    logValidationBypassAttempt,
    getEvents: securityLogger.getEvents.bind(securityLogger),
    getAlerts: securityLogger.getAlerts.bind(securityLogger),
    getStats: securityLogger.getStats.bind(securityLogger),
    exportData: securityLogger.exportData.bind(securityLogger)
  }
}
