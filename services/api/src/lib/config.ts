import { z } from 'zod'

const Env = z.object({
  CORE_RPC_MAINNET: z.string().url().default('https://rpc.coredao.org'),
  CORE_RPC_TESTNET: z.string().url().default('https://rpc.test2.btcs.network'),
  CORE_CHAIN_ID_MAINNET: z.coerce.number().default(1116),
  CORE_CHAIN_ID_TESTNET: z.coerce.number().default(1114),
  EXPLORER_MAINNET: z.string().url().default('https://scan.coredao.org'),
  EXPLORER_TESTNET: z.string().url().default('https://scan.test2.btcs.network'),
  API_PORT: z.coerce.number().default(8080),
  API_KEY_ADMIN: z.string().default('change_me'),
  ORACLE_PRIMARY: z.enum(['redstone', 'pyth']).default('redstone'),
  REDSTONE_URL: z.string().url().default('https://oracle-gateway-1.a.redstone.finance'),
  PYTH_URL: z.string().url().default('https://hermes.pyth.network'),
})

export const cfg = Env.parse(process.env)


