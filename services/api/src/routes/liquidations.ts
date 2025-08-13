import type { FastifyInstance } from 'fastify'

export async function liquidationRoutes(app: FastifyInstance) {
  app.post('/liquidations/run', {
    preHandler: (req, res, done) => {
      const key = req.headers['x-api-key']
      if (!key || key !== process.env.API_KEY_ADMIN) return res.status(401).send({ error: 'unauthorized' })
      done()
    },
  }, async () => {
    // TODO: trigger keeper by IPC/HTTP or import
    return { ok: true, started: true }
  })
}


