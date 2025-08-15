import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const QuoteSchema = z.object({ 
  cryptoAmount: z.coerce.number().positive(), 
  cryptoCurrency: z.enum(['BTC', 'USDT', 'CORE']),
  fiatCurrency: z.enum(['MXN'])
})

const CreateOffRampSchema = z.object({
  txHash: z.string(),
  quote: z.object({
    cryptoAmount: z.number(),
    cryptoCurrency: z.enum(['BTC', 'USDT', 'CORE']),
    fiatAmount: z.number(),
    fiatCurrency: z.enum(['MXN']),
    exchangeRate: z.number(),
    fee: z.number(),
    totalCost: z.number(),
    estimatedDelivery: z.string(),
    provider: z.enum(['Bitso', 'Banamex', 'OXXO']),
    bankAccount: z.string(),
    bankName: z.string(),
    accountHolder: z.string(),
    deliveryMethod: z.enum(['bank', 'cash', 'mobile']),
    notes: z.string().optional()
  }),
  userAddress: z.string()
})

const HistoryQuerySchema = z.object({
  address: z.string()
})

// Interfaz para la respuesta de Bitso
interface BitsoTickerResponse {
  success: boolean
  payload: {
    book: string
    volume: string
    high: string
    last: string
    low: string
    vwap: string
    ask: string
    bid: string
    created_at: string
  }
}

