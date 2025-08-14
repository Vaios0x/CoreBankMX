# Environment Setup Guide

## Para resolver los errores de conexión, sigue estos pasos:

### 1. Crear archivo `.env` en el directorio raíz

Crea un archivo llamado `.env` en `C:\Daaps\Core\` con el siguiente contenido:

```env
# Core Blockchain Configuration
VITE_CORE_CHAIN_ID_MAINNET=1116
VITE_CORE_CHAIN_ID_TESTNET=1114
VITE_CORE_RPC_MAINNET=https://rpc.coredao.org
VITE_CORE_RPC_TESTNET=https://rpc.test2.btcs.network
VITE_EXPLORER_MAINNET=https://scan.coredao.org
VITE_EXPLORER_TESTNET=https://scan.test2.btcs.network

# Contract Addresses (Testnet2) - Update with actual deployed addresses
VITE_CONTRACT_COLLATERAL_VAULT=0x0000000000000000000000000000000000000000
VITE_CONTRACT_LOAN_MANAGER=0x0000000000000000000000000000000000000000
VITE_CONTRACT_STAKING_VAULT=0x0000000000000000000000000000000000000000
VITE_CONTRACT_ORACLE_ROUTER=0x0000000000000000000000000000000000000000
VITE_CONTRACT_DEBT_TOKEN=0x0000000000000000000000000000000000000000
VITE_CONTRACT_COLLATERAL_TOKEN=0x0000000000000000000000000000000000000000

# WalletConnect Configuration - Get from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Development Settings
VITE_USE_MOCKS=true
VITE_USE_ONCHAIN_ORACLE=false

# Local API URLs (when running docker-compose up)
VITE_API_URL=http://localhost:8080
VITE_STATUS_URL=http://localhost:8080/status

# Social Links
VITE_TWITTER_URL=https://x.com/coredao_org
VITE_DISCORD_URL=https://discord.gg/coredao
VITE_GITHUB_URL=https://github.com/Vaios0x/CoreBankMX

# Documentation
VITE_DOCS_URL=https://docs.coredao.org

# Analytics (disabled for development)
VITE_TELEMETRY_ENABLED=false
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_MIXPANEL_TOKEN=
```

### 2. Obtener WalletConnect Project ID

1. Ve a https://cloud.walletconnect.com/
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Copia el Project ID
5. Reemplaza `your_walletconnect_project_id` en el archivo `.env`

### 3. Iniciar servicios locales (opcional)

Si quieres usar la API real en lugar de mocks:

```bash
# Asegúrate de que Docker Desktop esté corriendo
docker-compose up -d
```

### 4. Reiniciar la aplicación

Después de crear el archivo `.env`, reinicia el servidor de desarrollo:

```bash
pnpm dev
```

## Errores que se resolverán:

- ✅ `api.example.com/market/prices/BTC: Failed to load resource` → Usará `http://localhost:8080` o mocks
- ✅ `api.web3modal.org/getWallets?projectId=your_walletconnect_project_id` → Usará tu Project ID real
- ✅ `pulse.walletconnect.org/e?projectId=your_walletconnect_project_id` → Usará tu Project ID real
- ✅ `cca-lite.coinbase.com/metrics` → Deshabilitado con `VITE_TELEMETRY_ENABLED=false`

## Configuración de producción:

Para producción, necesitarás:
1. Desplegar la API en un servidor público
2. Actualizar `VITE_API_URL` con la URL pública
3. Configurar `VITE_USE_MOCKS=false`
4. Obtener direcciones reales de contratos desplegados
