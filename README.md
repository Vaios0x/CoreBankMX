# Core Neobank MX  Remesas y Préstamos con BTC como Colateral

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) 
[![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61DAFB)](https://react.dev/) 
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) 
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostCSS](https://img.shields.io/badge/PostCSS-DD3A0A?logo=postcss&logoColor=white)](https://postcss.org/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Wagmi](https://img.shields.io/badge/wagmi-000000?logo=ethereum&logoColor=white)](https://wagmi.sh/)
[![viem](https://img.shields.io/badge/viem-363636?logo=vercel&logoColor=white)](https://viem.sh/)
[![Web3Modal](https://img.shields.io/badge/Web3Modal-ec5990?logo=walletconnect&logoColor=white)](https://web3modal.com/)
[![Hardhat](https://img.shields.io/badge/Hardhat-F4D03F?logo=ethereum&logoColor=000)](https://hardhat.org/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4E5EE4?logo=openzeppelin&logoColor=white)](https://www.openzeppelin.com/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Core DAO](https://img.shields.io/badge/Core%20DAO%20EVM-1116%20%2F%201114-ff7a00)](https://coredao.org/)

> Build What Matters, Build on Core  Proyecto listo para el Core Connect Global Buildathon 2025.

## Pitch (estilo itch.io)
- **Qué es**: Un neobanco no-custodial sobre Core que permite usar BTC puenteado como garantía para obtener préstamos en stablecoins, enviar remesas a MX y generar rendimiento con dual staking.
- **Por qué importa**: Remesas a México alcanzan máximos históricos; muchos usuarios tienen BTC o ingresos cripto pero carecen de crédito formal. Ofrecemos crédito y pagos con transparencia on-chain y costos competitivos.
- **Para quién**: Receptores de remesas, gig-workers, PYMEs con BTC en tesorería y usuarios cripto-first en México.
- **Ventaja en Core**: Integración nativa con Core (chainId 1116/1114), gas rebates, staking CORE/stCORE, y enfoque BTCfi.
- **Demo rápida (30s)**: Deposita BTC-wrapped  pide préstamo en USDT  envía remesa (stub on/off-ramp)  gana rendimiento con dual staking  monitorea salud y liquida posiciones de riesgo automáticamente.

## Funcionalidades clave
- Préstamos con colateral BTC (wrapper/lstBTC) y préstamos en USDT/wrapped.
- LTV dinámico por mercado (p. ej. 60% target / 75% liquidación) y penalidades configurables.
- Oráculos con tolerancias: RedStone (primario) / Pyth (fallback) + circuit breakers por staleness/deviation.
- Liquidaciones on-chain con incentivo para el liquidador (keeper off-chain incluido).
- Dual Staking Compounding (ERC4626) para depositantes con función compound() incentivable.
- Panel admin-readonly (parámetros, tasas), accesibilidad A11y, i18n EN/ES.
- Integración on/off-ramp MXN (Bitso) como stub documentado fuera del contrato (no-custodial).

## Arquitectura
- pps/web: React + Vite + TypeScript + Tailwind + Wagmi/viem + Web3Modal + Framer Motion.
- packages/contracts: Solidity + Hardhat + OpenZeppelin + TypeChain + tests (Mocha/Chai).
- services/keeper: Node TS que monitorea HF y ejecuta liquidaciones/compounding.
- services/api: Fastify TS con caché de oráculos, stubs KYC/KYB y on/off-ramp, métricas.

`mermaid
flowchart LR
  A[Web dApp] -->|wagmi/viem| B(Core RPC 1114/1116)
  A --> C(API Fastify: prices, status, stubs)
  C --> D[Oracles: RedStone/Pyth]
  B --> E[Smart Contracts (Vault/Loan/Oracle/Staking)]
  F[Keeper] -->|liquidate/compound| E
`

## Redes Core
- Mainnet: chainId 1116  RPC https://rpc.coredao.org  Explorer https://scan.coredao.org/
- Testnet2: chainId 1114  RPC https://rpc.test2.btcs.network  Explorer https://scan.test2.btcs.network/

## Variables de entorno (root y servicios)
Crea `.env` raíz desde `.env.example` (no se versiona):
```
CORE_RPC_MAINNET=https://rpc.coredao.org
CORE_RPC_TESTNET=https://rpc.test2.btcs.network
CORE_CHAIN_ID_MAINNET=1116
CORE_CHAIN_ID_TESTNET=1114
EXPLORER_MAINNET=https://scan.coredao.org
EXPLORER_TESTNET=https://scan.test2.btcs.network
DEPLOYER_PRIVATE_KEY=
SAFE_ADMIN_ADDRESS=
KEEPER_PRIVATE_KEY=
API_KEY_ADMIN=
ORACLE_PRIMARY=redstone # redstone|pyth
REDSTONE_URL=https://oracle-gateway-1.a.redstone.finance
PYTH_URL=https://hermes.pyth.network
LSTBTC_ADDRESS=0x...
USDT_ADDRESS=0x...
```

Archivos `.env.example` adicionales:
- `packages/contracts/.env.example`
```
CORE_RPC_MAINNET=https://rpc.coredao.org
CORE_RPC_TESTNET=https://rpc.test2.btcs.network
CORE_CHAIN_ID_MAINNET=1116
CORE_CHAIN_ID_TESTNET=1114
DEPLOYER_PRIVATE_KEY=
SAFE_ADMIN_ADDRESS=
LSTBTC_ADDRESS=
USDT_ADDRESS=
```
- `services/api/.env.example`
```
CORE_RPC_TESTNET=https://rpc.test2.btcs.network
CORE_CHAIN_ID_TESTNET=1114
API_PORT=8080
API_KEY_ADMIN=
KEEPER_PRIVATE_KEY=
```
- `services/keeper/.env.example`
```
CORE_RPC_TESTNET=https://rpc.test2.btcs.network
CORE_CHAIN_ID_TESTNET=1114
API_PORT=8081
```

### `.env.example` para la dApp (root)
```
VITE_CORE_CHAIN_ID_MAINNET=1116
VITE_CORE_CHAIN_ID_TESTNET=1114
VITE_CORE_RPC_MAINNET=https://rpc.coredao.org
VITE_CORE_RPC_TESTNET=https://rpc.test2.btcs.network
VITE_EXPLORER_MAINNET=https://scan.coredao.org
VITE_EXPLORER_TESTNET=https://scan.test2.btcs.network
VITE_CONTRACT_COLLATERAL_VAULT=0x...
VITE_CONTRACT_LOAN_MANAGER=0x...
VITE_CONTRACT_STAKING_VAULT=0x...
VITE_CONTRACT_ORACLE_ROUTER=0x...
VITE_CONTRACT_DEBT_TOKEN=0x...
VITE_CONTRACT_COLLATERAL_TOKEN=0x...
VITE_WALLETCONNECT_PROJECT_ID=demo-project-id
VITE_USE_MOCKS=false
VITE_USE_ONCHAIN_ORACLE=true
VITE_API_URL=http://localhost:8080
VITE_STATUS_URL=http://localhost:8080/status
VITE_TWITTER_URL=https://x.com/example
VITE_DISCORD_URL=https://discord.gg/example
VITE_GITHUB_URL=https://github.com/example/repo
VITE_TELEMETRY_ENABLED=false
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_MIXPANEL_TOKEN=
```

## Scripts rápidos
- Contratos
  - pnpm --filter packages/contracts test  pruebas
  - pnpm --filter packages/contracts deploy:testnet2  despliegue 1114
  - pnpm --filter packages/contracts seed:full:testnet2  despliegue+seed demo 1114
  - pnpm --filter packages/contracts verify:testnet2  verificación en Core Scan
- Keeper
  - pnpm --filter services/keeper start  cron monitor/compound
- API
  - pnpm --filter services/api dev  servidor local (status, market, prices)
  - pnpm --filter services/api build  compila (tsc)
  - pnpm --filter services/api oracle:cron  empuja precios sintéticos a adapters (usar ALLOW_ORACLE_PUSH_CRON=1 y LSTBTC_ADDRESS)
- Web
  - pnpm dev en apps/web  dApp local

## Calidad, seguridad y accesibilidad
- CEI pattern, ReentrancyGuard, AccessControl (roles: ADMIN/KEEPER/PAUSER), pausas granulares.
- Oráculos con ventanas de validez y desviación máxima; modo pausa de mercado.
- UI con navegación por teclado, ria-*, focus visible, motion-safe para animaciones.
- CI con pruebas de contratos y typecheck (GitHub Actions).

## Contratos principales
- CollateralVault.sol: depósitos/retiros colateral y consulta de posiciones.
- LoanManager.sol: orrow/repay, ccrueInterest, healthFactor, parámetros LTV/tasas/penalties.
- LiquidationModule.sol: liquidaciones e incentivos.
- OracleRouter.sol + adapters RedStone/Pyth: getPrice() con circuit breakers.
- DualStakingVault.sol (ERC4626): deposit/withdraw, compound().

## Cumplimiento y alcance
- Diseño no-custodial on-chain; rieles fiat sólo vía integraciones off-chain (stubs documentados).
- KYC/KYB y travel rule se ejecutan en la capa de aplicación cuando aplique (fuera de contratos).
- Este repositorio es material de demostración para el Core Connect Global Buildathon (entregables en inglés).

## Roadmap (breve)
- v0: Demo pública en Testnet2, contratos verificados, video y slides.
- v1: Lanzamiento Mainnet ( 2 semanas tras juicio), auditoría, gas rebates.
- v1.1: Más mercados de colateral, dashboard de riesgo avanzado, integración on/off-ramp real.

## Recursos Core y hackathon
- Buildathon: https://coredao.org/initiatives/core-connect-buildathon
- Docs Core: https://docs.coredao.org/  API: https://docs.coredao.org/docs/api
- Explorers: Mainnet https://scan.coredao.org/  Testnet2 https://scan.test2.btcs.network/
- Faucet Testnet2: https://scan.test2.btcs.network/faucet
- Staking: Mainnet https://stake.coredao.org/  Testnet2 https://stake.test2.btcs.network/

## Licencia
MIT
