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

async function main() {
  const app = Fastify({ logger })
  await app.register(statusRoutes)
  await app.register(marketRoutes)
  await app.register(liquidationRoutes)
  await app.register(kycRoutes)
  await app.register(onrampRoutes)
  await app.register(oracleRoutes)
  await app.register(interestRoutes)
  await app.register(positionsRoutes)
  await app.listen({ port: cfg.API_PORT, host: '0.0.0.0' })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})


