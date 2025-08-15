import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const QuoteSchema = z.object({ 
  amount: z.coerce.number().positive(), 
  currency: z.enum(['USD', 'MXN']) 
})

const CreateRemittanceSchema = z.object({
  txHash: z.string(),
  quote: z.object({
    amount: z.number(),
    currency: z.enum(['USD', 'MXN']),
    recipientName: z.string(),
    recipientPhone: z.string(),
    recipientBank: z.string().optional(),
    recipientAccount: z.string().optional(),
    deliveryMethod: z.enum(['bank', 'cash', 'mobile']),
    notes: z.string().optional(),
    fee: z.number(),
    exchangeRate: z.number(),
    totalCost: z.number(),
    estimatedDelivery: z.string()
  }),
  userAddress: z.string()
})

const HistoryQuerySchema = z.object({
  address: z.string()
})

export async function remittancesRoutes(app: FastifyInstance) {
  // Obtener cotización de remesa
  app.post('/remittances/quote', async (req, res) => {
    const parse = QuoteSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_payload', 
        issues: parse.error.issues 
      })
    }

    const { amount, currency } = parse.data
    
    try {
      // Simular cotización con datos reales
      const exchangeRate = currency === 'MXN' ? 17.2 : 1
      const fee = amount * 0.005 // 0.5% fee
      const totalCost = amount + fee
      const estimatedDelivery = '2-4 hours'

      return {
        success: true,
        data: {
          amount,
          currency,
          fee,
          exchangeRate,
          totalCost,
          estimatedDelivery,
          provider: 'Bitso'
        }
      }
    } catch (error) {
      app.log.error('Error getting remittance quote:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get quote'
      })
    }
  })

  // Crear nueva remesa
  app.post('/remittances/create', async (req, res) => {
    const parse = CreateRemittanceSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_payload', 
        issues: parse.error.issues 
      })
    }

    const { txHash, quote, userAddress } = parse.data
    
    try {
      // Simular procesamiento de remesa
      const remittanceId = `remittance_${Date.now()}`
      const reference = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Aquí se integraría con servicios externos como Bitso, Banamex, etc.
      // Por ahora simulamos el procesamiento
      
      app.log.info('Creating remittance:', {
        id: remittanceId,
        txHash,
        userAddress,
        amount: quote.amount,
        currency: quote.currency,
        recipient: quote.recipientName
      })

      return {
        success: true,
        data: {
          id: remittanceId,
          reference,
          status: 'processing',
          estimatedDelivery: quote.estimatedDelivery
        }
      }
    } catch (error) {
      app.log.error('Error creating remittance:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to create remittance'
      })
    }
  })

  // Obtener historial de remesas
  app.get('/remittances/history', async (req, res) => {
    const parse = HistoryQuerySchema.safeParse(req.query)
    if (!parse.success) {
      return res.status(400).send({ 
        error: 'invalid_query', 
        issues: parse.error.issues 
      })
    }

    const { address } = parse.data
    
    try {
      // Simular historial de remesas
      const remittances = [
        {
          id: 'demo_1',
          amount: 500,
          currency: 'USD',
          recipientName: 'María González',
          recipientPhone: '+52 55 1234 5678',
          fee: 2.5,
          exchangeRate: 17.2,
          totalCost: 502.5,
          estimatedDelivery: '2-4 hours',
          status: 'completed',
          createdAt: Date.now() - 86400000,
          reference: 'REF123456789'
        },
        {
          id: 'demo_2',
          amount: 1000,
          currency: 'MXN',
          recipientName: 'Carlos Rodríguez',
          recipientPhone: '+52 33 9876 5432',
          fee: 5,
          exchangeRate: 1,
          totalCost: 1005,
          estimatedDelivery: '1-2 hours',
          status: 'processing',
          createdAt: Date.now() - 3600000,
          reference: 'REF987654321'
        }
      ]

      return {
        success: true,
        data: {
          remittances,
          total: remittances.length,
          address
        }
      }
    } catch (error) {
      app.log.error('Error getting remittance history:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get history'
      })
    }
  })

  // Obtener estado de una remesa específica
  app.get('/remittances/:id/status', async (req, res) => {
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
      app.log.error('Error getting remittance status:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to get status'
      })
    }
  })

  // Cancelar remesa
  app.post('/remittances/:id/cancel', async (req, res) => {
    const { id } = req.params as { id: string }
    
    try {
      app.log.info('Cancelling remittance:', { id })
      
      return {
        success: true,
        data: {
          id,
          status: 'cancelled',
          cancelledAt: Date.now()
        }
      }
    } catch (error) {
      app.log.error('Error cancelling remittance:', error)
      return res.status(500).send({ 
        error: 'internal_server_error',
        message: 'Failed to cancel remittance'
      })
    }
  })
}
