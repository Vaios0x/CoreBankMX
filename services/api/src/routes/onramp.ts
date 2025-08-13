import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const QuoteSchema = z.object({ amount: z.coerce.number().positive(), currency: z.enum(['MXN', 'USD']) })

export async function onrampRoutes(app: FastifyInstance) {
  app.post('/onramp/quote', async (req, res) => {
    const parse = QuoteSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).send({ error: 'invalid_payload', issues: parse.error.issues })
    const rate = parse.data.currency === 'MXN' ? 17.2 : 1
    const fee = parse.data.amount * 0.005
    return { provider: 'Bitso (stub)', rate, fee, total: parse.data.amount + fee }
  })
}


