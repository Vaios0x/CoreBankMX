import Fastify from 'fastify'

export async function buildServer() {
  const app = Fastify({ logger: true })
  app.get('/healthz', async () => ({ ok: true }))
  app.get('/metrics', async () => ({ counters: {}, gauges: {} }))
  return app
}


