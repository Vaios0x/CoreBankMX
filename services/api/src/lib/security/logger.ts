import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../logger'
import Redis from 'redis'

// Tipos de eventos de seguridad
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  FAILED_AUTH = 'failed_auth',
  CSRF_ATTEMPT = 'csrf_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  CONTRACT_MANIPULATION_ATTEMPT = 'contract_manipulation_attempt',
  ORACLE_MANIPULATION_ATTEMPT = 'oracle_manipulation_attempt',
  SUSPICIOUS_TRANSACTION = 'suspicious_transaction',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt',
  VALIDATION_BYPASS_ATTEMPT = 'validation_bypass_attempt',
  INJECTION_ATTEMPT = 'injection_attempt',
  MALICIOUS_PAYLOAD = 'malicious_payload',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  DDoS_ATTEMPT = 'ddos_attempt',
  API_ABUSE = 'api_abuse',
  DATA_EXFILTRATION_ATTEMPT = 'data_exfiltration_attempt',
  SESSION_HIJACKING_ATTEMPT = 'session_hijacking_attempt',
  TOKEN_THEFT_ATTEMPT = 'token_theft_attempt',
  CONTRACT_EXPLOIT_ATTEMPT = 'contract_exploit_attempt'
}

// Niveles de severidad
export enum SecurityLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Interfaces
export interface SecurityEvent {
  id: string
  timestamp: number
  type: SecurityEventType
  level: SecurityLevel
  source: string
  ip: string
  userAgent?: string
  userId?: string
  sessionId?: string
  apiKey?: string
  endpoint: string
  method: string
  payload?: any
  details: any
  resolved: boolean
  resolvedAt?: number
  resolvedBy?: string
}

export interface SecurityAlert {
  id: string
  eventId: string
  timestamp: number
  level: SecurityLevel
  title: string
  description: string
  source: string
  ip: string
  userId?: string
  resolved: boolean
  resolvedAt?: number
  resolvedBy?: string
  actions: string[]
}

export interface SecurityStats {
  totalEvents: number
  eventsByType: Record<SecurityEventType, number>
  eventsByLevel: Record<SecurityLevel, number>
  eventsByHour: Record<string, number>
  topIPs: Array<{ ip: string; count: number }>
  topEndpoints: Array<{ endpoint: string; count: number }>
  resolvedEvents: number
  pendingAlerts: number
}

