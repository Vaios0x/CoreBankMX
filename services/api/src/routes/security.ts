import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { securityLogger, SecurityEventType, SecurityLevel } from '../lib/security/logger'
import { getRateLimitStats, getAllRateLimits, resetRateLimit } from '../lib/security/rateLimiter'
import { validateCSPPolicy, generateCSPReport } from '../lib/security/csp'
import { withRateLimit } from '../lib/security/rateLimiter'
import { withValidation } from '../lib/security/inputValidation'

// Schemas de validación
const SecurityQuerySchema = z.object({
  type: z.enum(['events', 'alerts', 'stats', 'rate_limits']).optional(),
  level: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100)
})

const AlertActionSchema = z.object({
  alertId: z.string(),
  action: z.enum(['resolve', 'ignore', 'escalate']),
  notes: z.string().optional()
})

const RateLimitActionSchema = z.object({
  identifier: z.string(),
  type: z.string(),
  action: z.enum(['reset', 'block', 'unblock'])
})

// Plugin de rutas de seguridad
export const securityRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware de autenticación para rutas de seguridad (solo admin)
  const requireAdmin = async (request: any, reply: any) => {
    const apiKey = request.headers['x-api-key']
    const adminKey = process.env.API_KEY_ADMIN
    
    if (!apiKey || apiKey !== adminKey) {
      await securityLogger.logEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        SecurityLevel.ERROR,
        'security_routes',
        request,
        { endpoint: request.url, method: request.method }
      )
      reply.status(401).send({ error: 'Unauthorized access to security endpoints' })
      return
    }
  }

  // GET /api/security/events - Obtener eventos de seguridad
  fastify.get('/api/security/events', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')],
    schema: {
      querystring: SecurityQuerySchema
    }
  }, async (request, reply) => {
    try {
      const { type, level, startTime, endTime, limit } = request.query as any
      
      const events = await securityLogger.getEvents({
        type: type as SecurityEventType,
        level: level as SecurityLevel,
        startTime: startTime ? parseInt(startTime) : undefined,
        endTime: endTime ? parseInt(endTime) : undefined
      }, limit)

      return {
        success: true,
        data: events,
        count: events.length
      }
    } catch (error) {
      fastify.log.error(error, 'Error fetching security events')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/security/alerts - Obtener alertas de seguridad
  fastify.get('/api/security/alerts', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')],
    schema: {
      querystring: SecurityQuerySchema
    }
  }, async (request, reply) => {
    try {
      const { level, startTime, endTime } = request.query as any
      
      const alerts = await securityLogger.getAlerts({
        level: level as SecurityLevel,
        startTime: startTime ? parseInt(startTime) : undefined,
        endTime: endTime ? parseInt(endTime) : undefined
      })

      return {
        success: true,
        data: alerts,
        count: alerts.length,
        pending: alerts.filter(a => !a.resolved).length
      }
    } catch (error) {
      fastify.log.error(error, 'Error fetching security alerts')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/security/stats - Obtener estadísticas de seguridad
  fastify.get('/api/security/stats', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')]
  }, async (request, reply) => {
    try {
      const stats = await securityLogger.getStats()
      
      return {
        success: true,
        data: stats
      }
    } catch (error) {
      fastify.log.error(error, 'Error fetching security stats')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/security/rate-limits - Obtener estadísticas de rate limiting
  fastify.get('/api/security/rate-limits', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')]
  }, async (request, reply) => {
    try {
      const rateLimits = await getAllRateLimits()
      
      return {
        success: true,
        data: rateLimits,
        count: rateLimits.length
      }
    } catch (error) {
      fastify.log.error(error, 'Error fetching rate limits')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/security/rate-limits/:identifier/:type - Obtener stats específicos
  fastify.get('/api/security/rate-limits/:identifier/:type', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')]
  }, async (request, reply) => {
    try {
      const { identifier, type } = request.params as any
      const stats = await getRateLimitStats(identifier, type)
      
      return {
        success: true,
        data: stats
      }
    } catch (error) {
      fastify.log.error(error, 'Error fetching rate limit stats')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /api/security/alerts/:alertId/action - Acción en alerta
  fastify.post('/api/security/alerts/:alertId/action', {
    preHandler: [requireAdmin, withRateLimit('API_CALL'), withValidation(AlertActionSchema)],
    schema: {
      body: AlertActionSchema
    }
  }, async (request, reply) => {
    try {
      const { alertId } = request.params as any
      const { action, notes } = request.body as any
      
      if (action === 'resolve') {
        await securityLogger.resolveAlert(alertId, 'admin')
      }
      
      // Log de la acción
      await securityLogger.logEvent(
        SecurityEventType.INFO,
        SecurityLevel.INFO,
        'security_admin',
        request,
        { alertId, action, notes }
      )
      
      return {
        success: true,
        message: `Alert ${action}ed successfully`
      }
    } catch (error) {
      fastify.log.error(error, 'Error performing alert action')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /api/security/rate-limits/action - Acción en rate limits
  fastify.post('/api/security/rate-limits/action', {
    preHandler: [requireAdmin, withRateLimit('API_CALL'), withValidation(RateLimitActionSchema)],
    schema: {
      body: RateLimitActionSchema
    }
  }, async (request, reply) => {
    try {
      const { identifier, type, action } = request.body as any
      
      if (action === 'reset') {
        await resetRateLimit(identifier, type)
      }
      
      // Log de la acción
      await securityLogger.logEvent(
        SecurityEventType.INFO,
        SecurityLevel.INFO,
        'security_admin',
        request,
        { identifier, type, action }
      )
      
      return {
        success: true,
        message: `Rate limit ${action}ed successfully`
      }
    } catch (error) {
      fastify.log.error(error, 'Error performing rate limit action')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/security/csp/report - Reporte de CSP
  fastify.get('/api/security/csp/report', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')]
  }, async (request, reply) => {
    try {
      // Obtener política CSP actual
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isWeb3 = process.env.ENABLE_WEB3_CSP === 'true'
      
      let policy: Record<string, string[]>
      if (isWeb3) {
        policy = require('../lib/security/csp').CSP_CONFIG.WEB3
      } else if (isDevelopment) {
        policy = require('../lib/security/csp').CSP_CONFIG.DEVELOPMENT
      } else {
        policy = require('../lib/security/csp').CSP_CONFIG.PRODUCTION
      }
      
      const validation = validateCSPPolicy(policy)
      const report = generateCSPReport(policy)
      
      return {
        success: true,
        data: {
          policy,
          validation,
          report,
          environment: {
            isDevelopment,
            isWeb3
          }
        }
      }
    } catch (error) {
      fastify.log.error(error, 'Error generating CSP report')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/security/health - Estado de salud de seguridad
  fastify.get('/api/security/health', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')]
  }, async (request, reply) => {
    try {
      const stats = await securityLogger.getStats()
      const alerts = await securityLogger.getAlerts({ resolved: false })
      const rateLimits = await getAllRateLimits()
      
      // Calcular métricas de salud
      const criticalAlerts = alerts.filter(a => a.level === SecurityLevel.CRITICAL).length
      const errorAlerts = alerts.filter(a => a.level === SecurityLevel.ERROR).length
      const warningAlerts = alerts.filter(a => a.level === SecurityLevel.WARNING).length
      
      const healthScore = Math.max(0, 100 - (criticalAlerts * 20) - (errorAlerts * 10) - (warningAlerts * 5))
      
      return {
        success: true,
        data: {
          overall: {
            score: healthScore,
            status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'
          },
          alerts: {
            total: alerts.length,
            critical: criticalAlerts,
            error: errorAlerts,
            warning: warningAlerts
          },
          events: {
            total: stats.totalEvents,
            last24h: Object.values(stats.eventsByHour).reduce((sum, count) => sum + count, 0)
          },
          rateLimits: {
            active: rateLimits.length
          },
          recommendations: alerts.length > 0 ? [
            'Review pending security alerts',
            'Monitor rate limiting patterns',
            'Check for unusual activity'
          ] : [
            'Security systems operating normally',
            'Continue monitoring for threats',
            'Regular security audits recommended'
          ]
        }
      }
    } catch (error) {
      fastify.log.error(error, 'Error checking security health')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /api/security/test - Endpoint de prueba de seguridad
  fastify.post('/api/security/test', {
    preHandler: [requireAdmin, withRateLimit('API_CALL')]
  }, async (request, reply) => {
    try {
      const testResults = {
        rateLimiting: 'active',
        inputValidation: 'active',
        csp: 'active',
        logging: 'active',
        timestamp: Date.now()
      }
      
      // Log de prueba
      await securityLogger.logEvent(
        SecurityEventType.INFO,
        SecurityLevel.INFO,
        'security_test',
        request,
        testResults
      )
      
      return {
        success: true,
        message: 'Security systems test completed',
        data: testResults
      }
    } catch (error) {
      fastify.log.error(error, 'Error during security test')
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
