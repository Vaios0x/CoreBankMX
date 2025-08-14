## Core Neobank MX — BTC-collateral Loans, Remittances, and Dual Staking on Core

This repository contains a full-stack, non-custodial neobank built on Core (Mainnet 1116 / Testnet2 1114). Users can deposit BTC-wrapped collateral, borrow USDT, send remittances (stub), and earn yield via a Dual Staking ERC4626 vault. The stack includes smart contracts (Vault/Loan/Liquidation/Oracle/Staking), a Fastify API, an autonomous Keeper, and a React dApp with i18n (EN/ES) and accessibility.

### Key Features
- BTC collateralized lending (LSTBTC → borrow USDT), configurable LTV/penalties
- Dual Oracle adapters (RedStone/Pyth) with staleness window and deviation threshold; safe fallback policy
- Liquidation module with off-chain Keeper automation and fees
- Dual Staking Vault (ERC4626) with compound() and gas/APR heuristic in Keeper
- dApp with accessible UI, charts, and admin-readonly parameters

### Core Networks
- Mainnet: chainId 1116, RPC `https://rpc.coredao.org`, Explorer `https://scan.coredao.org/`
- Testnet2: chainId 1114, RPC `https://rpc.test2.btcs.network`, Explorer `https://scan.test2.btcs.network/`

---

## Quickstart (Local)

Prereqs: Node 20+, pnpm 9+, Git. Clone and set env files.

1) Install deps
```bash
pnpm install
```

2) Environment
Create a `.env` at repo root from the examples below. Also create service-level envs (`services/api/.env`, `services/keeper/.env`, `packages/contracts/.env`). Minimum required for local testnet2 demo: `CORE_RPC_TESTNET`, `CORE_CHAIN_ID_TESTNET`, `API_KEY_ADMIN`, and `KEEPER_PRIVATE_KEY` (funded on testnet2).

3) Contracts (Testnet2)
```bash
pnpm --filter @core-neobank/contracts build
pnpm --filter @core-neobank/contracts deploy:testnet2
pnpm --filter @core-neobank/contracts seed:full:testnet2
```
This will update `packages/contracts/addresses.testnet2.json`. Verify addresses on Core Scan when ready.

4) Run services
```bash
pnpm --filter @core-neobank/api dev
pnpm --filter @core-neobank/keeper dev
pnpm dev
```

---

## Docker (API + Keeper)

We provide minimal Dockerfiles for API and Keeper and a docker-compose setup. Ensure your `.env` files exist as described. Then run:
```bash
docker compose up --build
```
This will start API on port 8080 and Keeper on 8081.

---

## Environment Examples

Root `.env` (used by the web app via Vite):
```bash
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
VITE_TELEMETRY_ENABLED=false
```

`packages/contracts/.env`:
```bash
CORE_RPC_MAINNET=https://rpc.coredao.org
CORE_RPC_TESTNET=https://rpc.test2.btcs.network
CORE_CHAIN_ID_MAINNET=1116
CORE_CHAIN_ID_TESTNET=1114
DEPLOYER_PRIVATE_KEY=
SAFE_ADMIN_ADDRESS=
LSTBTC_ADDRESS=
USDT_ADDRESS=
```

`services/api/.env`:
```bash
CORE_RPC_TESTNET=https://rpc.test2.btcs.network
CORE_CHAIN_ID_TESTNET=1114
CORE_RPC_MAINNET=https://rpc.coredao.org
CORE_CHAIN_ID_MAINNET=1116
API_PORT=8080
API_KEY_ADMIN=
KEEPER_PRIVATE_KEY=
ALLOW_ORACLE_PUSH_CRON=0
```

`services/keeper/.env`:
```bash
CORE_RPC_TESTNET=https://rpc.test2.btcs.network
CORE_CHAIN_ID_TESTNET=1114
API_PORT=8081
API_URL=http://api:8080
KEEPER_PRIVATE_KEY=
COMPOUND_EXPECTED_APR_BPS=500
COMPOUND_INTERVAL_SEC=60
GAS_COST_MULTIPLIER=1.2
```

---

## API Endpoints (Brief)
- `GET /status` — health, chain info, deployed contracts
- `GET /market/params` — loan params (cached)
- `GET /market/fee?amount=123&user=0x..` — fee estimation
- `GET /market/prices/:symbol` — on-chain price or cached
- `GET /market/history/:symbol` — sparkline history (demo)
- `GET /market/history/tvl` — TVL sparkline (demo)
- `GET /market/metrics` — active positions & TVL (demo-derived)
- `GET /market/liquidations` — recent liquidations (on-chain logs)
- `POST /interest/accrue` — accrue interest (admin key)
- `POST /oracle/push` — push price to adapter (admin key)
- `POST /oracle/push-simple` — cron-friendly push to adapters (guarded by env)
- `GET /positions/:address` — user collateral/debt/hf
- `GET /positions?addresses=0x..,0x..` — batch
- `GET /positions/users` — demo monitor list (env-driven)

Admin-protected endpoints require header `x-api-key: <API_KEY_ADMIN>`.

---

## Deploy & Verification (Testnet2)
1) Deploy contracts and seed demo data:
```bash
pnpm --filter @core-neobank/contracts deploy:testnet2
pnpm --filter @core-neobank/contracts seed:full:testnet2
```
2) Verify contracts on Core Scan (manual or script):
```bash
pnpm --filter @core-neobank/contracts verify:testnet2
```
3) Update your `.env` and `addresses.testnet2.json` in API/Keeper/web.

---

## Architecture Overview
- Web dApp: React + Vite + Wagmi + RainbowKit; i18n and accessibility-first.
- API: Fastify; on-chain reads, oracle cache, stubs (KYC/on/off-ramp), metrics.
- Keeper: autonomous cron for liquidation and compound with basic economic heuristics.
- Contracts: Vault/Loan/Liquidation/Oracle/Staking, roles and circuit breakers.

---

## Submission Materials (Hackathon)
- This README (English) with setup and run instructions.
- Short demo video (≤4 min): intro, innovation, Core integration, E2E flow.
- Slide deck: problem, solution, “Why Core”, architecture, roadmap.
- Public testnet2 deployment links (dApp, API health, Core Scan verifications).

Disclosure: This repository is a demo for the Core Connect Global Buildathon. No custodial rails; fiat integrations are stubs for demonstration purposes.