// Clase principal de logging de seguridad
export class SecurityLogger {
  private redisClient: Redis.RedisClientType | null = null
  private alertThresholds: Record<SecurityEventType, number> = {
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: 5,
    [SecurityEventType.FAILED_AUTH]: 3,
    [SecurityEventType.CSRF_ATTEMPT]: 1,
    [SecurityEventType.XSS_ATTEMPT]: 1,
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: 1,
    [SecurityEventType.CONTRACT_MANIPULATION_ATTEMPT]: 1,
    [SecurityEventType.ORACLE_MANIPULATION_ATTEMPT]: 1,
    [SecurityEventType.SUSPICIOUS_TRANSACTION]: 2,
    [SecurityEventType.UNAUTHORIZED_ACCESS]: 3,
    [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]: 1,
    [SecurityEventType.VALIDATION_BYPASS_ATTEMPT]: 2,
    [SecurityEventType.INJECTION_ATTEMPT]: 1,
    [SecurityEventType.MALICIOUS_PAYLOAD]: 1,
    [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 5,
    [SecurityEventType.DDoS_ATTEMPT]: 10,
    [SecurityEventType.API_ABUSE]: 3,
    [SecurityEventType.DATA_EXFILTRATION_ATTEMPT]: 1,
    [SecurityEventType.SESSION_HIJACKING_ATTEMPT]: 1,
    [SecurityEventType.TOKEN_THEFT_ATTEMPT]: 1,
    [SecurityEventType.CONTRACT_EXPLOIT_ATTEMPT]: 1
  }

  constructor() {
    this.initRedis()
  }

  private async initRedis() {
    if (!this.redisClient) {
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      })
      
      this.redisClient.on('error', (err) => {
        console.error('Security Logger Redis Error:', err)
      })
      
      await this.redisClient.connect()
    }
  }

  // Log de evento de seguridad
  async logEvent(
    type: SecurityEventType,
    level: SecurityLevel,
    source: string,
    request: FastifyRequest,
    details: any,
    payload?: any
  ): Promise<string> {
    const event: SecurityEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      level,
      source,
      ip: request.ip || 'unknown',
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id,
      sessionId: (request as any).session?.id,
      apiKey: request.headers['x-api-key'] as string,
      endpoint: request.url,
      method: request.method,
      payload,
      details,
      resolved: false
    }

    // Guardar en Redis
    await this.saveEvent(event)

    // Log en consola
    this.logToConsole(event)

    // Verificar si debe crear alerta
    await this.checkAndCreateAlert(event)

    return event.id
  }

  // Crear alerta de seguridad
  async createAlert(event: SecurityEvent): Promise<string> {
    const alert: SecurityAlert = {
      id: this.generateId(),
      eventId: event.id,
      timestamp: Date.now(),
      level: event.level,
      title: this.getAlertTitle(event.type),
      description: this.getAlertDescription(event.type, event.details),
      source: event.source,
      ip: event.ip,
      userId: event.userId,
      resolved: false,
      actions: this.getAlertActions(event.type)
    }

    // Guardar alerta en Redis
    await this.saveAlert(alert)

    // Log de alerta
    logger.warn({
      alert: alert,
      event: event
    }, 'Security alert created')

    return alert.id
  }

  // Resolver alerta
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    const alert = await this.getAlert(alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      alert.resolvedBy = resolvedBy
      await this.saveAlert(alert)
    }
  }

  // Obtener eventos
  async getEvents(
    filter?: {
      type?: SecurityEventType
      level?: SecurityLevel
      ip?: string
      userId?: string
      resolved?: boolean
      startTime?: number
      endTime?: number
    },
    limit: number = 100
  ): Promise<SecurityEvent[]> {
    const client = await this.initRedis()
    const events: SecurityEvent[] = []
    
    // Implementar filtrado por Redis
    const keys = await client.keys('security_event:*')
    
    for (const key of keys.slice(0, limit)) {
      const eventData = await client.get(key)
      if (eventData) {
        const event: SecurityEvent = JSON.parse(eventData)
        
        // Aplicar filtros
        if (filter) {
          if (filter.type && event.type !== filter.type) continue
          if (filter.level && event.level !== filter.level) continue
          if (filter.ip && event.ip !== filter.ip) continue
          if (filter.userId && event.userId !== filter.userId) continue
          if (filter.resolved !== undefined && event.resolved !== filter.resolved) continue
          if (filter.startTime && event.timestamp < filter.startTime) continue
          if (filter.endTime && event.timestamp > filter.endTime) continue
        }
        
        events.push(event)
      }
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Obtener alertas
  async getAlerts(
    filter?: {
      level?: SecurityLevel
      resolved?: boolean
      startTime?: number
      endTime?: number
    }
  ): Promise<SecurityAlert[]> {
    const client = await this.initRedis()
    const alerts: SecurityAlert[] = []
    
    const keys = await client.keys('security_alert:*')
    
    for (const key of keys) {
      const alertData = await client.get(key)
      if (alertData) {
        const alert: SecurityAlert = JSON.parse(alertData)
        
        // Aplicar filtros
        if (filter) {
          if (filter.level && alert.level !== filter.level) continue
          if (filter.resolved !== undefined && alert.resolved !== filter.resolved) continue
          if (filter.startTime && alert.timestamp < filter.startTime) continue
          if (filter.endTime && alert.timestamp > filter.endTime) continue
        }
        
        alerts.push(alert)
      }
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Obtener estadísticas
  async getStats(): Promise<SecurityStats> {
    const events = await this.getEvents()
    const alerts = await this.getAlerts()
    
    const stats: SecurityStats = {
      totalEvents: events.length,
      eventsByType: {} as Record<SecurityEventType, number>,
      eventsByLevel: {} as Record<SecurityLevel, number>,
      eventsByHour: {},
      topIPs: [],
      topEndpoints: [],
      resolvedEvents: events.filter(e => e.resolved).length,
      pendingAlerts: alerts.filter(a => !a.resolved).length
    }
    
    // Contar por tipo
    events.forEach(event => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1
      stats.eventsByLevel[event.level] = (stats.eventsByLevel[event.level] || 0) + 1
      
      // Por hora
      const hour = new Date(event.timestamp).toISOString().slice(0, 13)
      stats.eventsByHour[hour] = (stats.eventsByHour[hour] || 0) + 1
    })
    
    // Top IPs
    const ipCounts: Record<string, number> = {}
    events.forEach(event => {
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1
    })
    stats.topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Top endpoints
    const endpointCounts: Record<string, number> = {}
    events.forEach(event => {
      endpointCounts[event.endpoint] = (endpointCounts[event.endpoint] || 0) + 1
    })
    stats.topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return stats
  }

  // Métodos privados
  private async saveEvent(event: SecurityEvent): Promise<void> {
    const client = await this.initRedis()
    await client.set(`security_event:${event.id}`, JSON.stringify(event))
    await client.expire(`security_event:${event.id}`, 30 * 24 * 60 * 60) // 30 días
  }

  private async saveAlert(alert: SecurityAlert): Promise<void> {
    const client = await this.initRedis()
    await client.set(`security_alert:${alert.id}`, JSON.stringify(alert))
    await client.expire(`security_alert:${alert.id}`, 30 * 24 * 60 * 60) // 30 días
  }

  private async getAlert(alertId: string): Promise<SecurityAlert | null> {
    const client = await this.initRedis()
    const data = await client.get(`security_alert:${alertId}`)
    return data ? JSON.parse(data) : null
  }

  private async checkAndCreateAlert(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds[event.type]
    if (!threshold) return

    // Contar eventos similares en las últimas 24 horas
    const events = await this.getEvents({
      type: event.type,
      ip: event.ip,
      startTime: Date.now() - 24 * 60 * 60 * 1000
    })

    if (events.length >= threshold) {
      await this.createAlert(event)
    }
  }

  private logToConsole(event: SecurityEvent): void {
    const logData = {
      security_event: {
        id: event.id,
        type: event.type,
        level: event.level,
        source: event.source,
        ip: event.ip,
        endpoint: event.endpoint,
        method: event.method,
        details: event.details
      }
    }

    switch (event.level) {
      case SecurityLevel.INFO:
        logger.info(logData, 'Security event')
        break
      case SecurityLevel.WARNING:
        logger.warn(logData, 'Security warning')
        break
      case SecurityLevel.ERROR:
        logger.error(logData, 'Security error')
        break
      case SecurityLevel.CRITICAL:
        logger.fatal(logData, 'Critical security event')
        break
    }
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getAlertTitle(type: SecurityEventType): string {
    const titles: Record<SecurityEventType, string> = {
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'Rate Limit Exceeded',
      [SecurityEventType.FAILED_AUTH]: 'Failed Authentication',
      [SecurityEventType.CSRF_ATTEMPT]: 'CSRF Attack Attempt',
      [SecurityEventType.XSS_ATTEMPT]: 'XSS Attack Attempt',
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 'SQL Injection Attempt',
      [SecurityEventType.CONTRACT_MANIPULATION_ATTEMPT]: 'Contract Manipulation Attempt',
      [SecurityEventType.ORACLE_MANIPULATION_ATTEMPT]: 'Oracle Manipulation Attempt',
      [SecurityEventType.SUSPICIOUS_TRANSACTION]: 'Suspicious Transaction',
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 'Unauthorized Access',
      [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]: 'Privilege Escalation Attempt',
      [SecurityEventType.VALIDATION_BYPASS_ATTEMPT]: 'Validation Bypass Attempt',
      [SecurityEventType.INJECTION_ATTEMPT]: 'Injection Attack Attempt',
      [SecurityEventType.MALICIOUS_PAYLOAD]: 'Malicious Payload Detected',
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 'Brute Force Attack Attempt',
      [SecurityEventType.DDoS_ATTEMPT]: 'DDoS Attack Attempt',
      [SecurityEventType.API_ABUSE]: 'API Abuse Detected',
      [SecurityEventType.DATA_EXFILTRATION_ATTEMPT]: 'Data Exfiltration Attempt',
      [SecurityEventType.SESSION_HIJACKING_ATTEMPT]: 'Session Hijacking Attempt',
      [SecurityEventType.TOKEN_THEFT_ATTEMPT]: 'Token Theft Attempt',
      [SecurityEventType.CONTRACT_EXPLOIT_ATTEMPT]: 'Contract Exploit Attempt'
    }
    return titles[type] || 'Security Alert'
  }

  private getAlertDescription(type: SecurityEventType, details: any): string {
    const descriptions: Record<SecurityEventType, string> = {
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: `Rate limit exceeded for IP. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.FAILED_AUTH]: `Authentication failed. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.CSRF_ATTEMPT]: `CSRF token validation failed. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.XSS_ATTEMPT]: `XSS payload detected in input. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: `SQL injection pattern detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.CONTRACT_MANIPULATION_ATTEMPT]: `Suspicious contract interaction detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.ORACLE_MANIPULATION_ATTEMPT]: `Oracle price manipulation attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.SUSPICIOUS_TRANSACTION]: `Suspicious transaction pattern detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.UNAUTHORIZED_ACCESS]: `Unauthorized access attempt to protected resource. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]: `Privilege escalation attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.VALIDATION_BYPASS_ATTEMPT]: `Input validation bypass attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.INJECTION_ATTEMPT]: `Code injection attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.MALICIOUS_PAYLOAD]: `Malicious payload detected in request. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: `Brute force attack attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.DDoS_ATTEMPT]: `DDoS attack pattern detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.API_ABUSE]: `API abuse detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.DATA_EXFILTRATION_ATTEMPT]: `Data exfiltration attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.SESSION_HIJACKING_ATTEMPT]: `Session hijacking attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.TOKEN_THEFT_ATTEMPT]: `Token theft attempt detected. Details: ${JSON.stringify(details)}`,
      [SecurityEventType.CONTRACT_EXPLOIT_ATTEMPT]: `Contract exploit attempt detected. Details: ${JSON.stringify(details)}`
    }
    return descriptions[type] || `Security event detected. Details: ${JSON.stringify(details)}`
  }

  private getAlertActions(type: SecurityEventType): string[] {
    const actions: Record<SecurityEventType, string[]> = {
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: ['Block IP temporarily', 'Monitor for patterns'],
      [SecurityEventType.FAILED_AUTH]: ['Review authentication logs', 'Check for brute force'],
      [SecurityEventType.CSRF_ATTEMPT]: ['Review CSRF implementation', 'Check token validation'],
      [SecurityEventType.XSS_ATTEMPT]: ['Review input validation', 'Check sanitization'],
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: ['Review database queries', 'Check parameterization'],
      [SecurityEventType.CONTRACT_MANIPULATION_ATTEMPT]: ['Review contract interactions', 'Check transaction patterns'],
      [SecurityEventType.ORACLE_MANIPULATION_ATTEMPT]: ['Review oracle usage', 'Check price validation'],
      [SecurityEventType.SUSPICIOUS_TRANSACTION]: ['Review transaction patterns', 'Check for anomalies'],
      [SecurityEventType.UNAUTHORIZED_ACCESS]: ['Review access controls', 'Check authorization'],
      [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]: ['Review user permissions', 'Check role assignments'],
      [SecurityEventType.VALIDATION_BYPASS_ATTEMPT]: ['Review input validation', 'Check bypass methods'],
      [SecurityEventType.INJECTION_ATTEMPT]: ['Review code execution', 'Check input sanitization'],
      [SecurityEventType.MALICIOUS_PAYLOAD]: ['Review payload validation', 'Check content filtering'],
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: ['Implement rate limiting', 'Add CAPTCHA'],
      [SecurityEventType.DDoS_ATTEMPT]: ['Enable DDoS protection', 'Monitor traffic patterns'],
      [SecurityEventType.API_ABUSE]: ['Review API usage', 'Implement stricter limits'],
      [SecurityEventType.DATA_EXFILTRATION_ATTEMPT]: ['Review data access', 'Check for leaks'],
      [SecurityEventType.SESSION_HIJACKING_ATTEMPT]: ['Review session management', 'Check token security'],
      [SecurityEventType.TOKEN_THEFT_ATTEMPT]: ['Review token security', 'Check for exposure'],
      [SecurityEventType.CONTRACT_EXPLOIT_ATTEMPT]: ['Review contract security', 'Check for vulnerabilities']
    }
    return actions[type] || ['Review security logs', 'Investigate further']
  }
}

