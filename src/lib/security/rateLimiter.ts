// Rate Limiter para Frontend
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()
  private storage: Storage
  
  constructor(useSessionStorage: boolean = true) {
    this.storage = useSessionStorage ? sessionStorage : localStorage
    this.loadFromStorage()
  }
  
  private getStorageKey(action: string, windowMs: number): string {
    const windowKey = Math.floor(Date.now() / windowMs)
    return `rate_limit_${action}_${windowKey}`
  }
  
  private loadFromStorage(): void {
    try {
      const keys = Object.keys(this.storage)
      const rateLimitKeys = keys.filter(key => key.startsWith('rate_limit_'))
      
      for (const key of rateLimitKeys) {
        const value = this.storage.getItem(key)
        if (value) {
          try {
            const data = JSON.parse(value)
            this.attempts.set(key, data)
          } catch {
            this.storage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load rate limit data from storage:', error)
    }
  }
  
  private saveToStorage(key: string, data: { count: number; resetTime: number }): void {
    try {
      this.storage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save rate limit data to storage:', error)
    }
  }
  
  private cleanupExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, data] of this.attempts.entries()) {
      if (now > data.resetTime) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.attempts.delete(key)
      this.storage.removeItem(key)
    }
  }
  
  canAttempt(
    action: string, 
    maxAttempts: number = 5, 
    windowMs: number = 60000
  ): boolean {
    this.cleanupExpired()
    
    const key = this.getStorageKey(action, windowMs)
    const current = this.attempts.get(key) || { 
      count: 0, 
      resetTime: Date.now() + windowMs 
    }
    
    if (Date.now() > current.resetTime) {
      this.attempts.delete(key)
      this.storage.removeItem(key)
      return true
    }
    
    if (current.count >= maxAttempts) {
      return false
    }
    
    current.count++
    this.attempts.set(key, current)
    this.saveToStorage(key, current)
    
    return true
  }
  
  getRemainingAttempts(
    action: string, 
    maxAttempts: number = 5, 
    windowMs: number = 60000
  ): number {
    this.cleanupExpired()
    
    const key = this.getStorageKey(action, windowMs)
    const current = this.attempts.get(key)
    
    if (!current || Date.now() > current.resetTime) {
      return maxAttempts
    }
    
    return Math.max(0, maxAttempts - current.count)
  }
  
  getResetTime(
    action: string, 
    windowMs: number = 60000
  ): number | null {
    this.cleanupExpired()
    
    const key = this.getStorageKey(action, windowMs)
    const current = this.attempts.get(key)
    
    if (!current || Date.now() > current.resetTime) {
      return null
    }
    
    return current.resetTime
  }
  
  reset(action: string, windowMs: number = 60000): void {
    const key = this.getStorageKey(action, windowMs)
    this.attempts.delete(key)
    this.storage.removeItem(key)
  }
  
  resetAll(): void {
    this.attempts.clear()
    
    try {
      const keys = Object.keys(this.storage)
      const rateLimitKeys = keys.filter(key => key.startsWith('rate_limit_'))
      
      for (const key of rateLimitKeys) {
        this.storage.removeItem(key)
      }
    } catch (error) {
      console.warn('Failed to reset rate limit data from storage:', error)
    }
  }
}

