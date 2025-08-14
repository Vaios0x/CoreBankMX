import { z } from 'zod'

const EnvSchema = z.object({
  VITE_CORE_CHAIN_ID_MAINNET: z.coerce.number().default(1116),
  VITE_CORE_CHAIN_ID_TESTNET: z.coerce.number().default(1114),
  VITE_CORE_RPC_MAINNET: z.string().url().default('https://rpc.coredao.org'),
  VITE_CORE_RPC_TESTNET: z
    .string()
    .url()
    .default('https://rpc.test2.btcs.network'),
  VITE_EXPLORER_MAINNET: z
    .string()
    .url()
    .default('https://scan.coredao.org'),
  VITE_EXPLORER_TESTNET: z
    .string()
    .url()
    .default('https://scan.test2.btcs.network'),
  VITE_CONTRACT_COLLATERAL_VAULT: z.string().default('0x0000000000000000000000000000000000000000'),
  VITE_CONTRACT_LOAN_MANAGER: z.string().default('0x0000000000000000000000000000000000000000'),
  VITE_CONTRACT_STAKING_VAULT: z.string().default('0x0000000000000000000000000000000000000000'),
  VITE_CONTRACT_ORACLE_ROUTER: z.string().default('0x0000000000000000000000000000000000000000'),
  VITE_CONTRACT_DEBT_TOKEN: z.string().default('0x0000000000000000000000000000000000000000'),
  VITE_CONTRACT_COLLATERAL_TOKEN: z.string().default('0x0000000000000000000000000000000000000000'),
  VITE_WALLETCONNECT_PROJECT_ID: z.string().default('demo-project-id'),
  VITE_USE_MOCKS: z.coerce.boolean().default(true),
  VITE_USE_ONCHAIN_ORACLE: z.coerce.boolean().default(false),
  VITE_DOCS_URL: z.string().url().default('https://docs.example.com'),
  VITE_API_URL: z.string().url().default('https://api.example.com'),
  VITE_STATUS_URL: z.string().url().default('https://status.example.com'),
  VITE_TWITTER_URL: z.string().url().default('https://x.com/example'),
  VITE_DISCORD_URL: z.string().url().default('https://discord.gg/example'),
  VITE_GITHUB_URL: z.string().url().default('https://github.com/example/repo'),
  VITE_TELEMETRY_ENABLED: z.coerce.boolean().default(false),
  VITE_POSTHOG_KEY: z.string().default(''),
  VITE_POSTHOG_HOST: z.string().default('https://app.posthog.com'),
  VITE_MIXPANEL_TOKEN: z.string().default(''),
})

const parsed = EnvSchema.parse(import.meta.env)

export const env = {
  CHAIN_ID_MAINNET: parsed.VITE_CORE_CHAIN_ID_MAINNET,
  CHAIN_ID_TESTNET: parsed.VITE_CORE_CHAIN_ID_TESTNET,
  RPC_MAINNET: parsed.VITE_CORE_RPC_MAINNET,
  RPC_TESTNET: parsed.VITE_CORE_RPC_TESTNET,
  EXPLORER_MAINNET: parsed.VITE_EXPLORER_MAINNET,
  EXPLORER_TESTNET: parsed.VITE_EXPLORER_TESTNET,
  COLLATERAL_VAULT: parsed.VITE_CONTRACT_COLLATERAL_VAULT,
  LOAN_MANAGER: parsed.VITE_CONTRACT_LOAN_MANAGER,
  STAKING_VAULT: parsed.VITE_CONTRACT_STAKING_VAULT,
  ORACLE_ROUTER: parsed.VITE_CONTRACT_ORACLE_ROUTER,
  DEBT_TOKEN: parsed.VITE_CONTRACT_DEBT_TOKEN,
  COLLATERAL_TOKEN: parsed.VITE_CONTRACT_COLLATERAL_TOKEN,
  WALLETCONNECT_PROJECT_ID: parsed.VITE_WALLETCONNECT_PROJECT_ID,
  USE_MOCKS: parsed.VITE_USE_MOCKS,
  USE_ONCHAIN_ORACLE: parsed.VITE_USE_ONCHAIN_ORACLE,
  DOCS_URL: parsed.VITE_DOCS_URL,
  API_URL: parsed.VITE_API_URL,
  STATUS_URL: parsed.VITE_STATUS_URL,
  TWITTER_URL: parsed.VITE_TWITTER_URL,
  DISCORD_URL: parsed.VITE_DISCORD_URL,
  GITHUB_URL: parsed.VITE_GITHUB_URL,
  TELEMETRY_ENABLED: parsed.VITE_TELEMETRY_ENABLED,
  POSTHOG_KEY: parsed.VITE_POSTHOG_KEY,
  POSTHOG_HOST: parsed.VITE_POSTHOG_HOST,
  MIXPANEL_TOKEN: parsed.VITE_MIXPANEL_TOKEN,
}


