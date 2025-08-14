const fs = require('fs');
const path = require('path');

const envContent = `# Core Blockchain Configuration
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
`;

const envPath = path.join(__dirname, '.env');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  El archivo .env ya existe. No se sobrescribirá.');
    console.log('📝 Si quieres recrearlo, elimínalo manualmente y ejecuta este script nuevamente.');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado exitosamente!');
    console.log('📝 Recuerda actualizar VITE_WALLETCONNECT_PROJECT_ID con tu Project ID real');
    console.log('🔗 Obtén tu Project ID en: https://cloud.walletconnect.com/');
  }
} catch (error) {
  console.error('❌ Error al crear el archivo .env:', error.message);
}
