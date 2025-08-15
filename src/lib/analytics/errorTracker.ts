import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { Replay } from '@sentry/replay'

export interface SentryConfig {
  dsn: string
  environment: string
  tracesSampleRate: number
  replaysSessionSampleRate: number
  replaysOnErrorSampleRate: number
}

export interface ErrorContext {
  user?: {
    id?: string
    address?: string
    network?: string
  }
  transaction?: {
    hash?: string
    type?: string
    amount?: string
    token?: string
  }
  blockchain?: {
    chainId?: number
    blockNumber?: number
    gasPrice?: string
  }
  component?: {
    name?: string
    props?: Record<string, any>
  }
  additional?: Record<string, any>
}

export class ErrorTracker {
  private config: SentryConfig
  private isInitialized = false

  constructor(config: SentryConfig) {
    this.config = config
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized || !this.config.dsn) return

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        integrations: [
          new BrowserTracing({
            tracePropagationTargets: ['localhost', 'banobs.com'],
          }),
          new Replay({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        tracesSampleRate: this.config.tracesSampleRate,
        replaysSessionSampleRate: this.config.replaysSessionSampleRate,
        replaysOnErrorSampleRate: this.config.replaysOnErrorSampleRate,
        
        // Configuración específica para blockchain
        beforeSend(event, hint) {
          // Filtrar errores de red no críticos
          if (event.exception) {
            const exception = event.exception.values?.[0]
            if (exception?.type === 'TypeError' && exception.value?.includes('Failed to fetch')) {
              return null // No enviar errores de red comunes
            }
          }
          
          // Anonimizar direcciones de wallet
          if (event.user?.id && event.user.id.startsWith('0x')) {
            event.user.id = `${event.user.id.slice(0, 6)}...${event.user.id.slice(-4)}`
          }
          
          return event
        },

        // Configuración de breadcrumbs para blockchain
        beforeBreadcrumb(breadcrumb) {
          // Filtrar breadcrumbs sensibles
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null
          }
          
          // Anonimizar datos sensibles en breadcrumbs
          if (breadcrumb.data) {
            this.anonymizeSensitiveData(breadcrumb.data)
          }
          
          return breadcrumb
        },
      })

