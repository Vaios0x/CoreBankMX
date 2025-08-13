import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const Schema = z.object({
  country: z.string().length(2),
  documentType: z.enum(['INE', 'PASSPORT', 'RFC']),
  userId: z.string().min(3),
})

export async function kycRoutes(app: FastifyInstance) {
  app.post('/kyc/submit', async (req, res) => {
    const parse = Schema.safeParse(req.body)
    if (!parse.success) return res.status(400).send({ error: 'invalid_payload', issues: parse.error.issues })
    return { status: 'queued' }
  })
}


