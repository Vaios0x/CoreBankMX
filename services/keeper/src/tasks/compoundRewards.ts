import type { FastifyBaseLogger } from 'fastify'

export async function compoundRewards(log: FastifyBaseLogger) {
  // Placeholder: if APR > gas cost*coef then trigger vault.compound()
  log.info({ task: 'compoundRewards' }, 'Compound evaluation (mock)')
}