      this.isInitialized = true
      console.log('✅ Sentry initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error)
    }
  }

  // Capturar error con contexto
  captureError(error: Error, context?: ErrorContext) {
    if (!this.isInitialized) return

    try {
      // Configurar contexto del usuario
      if (context?.user) {
        Sentry.setUser({
          id: context.user.id,
          username: context.user.address,
          ip_address: undefined, // No trackear IP
        })
      }

      // Configurar tags para blockchain
      const tags: Record<string, string> = {}
      if (context?.blockchain?.chainId) {
        tags.chainId = context.blockchain.chainId.toString()
      }
      if (context?.transaction?.type) {
        tags.transactionType = context.transaction.type
      }
      if (context?.component?.name) {
        tags.component = context.component.name
      }

      // Configurar contexto adicional
      const extra: Record<string, any> = {}
      if (context?.transaction) {
        extra.transaction = {
          hash: context.transaction.hash,
          type: context.transaction.type,
          amount: context.transaction.amount,
          token: context.transaction.token,
        }
      }
      if (context?.blockchain) {
        extra.blockchain = {
          chainId: context.blockchain.chainId,
          blockNumber: context.blockchain.blockNumber,
          gasPrice: context.blockchain.gasPrice,
        }
      }
      if (context?.additional) {
        Object.assign(extra, context.additional)
      }

      // Capturar el error
      Sentry.captureException(error, {
        tags,
        extra,
        level: 'error',
      })

      console.log('📊 Error captured in Sentry:', {
        message: error.message,
        tags,
        extra,
      })

    } catch (sentryError) {
      console.error('❌ Failed to capture error in Sentry:', sentryError)
    }
  }

  // Capturar mensaje informativo
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: ErrorContext) {
    if (!this.isInitialized) return

    try {
      const tags: Record<string, string> = {}
      const extra: Record<string, any> = {}

      if (context?.user) {
        Sentry.setUser({
          id: context.user.id,
          username: context.user.address,
        })
      }

      if (context?.additional) {
        Object.assign(extra, context.additional)
      }

      Sentry.captureMessage(message, {
        level,
        tags,
        extra,
      })

    } catch (error) {
      console.error('❌ Failed to capture message in Sentry:', error)
    }
  }

  // Configurar usuario actual
  setUser(userId: string, address?: string, network?: string) {
    if (!this.isInitialized) return

    try {
      Sentry.setUser({
        id: userId,
        username: address,
        ip_address: undefined,
      })

      Sentry.setTag('network', network || 'unknown')
      Sentry.setTag('wallet_connected', 'true')

    } catch (error) {
      console.error('❌ Failed to set user in Sentry:', error)
    }
  }

  // Limpiar usuario (logout)
  clearUser() {
    if (!this.isInitialized) return

    try {
      Sentry.setUser(null)
      Sentry.setTag('wallet_connected', 'false')

    } catch (error) {
      console.error('❌ Failed to clear user in Sentry:', error)
    }
  }

  // Agregar breadcrumb para tracking de acciones
  addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>,
    level: Sentry.SeverityLevel = 'info'
  ) {
    if (!this.isInitialized) return

    try {
      Sentry.addBreadcrumb({
        message,
        category,
        data: this.anonymizeSensitiveData(data || {}),
        level,
      })

    } catch (error) {
      console.error('❌ Failed to add breadcrumb in Sentry:', error)
    }
  }

  // Trackear transacciones blockchain
  trackTransaction(
    hash: string,
    type: string,
    amount: string,
    token: string,
    status: 'pending' | 'confirmed' | 'failed'
  ) {
    if (!this.isInitialized) return

    try {
      Sentry.addBreadcrumb({
        message: `Transaction ${status}`,
        category: 'blockchain.transaction',
        data: {
          hash: `${hash.slice(0, 6)}...${hash.slice(-4)}`,
          type,
          amount,
          token,
          status,
        },
        level: status === 'failed' ? 'error' : 'info',
      })

      if (status === 'failed') {
        this.captureMessage(`Transaction failed: ${type}`, 'error', {
          transaction: { hash, type, amount, token },
        })
      }

    } catch (error) {
      console.error('❌ Failed to track transaction in Sentry:', error)
    }
  }

  // Trackear errores de wallet
  trackWalletError(error: Error, walletType: string, action: string) {
    if (!this.isInitialized) return

    try {
      this.captureError(error, {
        additional: {
          walletType,
          action,
          errorType: 'wallet_error',
        },
      })

    } catch (sentryError) {
      console.error('❌ Failed to track wallet error in Sentry:', sentryError)
    }
  }

  // Trackear errores de contrato
  trackContractError(error: Error, contractAddress: string, functionName: string, args: any[]) {
    if (!this.isInitialized) return

    try {
      this.captureError(error, {
        additional: {
          contractAddress: `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
          functionName,
          args: args.map(arg => 
            typeof arg === 'string' && arg.startsWith('0x') 
              ? `${arg.slice(0, 6)}...${arg.slice(-4)}`
              : arg
          ),
          errorType: 'contract_error',
        },
      })

    } catch (sentryError) {
      console.error('❌ Failed to track contract error in Sentry:', sentryError)
    }
  }

  // Anonimizar datos sensibles
  private anonymizeSensitiveData(data: Record<string, any>): Record<string, any> {
    const anonymized = { ...data }

    // Anonimizar direcciones de wallet
    Object.keys(anonymized).forEach(key => {
      const value = anonymized[key]
      if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
        anonymized[key] = `${value.slice(0, 6)}...${value.slice(-4)}`
      }
    })

    return anonymized
  }

  // Obtener estadísticas de errores
  getErrorStats() {
    return {
      isInitialized: this.isInitialized,
      environment: this.config.environment,
      tracesSampleRate: this.config.tracesSampleRate,
    }
  }
}