// Configuración de rate limits específicos
export const RATE_LIMIT_CONFIG = {
  // Autenticación
  AUTH: {
    LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 intentos en 15 minutos
    REGISTER: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 intentos en 1 hora
    PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 intentos en 1 hora
    TWO_FACTOR: { maxAttempts: 10, windowMs: 15 * 60 * 1000 }, // 10 intentos en 15 minutos
  },
  
  // Transacciones blockchain
  TRANSACTIONS: {
    BORROW: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 préstamos en 1 hora
    REPAY: { maxAttempts: 20, windowMs: 60 * 60 * 1000 }, // 20 repagos en 1 hora
    DEPOSIT: { maxAttempts: 15, windowMs: 60 * 60 * 1000 }, // 15 depósitos en 1 hora
    WITHDRAW: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 retiros en 1 hora
    APPROVE: { maxAttempts: 20, windowMs: 60 * 60 * 1000 }, // 20 aprobaciones en 1 hora
  },
  
  // API calls
  API: {
    MARKET_DATA: { maxAttempts: 100, windowMs: 15 * 60 * 1000 }, // 100 requests en 15 minutos
    ORACLE_PRICE: { maxAttempts: 50, windowMs: 15 * 60 * 1000 }, // 50 requests en 15 minutos
    USER_PROFILE: { maxAttempts: 30, windowMs: 15 * 60 * 1000 }, // 30 requests en 15 minutos
    SETTINGS: { maxAttempts: 20, windowMs: 15 * 60 * 1000 }, // 20 requests en 15 minutos
  },
  
  // Formularios
  FORMS: {
    BORROW_FORM: { maxAttempts: 30, windowMs: 15 * 60 * 1000 }, // 30 envíos en 15 minutos
    REPAY_FORM: { maxAttempts: 30, windowMs: 15 * 60 * 1000 }, // 30 envíos en 15 minutos
    SETTINGS_FORM: { maxAttempts: 20, windowMs: 15 * 60 * 1000 }, // 20 envíos en 15 minutos
    KYC_FORM: { maxAttempts: 5, windowMs: 60 * 60 * 1000 }, // 5 envíos en 1 hora
  },
  
  // Acciones de usuario
  USER_ACTIONS: {
    COPY_LINK: { maxAttempts: 50, windowMs: 15 * 60 * 1000 }, // 50 copias en 15 minutos
    SHARE: { maxAttempts: 20, windowMs: 15 * 60 * 1000 }, // 20 shares en 15 minutos
    EXPORT_DATA: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 exports en 1 hora
    DELETE_ACCOUNT: { maxAttempts: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 intentos en 24 horas
  }
}

// Instancia global del rate limiter
export const rateLimiter = new RateLimiter(true)

// Hook para usar rate limiting en componentes React
export function useRateLimit() {
  const checkRateLimit = (
    action: string, 
    maxAttempts?: number, 
    windowMs?: number
  ): boolean => {
    const config = getRateLimitConfig(action)
    return rateLimiter.canAttempt(action, config.maxAttempts, config.windowMs)
  }
  
  const getRemainingAttempts = (
    action: string, 
    maxAttempts?: number, 
    windowMs?: number
  ): number => {
    const config = getRateLimitConfig(action)
    return rateLimiter.getRemainingAttempts(action, config.maxAttempts, config.windowMs)
  }
  
  const getResetTime = (action: string, windowMs?: number): number | null => {
    const config = getRateLimitConfig(action)
    return rateLimiter.getResetTime(action, config.windowMs)
  }
  
  const resetRateLimit = (action: string, windowMs?: number): void => {
    const config = getRateLimitConfig(action)
    rateLimiter.reset(action, config.windowMs)
  }
  
  return {
    checkRateLimit,
    getRemainingAttempts,
    getResetTime,
    resetRateLimit
  }
}

// Función para obtener configuración de rate limit
function getRateLimitConfig(action: string): { maxAttempts: number; windowMs: number } {
  // Buscar en configuración específica
  for (const category of Object.values(RATE_LIMIT_CONFIG)) {
    if (action in category) {
      return category[action as keyof typeof category]
    }
  }
  
  // Configuración por defecto
  return { maxAttempts: 10, windowMs: 15 * 60 * 1000 }
}

// Función para verificar si una acción está rate limited
export function isRateLimited(action: string): boolean {
  const config = getRateLimitConfig(action)
  return !rateLimiter.canAttempt(action, config.maxAttempts, config.windowMs)
}

// Función para obtener mensaje de error de rate limit
export function getRateLimitMessage(action: string): string {
  const config = getRateLimitConfig(action)
  const remaining = rateLimiter.getRemainingAttempts(action, config.maxAttempts, config.windowMs)
  const resetTime = rateLimiter.getResetTime(action, config.windowMs)
  
  if (remaining > 0) {
    return `You have ${remaining} attempts remaining`
  }
  
  if (resetTime) {
    const minutes = Math.ceil((resetTime - Date.now()) / (60 * 1000))
    return `Rate limit exceeded. Try again in ${minutes} minutes`
  }
  
  return 'Rate limit exceeded. Please try again later'
}

// Función para registrar intento de acción
export function logActionAttempt(action: string, success: boolean = true): void {
  const config = getRateLimitConfig(action)
  const wasAllowed = rateLimiter.canAttempt(action, config.maxAttempts, config.windowMs)
  
  if (!wasAllowed) {
    console.warn(`Rate limit exceeded for action: ${action}`)
    
    // Aquí podrías enviar analytics o logging
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'rate_limit_exceeded', {
        action,
        max_attempts: config.maxAttempts,
        window_ms: config.windowMs
      })
    }
  }
  
  if (success && wasAllowed) {
    // Log successful action
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'action_attempt', {
        action,
        success: true
      })
    }
  }
}

// Función para verificar rate limit antes de ejecutar acción
export function withRateLimit<T extends any[], R>(
  action: string,
  fn: (...args: T) => R | Promise<R>
): (...args: T) => R | Promise<R> {
  return async (...args: T): Promise<R> => {
    if (isRateLimited(action)) {
      throw new Error(getRateLimitMessage(action))
    }
    
    try {
      const result = await fn(...args)
      logActionAttempt(action, true)
      return result
    } catch (error) {
      logActionAttempt(action, false)
      throw error
    }
  }
}

// Función para decorar funciones con rate limiting
export function rateLimited(
  action: string,
  maxAttempts?: number,
  windowMs?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      const config = getRateLimitConfig(action)
      const finalMaxAttempts = maxAttempts || config.maxAttempts
      const finalWindowMs = windowMs || config.windowMs
      
      if (!rateLimiter.canAttempt(action, finalMaxAttempts, finalWindowMs)) {
        throw new Error(getRateLimitMessage(action))
      }
      
      try {
        const result = originalMethod.apply(this, args)
        logActionAttempt(action, true)
        return result
      } catch (error) {
        logActionAttempt(action, false)
        throw error
      }
    }
    
    return descriptor
  }
}

// Función para crear un rate limiter específico para una acción
export function createActionRateLimiter(
  action: string,
  maxAttempts?: number,
  windowMs?: number
) {
  const config = getRateLimitConfig(action)
  const finalMaxAttempts = maxAttempts || config.maxAttempts
  const finalWindowMs = windowMs || config.windowMs
  
  return {
    canAttempt: () => rateLimiter.canAttempt(action, finalMaxAttempts, finalWindowMs),
    getRemainingAttempts: () => rateLimiter.getRemainingAttempts(action, finalMaxAttempts, finalWindowMs),
    getResetTime: () => rateLimiter.getResetTime(action, finalWindowMs),
    reset: () => rateLimiter.reset(action, finalWindowMs),
    isLimited: () => !rateLimiter.canAttempt(action, finalMaxAttempts, finalWindowMs),
    getMessage: () => getRateLimitMessage(action)
  }
}

// Función para limpiar rate limits expirados
export function cleanupExpiredRateLimits(): void {
  rateLimiter['cleanupExpired']()
}

// Limpiar rate limits expirados cada minuto
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 60 * 1000)
}

// Exportar tipos
export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime: number | null
  message: string
}
