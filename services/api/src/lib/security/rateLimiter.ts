import { FastifyRequest, FastifyReply } from 'fastify'
import Redis from 'redis'
import { promisify } from 'util'

// Configuración de rate limiting
export const RATE_LIMIT_CONFIG = {
  // Límites por IP
  IP_LIMITS: {
    DEFAULT: { windowMs: 15 * 60 * 1000, max: 100 }, // 15 minutos, 100 requests
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 15 minutos, 5 intentos de auth
    TRANSACTION: { windowMs: 60 * 1000, max: 10 }, // 1 minuto, 10 transacciones
    API_CALL: { windowMs: 60 * 1000, max: 30 }, // 1 minuto, 30 llamadas API
    FORM_SUBMIT: { windowMs: 60 * 1000, max: 20 }, // 1 minuto, 20 envíos de formulario
    USER_ACTION: { windowMs: 60 * 1000, max: 50 }, // 1 minuto, 50 acciones de usuario
  },
  // Límites por usuario autenticado
  USER_LIMITS: {
    DEFAULT: { windowMs: 15 * 60 * 1000, max: 200 },
    TRANSACTION: { windowMs: 60 * 1000, max: 20 },
    API_CALL: { windowMs: 60 * 1000, max: 60 },
  },
  // Límites por API key
  API_KEY_LIMITS: {
    DEFAULT: { windowMs: 15 * 60 * 1000, max: 1000 },
    ADMIN: { windowMs: 15 * 60 * 1000, max: 5000 },
  }
}

// Cliente Redis para rate limiting
let redisClient: Redis.RedisClientType | null = null

export const initRedis = async () => {
  if (!redisClient) {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    })
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })
    
    await redisClient.connect()
  }
  return redisClient
}

// Función para obtener la clave de rate limiting
const getRateLimitKey = (identifier: string, type: string): string => {
  return `rate_limit:${type}:${identifier}`
}

// Función para verificar rate limit
export const checkRateLimit = async (
  identifier: string, 
  type: string, 
  limit: { windowMs: number; max: number }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  const client = await initRedis()
  const key = getRateLimitKey(identifier, type)
  const now = Date.now()
  const windowStart = now - limit.windowMs

  // Obtener requests en la ventana de tiempo
  const multi = client.multi()
  multi.zRemRangeByScore(key, 0, windowStart)
  multi.zCard(key)
  multi.zAdd(key, { score: now, value: now.toString() })
  multi.expire(key, Math.ceil(limit.windowMs / 1000))

  const results = await multi.exec()
  const currentCount = results?.[1] as number || 0

  const allowed = currentCount < limit.max
  const remaining = Math.max(0, limit.max - currentCount)
  const resetTime = now + limit.windowMs

  return { allowed, remaining, resetTime }
}

// Middleware de rate limiting para Fastify
export const rateLimitMiddleware = (type: string, limit: { windowMs: number; max: number }) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Obtener identificador (IP, user ID, o API key)
      let identifier = request.ip || 'unknown'
      
      // Si hay usuario autenticado, usar su ID
      if (request.user?.id) {
        identifier = `user:${request.user.id}`
      }
      
      // Si hay API key, usar la API key
      if (request.headers['x-api-key']) {
        identifier = `apikey:${request.headers['x-api-key']}`
      }

      const result = await checkRateLimit(identifier, type, limit)
      
      if (!result.allowed) {
        reply.status(429).send({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
          remaining: result.remaining,
          resetTime: result.resetTime
        })
        return
      }

      // Agregar headers de rate limiting
      reply.header('X-RateLimit-Limit', limit.max)
      reply.header('X-RateLimit-Remaining', result.remaining)
      reply.header('X-RateLimit-Reset', result.resetTime)
      
    } catch (error) {
      console.error('Rate limiting error:', error)
      // En caso de error, permitir la request pero loggear
      reply.header('X-RateLimit-Error', 'true')
    }
  }
}

// Decorador para aplicar rate limiting a rutas específicas
export const withRateLimit = (type: string, limit?: { windowMs: number; max: number }) => {
  const config = limit || RATE_LIMIT_CONFIG.IP_LIMITS[type as keyof typeof RATE_LIMIT_CONFIG.IP_LIMITS] || RATE_LIMIT_CONFIG.IP_LIMITS.DEFAULT
  
  return {
    preHandler: rateLimitMiddleware(type, config)
  }
}

// Función para obtener estadísticas de rate limiting
export const getRateLimitStats = async (identifier: string, type: string) => {
  const client = await initRedis()
  const key = getRateLimitKey(identifier, type)
  
  const count = await client.zCard(key)
  const ttl = await client.ttl(key)
  
  return { count, ttl }
}

// Función para resetear rate limits (solo para admin)
export const resetRateLimit = async (identifier: string, type: string) => {
  const client = await initRedis()
  const key = getRateLimitKey(identifier, type)
  await client.del(key)
}

// Función para obtener todos los rate limits activos
export const getAllRateLimits = async () => {
  const client = await initRedis()
  const keys = await client.keys('rate_limit:*')
  const stats = []
  
  for (const key of keys) {
    const count = await client.zCard(key)
    const ttl = await client.ttl(key)
    stats.push({ key, count, ttl })
  }
  
  return stats
}
