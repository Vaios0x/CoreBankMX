import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import cron from 'node-cron'
import { buildServer } from './http/server'
import { monitorPositions } from './tasks/monitorPositions'
import { compoundRewards } from './tasks/compoundRewards'

async function main() {
  const app = await buildServer()
  const port = Number(process.env.API_PORT || 8081)
  await app.listen({ port, host: '0.0.0.0' })

  cron.schedule('*/15 * * * * *', () => monitorPositions(app.log))
  cron.schedule('*/60 * * * * *', () => compoundRewards(app.log))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})


