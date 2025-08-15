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
  VITE_CONTRACT_COLLATERAL_VAULT: z.string().default('0xeC153A56E676a34360B884530cf86Fb53D916908'),
  VITE_CONTRACT_LOAN_MANAGER: z.string().default('0x4755014b4b34359c27B8A289046524E0987833F9'),
  VITE_CONTRACT_STAKING_VAULT: z.string().default('0x3973A4471D1CB66274E33dD7f9802b19D7bF6CDc'),
  VITE_CONTRACT_ORACLE_ROUTER: z.string().default('0x6B6a0Ad18f8E13299673d960f7dCeAaBfd64d82c'),
  VITE_CONTRACT_DEBT_TOKEN: z.string().default('0x4fec42A17F54870d104bEf233688dc9904Bbd58d'),
  VITE_CONTRACT_COLLATERAL_TOKEN: z.string().default('0x8DDf46929c807213c2a313e69908C3c2904c30e7'),
  VITE_WALLETCONNECT_PROJECT_ID: z.string().default('demo-project-id'),
  VITE_USE_MOCKS: z.coerce.boolean().default(true), // Cambiar a true para desarrollo
  VITE_USE_ONCHAIN_ORACLE: z.coerce.boolean().default(false), // Cambiar a false para desarrollo
  VITE_DOCS_URL: z.string().url().default('https://docs.example.com'),
  VITE_API_URL: z.string().url().default('http://localhost:8080'), // Puerto correcto del API
  VITE_STATUS_URL: z.string().url().default('https://status.example.com'),
  VITE_TWITTER_URL: z.string().url().default('https://x.com/example'),
  VITE_DISCORD_URL: z.string().url().default('https://discord.gg/example'),
  VITE_GITHUB_URL: z.string().url().default('https://github.com/example/repo'),
  VITE_TELEMETRY_ENABLED: z.coerce.boolean().default(false),
  VITE_POSTHOG_KEY: z.string().default(''),
  VITE_POSTHOG_HOST: z.string().default('https://app.posthog.com'),
  VITE_MIXPANEL_TOKEN: z.string().default(''),
  
  // Analytics Configuration
  VITE_ANALYTICS_ENABLED: z.coerce.boolean().default(false), // Deshabilitar en desarrollo
  VITE_SENTRY_DSN: z.string().default(''),
  VITE_NODE_ENV: z.string().default('development'),
  VITE_GOOGLE_ANALYTICS_ID: z.string().default(''),
  VITE_GOOGLE_TAG_MANAGER_ID: z.string().default(''),
  VITE_HOTJAR_ID: z.string().default(''),
  VITE_AMPLITUDE_API_KEY: z.string().default(''),
  VITE_SEGMENT_WRITE_KEY: z.string().default(''),
  
  // Development Configuration
  VITE_DISABLE_BLOCKCHAIN_EVENTS: z.coerce.boolean().default(true), // Deshabilitar eventos blockchain en desarrollo
  VITE_DISABLE_OPTIMISTIC_UPDATES: z.coerce.boolean().default(false), // Deshabilitar updates optimísticos si es necesario
  VITE_DISABLE_WEBSOCKET: z.coerce.boolean().default(false), // Deshabilitar WebSocket si es necesario
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
  
  // Analytics Configuration
  ANALYTICS_ENABLED: parsed.VITE_ANALYTICS_ENABLED,
  SENTRY_DSN: parsed.VITE_SENTRY_DSN,
  NODE_ENV: parsed.VITE_NODE_ENV,
  GOOGLE_ANALYTICS_ID: parsed.VITE_GOOGLE_ANALYTICS_ID,
  GOOGLE_TAG_MANAGER_ID: parsed.VITE_GOOGLE_TAG_MANAGER_ID,
  HOTJAR_ID: parsed.VITE_HOTJAR_ID,
  AMPLITUDE_API_KEY: parsed.VITE_AMPLITUDE_API_KEY,
  SEGMENT_WRITE_KEY: parsed.VITE_SEGMENT_WRITE_KEY,
  
  // Development Configuration
  DISABLE_BLOCKCHAIN_EVENTS: parsed.VITE_DISABLE_BLOCKCHAIN_EVENTS,
  DISABLE_OPTIMISTIC_UPDATES: parsed.VITE_DISABLE_OPTIMISTIC_UPDATES,
  DISABLE_WEBSOCKET: parsed.VITE_DISABLE_WEBSOCKET,
}


