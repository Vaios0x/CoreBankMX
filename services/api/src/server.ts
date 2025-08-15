import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import Fastify from 'fastify'
import { cfg } from './lib/config'
import { logger } from './lib/logger'
import { statusRoutes } from './routes/status'
import { marketRoutes } from './routes/market'
import { liquidationRoutes } from './routes/liquidations'
import { kycRoutes } from './routes/kyc'
import { onrampRoutes } from './routes/onramp'
import { oracleRoutes } from './routes/oracle'
import { interestRoutes } from './routes/interest'
import { positionsRoutes } from './routes/positions'
import { remittancesRoutes } from './routes/remittances'
import { offrampRoutes } from './routes/offramp'
import { userRoutes } from './routes/user'

// Importar módulos de seguridad
import { cspPlugin } from './lib/security/csp'
import { rateLimitMiddleware, withRateLimit } from './lib/security/rateLimiter'
import { validationMiddleware, withValidation, SecureSchemas } from './lib/security/inputValidation'
import { securityLogger, logRateLimitExceeded, logFailedAuth, logXSSAttempt, logSQLInjectionAttempt } from './lib/security/logger'
import { securityRoutes } from './routes/security'

async function main() {
  const app = Fastify({ logger })
  
  // Registrar plugin de CSP
  await app.register(cspPlugin)
  
  // Middleware de seguridad global
  app.addHook('preHandler', async (request, reply) => {
    // Rate limiting global
    try {
      await rateLimitMiddleware('DEFAULT', { windowMs: 15 * 60 * 1000, max: 100 })(request, reply)
    } catch (error) {
      await logRateLimitExceeded(request, { endpoint: request.url, method: request.method })
      return
    }
    
    // Validación básica de entrada
    if (request.body && typeof request.body === 'object') {
      const bodyStr = JSON.stringify(request.body)
      if (bodyStr.includes('<script') || bodyStr.includes('javascript:')) {
        await logXSSAttempt(request, { payload: bodyStr })
        reply.status(400).send({ error: 'Malicious content detected' })
        return
      }
    }
  })
  
  // Registrar rutas con seguridad
  await app.register(statusRoutes)
  await app.register(marketRoutes)
  await app.register(liquidationRoutes)
  await app.register(kycRoutes)
  await app.register(onrampRoutes)
  await app.register(oracleRoutes)
  await app.register(interestRoutes)
  await app.register(remittancesRoutes)
  await app.register(offrampRoutes)
  await app.register(userRoutes)
  await app.register(securityRoutes)
  // Ad-hoc accrue cron si está activado
  if (process.env.ACCRUE_CRON_SEC) {
    const every = Number(process.env.ACCRUE_CRON_SEC)
    setInterval(async () => {
      try {
        await fetch(`http://localhost:${cfg.API_PORT}/interest/accrue`, { method: 'POST', headers: { 'x-api-key': process.env.API_KEY_ADMIN || '' } })
        app.log.info('Accrued interest')
      } catch (e: any) {
        app.log.error({ err: e?.message }, 'Accrue failed')
      }
    }, Math.max(10, every) * 1000)
  }
  // Si se define MONITOR_USERS_ADDRESSES, exponerlos en /positions/users para demo seed
  await app.register(positionsRoutes)
  await app.listen({ port: cfg.API_PORT, host: '0.0.0.0' })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})