// Instancia global
export const securityLogger = new SecurityLogger()

// Funciones de conveniencia
export const logRateLimitExceeded = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityLevel.WARNING,
    'rate_limiter',
    request,
    details
  )
}

export const logFailedAuth = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.FAILED_AUTH,
    SecurityLevel.WARNING,
    'auth',
    request,
    details
  )
}

export const logCSRFAttempt = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.CSRF_ATTEMPT,
    SecurityLevel.ERROR,
    'csrf',
    request,
    details
  )
}

export const logXSSAttempt = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.XSS_ATTEMPT,
    SecurityLevel.ERROR,
    'xss',
    request,
    details
  )
}

export const logSQLInjectionAttempt = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.SQL_INJECTION_ATTEMPT,
    SecurityLevel.CRITICAL,
    'sql_injection',
    request,
    details
  )
}

export const logContractManipulationAttempt = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.CONTRACT_MANIPULATION_ATTEMPT,
    SecurityLevel.CRITICAL,
    'contract',
    request,
    details
  )
}

export const logOracleManipulationAttempt = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.ORACLE_MANIPULATION_ATTEMPT,
    SecurityLevel.CRITICAL,
    'oracle',
    request,
    details
  )
}

export const logSuspiciousTransaction = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.SUSPICIOUS_TRANSACTION,
    SecurityLevel.WARNING,
    'transaction',
    request,
    details
  )
}

export const logUnauthorizedAccess = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.UNAUTHORIZED_ACCESS,
    SecurityLevel.ERROR,
    'auth',
    request,
    details
  )
}

export const logPrivilegeEscalationAttempt = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT,
    SecurityLevel.CRITICAL,
    'auth',
    request,
    details
  )
}

export const logValidationBypassAttempt = (request: FastifyRequest, details: any) => {
  return securityLogger.logEvent(
    SecurityEventType.VALIDATION_BYPASS_ATTEMPT,
    SecurityLevel.ERROR,
    'validation',
    request,
    details
  )
}
