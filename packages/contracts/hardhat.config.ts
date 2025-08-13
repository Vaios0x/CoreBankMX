import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    coreMainnet: {
      url: process.env.CORE_RPC_MAINNET || 'https://rpc.coredao.org',
      chainId: Number(process.env.CORE_CHAIN_ID_MAINNET || 1116),
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    coreTestnet2: {
      url: process.env.CORE_RPC_TESTNET || 'https://rpc.test2.btcs.network',
      chainId: Number(process.env.CORE_CHAIN_ID_TESTNET || 1114),
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Core Scan API config placeholder if available
    apiKey: {
      coreMainnet: 'placeholder',
      coreTestnet2: 'placeholder',
    } as any,
  },
}

export default config