export async function offrampRoutes(app: FastifyInstance) {
  // Obtener tasas de cambio de Bitso
  async function getBitsoRates(): Promise<Record<string, number>> {
    try {
      const pairs = ['btc_mxn', 'usdt_mxn']
      const rates: Record<string, number> = {}
      
      for (const pair of pairs) {
        const response = await fetch(`https://api.bitso.com/v3/ticker/?book=${pair}`)
        if (response.ok) {
          const data: BitsoTickerResponse = await response.json()
          if (data.success) {
            rates[pair] = parseFloat(data.payload.last)
          }
        }
      }
      
      return rates
    } catch (error) {
      app.log.error('Error fetching Bitso rates:', error)
      // Fallback con tasas simuladas
      return {
        btc_mxn: 850000,
        usdt_mxn: 17.2
      }
    }
  }

  // Obtener cotización de off-ramp
  app.post('/offramp/quote', async (req, res) => {
    const parse = QuoteSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_payload', 
        issues: parse.error.issues 
      })
    }

    const { cryptoAmount, cryptoCurrency, fiatCurrency } = parse.data
    
    try {
      // Obtener tasas de Bitso
      const bitsoRates = await getBitsoRates()
      
      // Calcular tasa de cambio
      const rate = bitsoRates[`${cryptoCurrency.toLowerCase()}_mxn`] || 
                   (cryptoCurrency === 'BTC' ? 850000 : 17.2)
      
      const fiatAmount = cryptoAmount * rate
      const fee = fiatAmount * 0.005 // 0.5% fee
      const totalCost = fiatAmount + fee
      const estimatedDelivery = '1-2 business days'
      const provider = 'Bitso'

      return {
        success: true,
        data: {
          cryptoAmount,
          cryptoCurrency,
          fiatAmount,
          fiatCurrency,
          exchangeRate: rate,
          fee,
          totalCost,
          estimatedDelivery,
          provider
        }
      }
    } catch (error) {
      app.log.error('Error getting off-ramp quote:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get quote'
      })
    }
  })

  // Crear nueva transacción de off-ramp
  app.post('/offramp/create', async (req, res) => {
    const parse = CreateOffRampSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_payload', 
        issues: parse.error.issues 
      })
    }

    const { txHash, quote, userAddress } = parse.data
    
    try {
      // Simular procesamiento de off-ramp
      const offrampId = `offramp_${Date.now()}`
      const reference = `OFF${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Aquí se integraría con Bitso para procesar la transacción
      // Por ahora simulamos el procesamiento
      
      app.log.info('Creating off-ramp transaction:', {
        id: offrampId,
        txHash,
        userAddress,
        cryptoAmount: quote.cryptoAmount,
        cryptoCurrency: quote.cryptoCurrency,
        fiatAmount: quote.fiatAmount,
        provider: quote.provider
      })

      return {
        success: true,
        data: {
          id: offrampId,
          reference,
          status: 'processing',
          estimatedDelivery: quote.estimatedDelivery
        }
      }
    } catch (error) {
      app.log.error('Error creating off-ramp:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to create off-ramp'
      })
    }
  })

  // Obtener historial de off-ramp
  app.get('/offramp/history', async (req, res) => {
    const parse = HistoryQuerySchema.safeParse(req.query)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_query', 
        issues: parse.error.issues 
      })
    }

    const { address } = parse.data
    
    try {
      // Simular historial de off-ramp
      const offramps = [
        {
          id: 'demo_1',
          cryptoAmount: 0.1,
          cryptoCurrency: 'BTC',
          fiatAmount: 85000,
          fiatCurrency: 'MXN',
          exchangeRate: 850000,
          fee: 425,
          totalCost: 85425,
          estimatedDelivery: '1-2 business days',
          provider: 'Bitso',
          status: 'completed',
          createdAt: Date.now() - 86400000,
          bankAccount: '012345678901234567',
          reference: 'OFF123456789'
        },
        {
          id: 'demo_2',
          cryptoAmount: 1000,
          cryptoCurrency: 'USDT',
          fiatAmount: 17200,
          fiatCurrency: 'MXN',
          exchangeRate: 17.2,
          fee: 86,
          totalCost: 17286,
          estimatedDelivery: '1-2 business days',
          provider: 'Bitso',
          status: 'processing',
          createdAt: Date.now() - 3600000,
          bankAccount: '987654321098765432',
          reference: 'OFF987654321'
        }
      ]

      return {
        success: true,
        data: {
          offramps,
          total: offramps.length,
          address
        }
      }
    } catch (error) {
      app.log.error('Error getting off-ramp history:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get history'
      })
    }
  })

  // Obtener estado de una transacción de off-ramp específica
  app.get('/offramp/:id/status', async (req, res) => {
    const { id } = req.params as { id: string }
    
    try {
      // Simular consulta de estado
      const status = Math.random() > 0.5 ? 'completed' : 'processing'
      
      return {
        success: true,
        data: {
          id,
          status,
          updatedAt: Date.now()
        }
      }
    } catch (error) {
      app.log.error('Error getting off-ramp status:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get status'
      })
    }
  })

  // Cancelar transacción de off-ramp
  app.post('/offramp/:id/cancel', async (req, res) => {
    const { id } = req.params as { id: string }
    
    try {
      app.log.info('Cancelling off-ramp transaction:', { id })
      
      return {
        success: true,
        data: {
          id,
          status: 'cancelled',
          cancelledAt: Date.now()
        }
      }
    } catch (error) {
      app.log.error('Error cancelling off-ramp:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to cancel off-ramp'
      })
    }
  })

  // Obtener tasas de cambio en tiempo real
  app.get('/offramp/rates', async (req, res) => {
    try {
      const rates = await getBitsoRates()
      
      return {
        success: true,
        data: {
          rates,
          timestamp: Date.now(),
          provider: 'Bitso'
        }
      }
    } catch (error) {
      app.log.error('Error getting exchange rates:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get rates'
      })
    }
  })

  // Obtener proveedores disponibles
  app.get('/offramp/providers', async (req, res) => {
    try {
      const providers = [
        {
          id: 'bitso',
          name: 'Bitso',
          description: 'Exchange mexicano líder en crypto',
          fees: '0.5%',
          deliveryTime: '1-2 business days',
          supportedCurrencies: ['BTC', 'USDT', 'CORE'],
          minAmount: 100,
          maxAmount: 1000000
        },
        {
          id: 'banamex',
          name: 'Banamex',
          description: 'Banco tradicional mexicano',
          fees: '1.0%',
          deliveryTime: '2-3 business days',
          supportedCurrencies: ['BTC', 'USDT'],
          minAmount: 500,
          maxAmount: 500000
        },
        {
          id: 'oxxo',
          name: 'OXXO',
          description: 'Retiro en efectivo en tiendas OXXO',
          fees: '2.0%',
          deliveryTime: 'Same day',
          supportedCurrencies: ['BTC', 'USDT'],
          minAmount: 50,
          maxAmount: 10000
        }
      ]

      return {
        success: true,
        data: {
          providers,
          total: providers.length
        }
      }
    } catch (error) {
      app.log.error('Error getting providers:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get providers'
      })
    }
  })
}
