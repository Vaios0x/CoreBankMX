import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

export interface PerformanceConfig {
  enabled: boolean
  sampleRate: number
  maxEvents: number
}

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  metadata?: Record<string, any>
}

export interface BlockchainMetric {
  transactionHash: string
  type: string
  gasUsed: number
  gasPrice: number
  blockNumber: number
  confirmationTime: number
  timestamp: number
}

export class PerformanceMonitor {
  private config: PerformanceConfig
  private metrics: PerformanceMetric[] = []
  private blockchainMetrics: BlockchainMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private isInitialized = false

  constructor(config: PerformanceConfig) {
    this.config = config
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized || !this.config.enabled) return

    try {
      // Inicializar Web Vitals
      this.initializeWebVitals()
      
      // Inicializar observadores de performance
      this.initializeObservers()
      
      // Configurar métricas personalizadas
      this.setupCustomMetrics()
      
      this.isInitialized = true
      console.log('✅ Performance monitoring initialized')

    } catch (error) {
      console.error('❌ Failed to initialize performance monitoring:', error)
    }
  }

  private initializeWebVitals() {
    // Core Web Vitals
    onCLS(this.handleWebVital.bind(this, 'CLS'))
    onFCP(this.handleWebVital.bind(this, 'FCP'))
    onLCP(this.handleWebVital.bind(this, 'LCP'))
    onTTFB(this.handleWebVital.bind(this, 'TTFB'))
    onINP(this.handleWebVital.bind(this, 'INP'))
  }

  private handleWebVital(name: string, metric: any) {
    if (Math.random() > this.config.sampleRate) return

    const rating = this.getRating(name, metric.value)
    
    this.addMetric({
      name,
      value: metric.value,
      rating,
      timestamp: Date.now(),
      metadata: {
        id: metric.id,
        delta: metric.delta,
        entries: metric.entries?.length || 0,
      },
    })

    // Enviar a analytics si está disponible
    this.sendToAnalytics('web_vital', {
      name,
      value: metric.value,
      rating,
      delta: metric.delta,
    })
  }

  private initializeObservers() {
    // Observer para navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.handleNavigationTiming(entry as PerformanceNavigationTiming)
            }
          })
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navigationObserver)
      } catch (error) {
        console.warn('Navigation observer not supported:', error)
      }

      // Observer para resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.handleResourceTiming(entry as PerformanceResourceTiming)
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (error) {
        console.warn('Resource observer not supported:', error)
      }

      // Observer para paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'paint') {
              this.handlePaintTiming(entry as PerformancePaintTiming)
            }
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.set('paint', paintObserver)
      } catch (error) {
        console.warn('Paint observer not supported:', error)
      }
    }
  }

  private handleNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = [
      { name: 'DNS_Lookup', value: entry.domainLookupEnd - entry.domainLookupStart },
      { name: 'TCP_Connection', value: entry.connectEnd - entry.connectStart },
      { name: 'Server_Response', value: entry.responseEnd - entry.requestStart },
      { name: 'DOM_Load', value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart },
      { name: 'Page_Load', value: entry.loadEventEnd - entry.loadEventStart },
    ]

    metrics.forEach(({ name, value }) => {
      if (value > 0) {
        this.addMetric({
          name,
          value,
          rating: this.getRating(name, value),
          timestamp: Date.now(),
        })
      }
    })
  }

  private handleResourceTiming(entry: PerformanceResourceTiming) {
    // Solo trackear recursos importantes
    const importantResources = ['api', 'contract', 'blockchain', 'wallet']
    const isImportant = importantResources.some(resource => 
      entry.name.includes(resource)
    )

    if (isImportant && Math.random() <= this.config.sampleRate) {
      this.addMetric({
        name: 'Resource_Load',
        value: entry.duration,
        rating: this.getRating('Resource_Load', entry.duration),
        timestamp: Date.now(),
        metadata: {
          resource: entry.name,
          size: entry.transferSize,
          type: entry.initiatorType,
        },
      })
    }
  }

  private handlePaintTiming(entry: PerformancePaintTiming) {
    this.addMetric({
      name: entry.name === 'first-paint' ? 'First_Paint' : 'First_Contentful_Paint',
      value: entry.startTime,
      rating: this.getRating(entry.name === 'first-paint' ? 'First_Paint' : 'FCP', entry.startTime),
      timestamp: Date.now(),
    })
  }

  private setupCustomMetrics() {
    // Métricas de memoria
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.addMetric({
          name: 'Memory_Usage',
          value: memory.usedJSHeapSize / 1024 / 1024, // MB
          rating: this.getRating('Memory_Usage', memory.usedJSHeapSize / 1024 / 1024),
          timestamp: Date.now(),
          metadata: {
            total: memory.totalJSHeapSize / 1024 / 1024,
            limit: memory.jsHeapSizeLimit / 1024 / 1024,
          },
        })
      }, 30000) // Cada 30 segundos
    }

    // Métricas de frame rate
    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFrameRate = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) { // Cada segundo
        const fps = frameCount * 1000 / (currentTime - lastTime)
        
        this.addMetric({
          name: 'Frame_Rate',
          value: fps,
          rating: this.getRating('Frame_Rate', fps),
          timestamp: Date.now(),
        })
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFrameRate)
    }
    
    requestAnimationFrame(measureFrameRate)
  }

  // Medir performance de una función
  measure<T>(name: string, fn: () => T): T {
    if (!this.isInitialized) return fn()

    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()
    
    try {
      const result = fn()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      const duration = endTime - startTime
      const memoryDelta = endMemory - startMemory
      
      this.addMetric({
        name: `Function_${name}`,
        value: duration,
        rating: this.getRating('Function_Performance', duration),
        timestamp: Date.now(),
        metadata: {
          memoryDelta,
          startMemory,
          endMemory,
        },
      })
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.addMetric({
        name: `Function_${name}_Error`,
        value: duration,
        rating: 'poor',
        timestamp: Date.now(),
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
      
      throw error
    }
  }

  // Medir performance de una función asíncrona
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isInitialized) return fn()

    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()
    
    try {
      const result = await fn()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      const duration = endTime - startTime
      const memoryDelta = endMemory - startMemory
      
      this.addMetric({
        name: `AsyncFunction_${name}`,
        value: duration,
        rating: this.getRating('AsyncFunction_Performance', duration),
        timestamp: Date.now(),
        metadata: {
          memoryDelta,
          startMemory,
          endMemory,
        },
      })
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.addMetric({
        name: `AsyncFunction_${name}_Error`,
        value: duration,
        rating: 'poor',
        timestamp: Date.now(),
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
      
      throw error
    }
  }

  // Trackear métricas de blockchain
  trackBlockchainTransaction(metric: Omit<BlockchainMetric, 'timestamp'>) {
    if (!this.isInitialized) return

    const blockchainMetric: BlockchainMetric = {
      ...metric,
      timestamp: Date.now(),
    }

    this.blockchainMetrics.push(blockchainMetric)
    
    // Limitar el número de métricas almacenadas
    if (this.blockchainMetrics.length > this.config.maxEvents) {
      this.blockchainMetrics = this.blockchainMetrics.slice(-this.config.maxEvents)
    }

    // Enviar a analytics
    this.sendToAnalytics('blockchain_transaction', blockchainMetric)
  }

  // Trackear gas usage
  trackGasUsage(
    transactionHash: string,
    gasUsed: number,
    gasPrice: number,
    gasLimit: number,
    type: string
  ) {
    if (!this.isInitialized) return

    const gasCost = gasUsed * gasPrice
    const efficiency = (gasUsed / gasLimit) * 100

    this.addMetric({
      name: 'Gas_Efficiency',
      value: efficiency,
      rating: this.getRating('Gas_Efficiency', efficiency),
      timestamp: Date.now(),
      metadata: {
        transactionHash: `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`,
        gasUsed,
        gasPrice,
        gasLimit,
        gasCost,
        type,
      },
    })

    this.sendToAnalytics('gas_usage', {
      transactionHash: `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`,
      gasUsed,
      gasPrice,
      gasCost,
      efficiency,
      type,
    })
  }

  // Trackear tiempo de confirmación de transacciones
  trackTransactionConfirmation(
    transactionHash: string,
    type: string,
    confirmationTime: number,
    blockNumber: number
  ) {
    if (!this.isInitialized) return

    this.addMetric({
      name: 'Transaction_Confirmation_Time',
      value: confirmationTime,
      rating: this.getRating('Transaction_Confirmation_Time', confirmationTime),
      timestamp: Date.now(),
      metadata: {
        transactionHash: `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`,
        type,
        blockNumber,
      },
    })

    this.sendToAnalytics('transaction_confirmation', {
      transactionHash: `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`,
      type,
      confirmationTime,
      blockNumber,
    })
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Limitar el número de métricas almacenadas
    if (this.metrics.length > this.config.maxEvents) {
      this.metrics = this.metrics.slice(-this.config.maxEvents)
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
      First_Paint: { good: 1000, poor: 2000 },
      Resource_Load: { good: 1000, poor: 3000 },
      Memory_Usage: { good: 50, poor: 100 },
      Frame_Rate: { good: 60, poor: 30 },
      Function_Performance: { good: 100, poor: 500 },
      AsyncFunction_Performance: { good: 1000, poor: 5000 },
      Gas_Efficiency: { good: 80, poor: 50 },
      Transaction_Confirmation_Time: { good: 15000, poor: 60000 },
    }

    const threshold = thresholds[metricName]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }

  private sendToAnalytics(eventName: string, data: any) {
    // Enviar a sistema de analytics externo
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, data)
    }
  }

  // Obtener estadísticas de performance
  getPerformanceStats() {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 24 * 60 * 60 * 1000 // Últimas 24 horas
    )

    const stats = {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      averageMetrics: {} as Record<string, number>,
      ratingDistribution: {
        good: 0,
        'needs-improvement': 0,
        poor: 0,
      },
      blockchainMetrics: this.blockchainMetrics.length,
    }

    // Calcular promedios por métrica
    const metricGroups = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = []
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    Object.entries(metricGroups).forEach(([name, values]) => {
      stats.averageMetrics[name] = values.reduce((a, b) => a + b, 0) / values.length
    })

    // Calcular distribución de ratings
    recentMetrics.forEach(metric => {
      stats.ratingDistribution[metric.rating]++
    })

    return stats
  }

  // Limpiar métricas antiguas
  cleanup() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo)
    this.blockchainMetrics = this.blockchainMetrics.filter(m => m.timestamp > oneDayAgo)
    
    console.log('🧹 Performance metrics cleaned up')
  }

  // Destruir observadores
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.isInitialized = false
  }
}
