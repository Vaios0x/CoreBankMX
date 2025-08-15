import { Analytics } from './analytics'
import { ErrorTracker } from './errorTracker'
import { PerformanceMonitor } from './performanceMonitor'
import { ABTesting } from './abTesting'
import { UserAnalytics } from './userAnalytics'
import { env } from '../env'

// Configuración global de analytics
export interface AnalyticsConfig {
  enabled: boolean
  sentry: {
    dsn: string
    environment: string
    tracesSampleRate: number
    replaysSessionSampleRate: number
    replaysOnErrorSampleRate: number
  }
  performance: {
    enabled: boolean
    sampleRate: number
    maxEvents: number
  }
  userAnalytics: {
    enabled: boolean
    anonymize: boolean
    trackEvents: boolean
    trackPageViews: boolean
  }
  abTesting: {
    enabled: boolean
    experiments: Record<string, any>
  }
}

// Configuración por defecto
const defaultConfig: AnalyticsConfig = {
  enabled: env.ANALYTICS_ENABLED === 'true',
  sentry: {
    dsn: env.SENTRY_DSN || '',
    environment: env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },
  performance: {
    enabled: true,
    sampleRate: 0.1,
    maxEvents: 1000,
  },
  userAnalytics: {
    enabled: true,
    anonymize: false,
    trackEvents: true,
    trackPageViews: true,
  },
  abTesting: {
    enabled: true,
    experiments: {},
  },
}

// Instancias globales
let analytics: Analytics
let errorTracker: ErrorTracker
let performanceMonitor: PerformanceMonitor
let abTesting: ABTesting
let userAnalytics: UserAnalytics

// Inicializar sistema de analytics
export function initializeAnalytics(config: Partial<AnalyticsConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }
  
  if (!finalConfig.enabled) {
    console.log('📊 Analytics disabled')
    return
  }

  try {
    // Inicializar Sentry para error tracking
    if (finalConfig.sentry.dsn) {
      errorTracker = new ErrorTracker(finalConfig.sentry)
      console.log('✅ Sentry initialized for error tracking')
    }

    // Inicializar performance monitoring
    if (finalConfig.performance.enabled) {
      performanceMonitor = new PerformanceMonitor(finalConfig.performance)
      console.log('✅ Performance monitoring initialized')
    }

    // Inicializar user analytics
    if (finalConfig.userAnalytics.enabled) {
      userAnalytics = new UserAnalytics(finalConfig.userAnalytics)
      console.log('✅ User analytics initialized')
    }

    // Inicializar A/B testing
    if (finalConfig.abTesting.enabled) {
      abTesting = new ABTesting(finalConfig.abTesting)
      console.log('✅ A/B testing framework initialized')
    }

    // Inicializar analytics principal
    analytics = new Analytics({
      errorTracker,
      performanceMonitor,
      userAnalytics,
      abTesting,
    })

    console.log('🚀 Analytics system fully initialized')

  } catch (error) {
    console.error('❌ Failed to initialize analytics:', error)
  }
}

// Exportar instancias para uso en componentes
export function getAnalytics() {
  return analytics
}

export function getErrorTracker() {
  return errorTracker
}

export function getPerformanceMonitor() {
  return performanceMonitor
}

export function getABTesting() {
  return abTesting
}

export function getUserAnalytics() {
  return userAnalytics
}

// Utilidades para tracking
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (userAnalytics) {
    userAnalytics.trackEvent(eventName, properties)
  }
}

export function trackPageView(pageName: string, properties?: Record<string, any>) {
  if (userAnalytics) {
    userAnalytics.trackPageView(pageName, properties)
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (errorTracker) {
    errorTracker.captureError(error, context)
  }
}

export function measurePerformance(name: string, fn: () => any) {
  if (performanceMonitor) {
    return performanceMonitor.measure(name, fn)
  }
  return fn()
}

export function getExperimentVariant(experimentName: string) {
  if (abTesting) {
    return abTesting.getVariant(experimentName)
  }
  return null
}

// Hook para React
export function useAnalytics() {
  return {
    trackEvent,
    trackPageView,
    captureError,
    measurePerformance,
    getExperimentVariant,
  }
}
