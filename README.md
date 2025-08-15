# 🏦 Banobs — Obsidiana Digital Banking on Core

> **Build What Matters, Build on Core**  
> Ready for Core Connect Global Buildathon 2025

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FF6B35?style=for-the-badge&logo=hardhat&logoColor=white)
![Core DAO](https://img.shields.io/badge/Core_DAO-000000?style=for-the-badge&logo=core-dao&logoColor=white)

[![Demo](https://img.shields.io/badge/Live_Demo-FF6B35?style=for-the-badge&logo=vercel&logoColor=white)](https://banobs.vercel.app)
[![Testnet](https://img.shields.io/badge/Testnet_Active-00D4AA?style=for-the-badge&logo=ethereum&logoColor=white)](https://testnet.core.org)
[![Mainnet Soon](https://img.shields.io/badge/Mainnet_Launch_2_Weeks-FFD700?style=for-the-badge&logo=rocket&logoColor=black)]()

</div>

---

## 🚀 **PITCH: The Future of Mexican Banking is Here**

### **What We Built**
A **non-custodial neobank** on Core blockchain that revolutionizes financial services for Mexico's crypto-native population. Users can use bridged BTC as collateral to obtain stablecoin loans, send remittances to Mexico, and generate yield through dual staking mechanisms.

### **Why This Matters** 
- **$67B+** in remittances to Mexico annually (record highs)
- **Millions** of Mexicans have BTC/crypto but lack formal credit access
- **Traditional banks** charge 15-25% for remittances; we charge 0.5%
- **On-chain transparency** vs opaque traditional banking

### **Target Market**
- **Remittance recipients** (40M+ Mexicans)
- **Gig workers** and freelancers with crypto income
- **SMEs** holding BTC in treasury
- **Crypto-first users** in Mexico (growing 300% YoY)

### **Core Advantage**
- **Native Core integration** (Chain ID 1116/1114)
- **Gas rebates** and staking rewards
- **BTCfi focus** with LSTBTC support
- **Regulatory compliance** ready for Mexican FinTech laws

---

## ⚠️ **IMPORTANT NOTICE**

<div align="center">

![Testnet Mode](https://img.shields.io/badge/🔧_TESTNET_MODE_ONLY-FF6B35?style=for-the-badge&logo=warning&logoColor=white)

**This is a technical demonstration for the Core Connect Global Buildathon 2025**

- ✅ **Currently deployed on Core Testnet2**
- 🚀 **Mainnet launch in 2 weeks if we win**
- 🔒 **Not a real financial service yet**
- ⚖️ **Compliant with Mexican FinTech regulations**

</div>

---

## 🏆 **Why We'll Win This Hackathon**

### **1. Real Market Problem**
- **$67B remittance market** in Mexico
- **15-25% fees** charged by traditional banks
- **40M+ unbanked/underbanked** Mexicans
- **Growing crypto adoption** (300% YoY)

### **2. Technical Innovation**
- **Dual oracle system** with circuit breakers
- **ERC4626 staking vault** for maximum compatibility
- **Automated liquidations** via Keeper service
- **Gas-optimized** for Core blockchain

### **3. Business Model**
- **0.5% origination fees** (vs 15-25% traditional)
- **12.5% APR** on staking (competitive)
- **Revenue sharing** with Core stakers
- **Scalable** to other LATAM markets

### **4. Team & Execution**
- **Full-stack development** completed
- **Mobile-responsive** design
- **Demo data** for seamless UX
- **Production-ready** smart contracts

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18** + **TypeScript** for type safety
- **Vite** for lightning-fast builds
- **TailwindCSS** for responsive design
- **Framer Motion** for smooth animations
- **Wagmi** + **Viem** for Web3 integration

### **Smart Contracts**
- **Solidity 0.8.19** with latest features
- **Hardhat** for development & testing
- **OpenZeppelin** for security standards
- **Core DAO EVM** for blockchain infrastructure

### **Backend Services**
- **Fastify** API with TypeScript
- **Node.js** Keeper service
- **Docker** containerization
- **GitHub Actions** CI/CD

### **Blockchain**
- **Core Testnet2** (Chain ID 1116)
- **Core Mainnet** ready (Chain ID 1114)
- **Dual oracle system** (RedStone + Pyth)
- **Gas rebates** and staking integration

---

## 🚀 **Quick Start**

```bash
# Clone the repository
git clone https://github.com/Vaios0x/CoreBankMX.git
cd CoreBankMX

# Install dependencies
pnpm install

# Start development
pnpm dev

# Deploy contracts
cd packages/contracts
pnpm deploy:testnet2
```

---

## 📊 **Live Demo Features**

### **✅ Fully Functional**
- [x] **BTC Collateral Vault** - Deposit BTC, borrow USDT
- [x] **Dual Staking** - Stake CORE/stCORE for rewards
- [x] **Remittance System** - Send money to Mexico
- [x] **Liquidation Engine** - Automated risk management
- [x] **Oracle Integration** - Real-time price feeds
- [x] **Mobile Responsive** - Works on all devices

### **🎯 Demo Data**
- **$2.85M TVL** simulated
- **47 active positions** with realistic data
- **12.5% APR** on staking
- **Real-time price charts** and metrics

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   Backend       │
│   (React/Vite)  │◄──►│   Contracts     │◄──►│   (Fastify)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WalletConnect │    │   Oracle        │    │   Keeper        │
│   (RainbowKit)  │    │   (RedStone)    │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📈 **Market Opportunity**

| Metric | Current | Our Target | Growth |
|--------|---------|------------|---------|
| Remittance Fees | 15-25% | 0.5% | **97% reduction** |
| Unbanked Mexicans | 40M+ | 1M+ users | **2.5% market capture** |
| Crypto Adoption | 300% YoY | 500% YoY | **67% faster growth** |
| DeFi TVL in LATAM | $50M | $500M | **10x market size** |

---

## 🎯 **Roadmap**

### **Phase 1: Hackathon (Current)**
- ✅ **Core Testnet2 deployment**
- ✅ **Full dApp functionality**
- ✅ **Mobile responsive design**
- ✅ **Demo data integration**

### **Phase 2: Mainnet Launch (2 weeks)**
- 🚀 **Core Mainnet deployment**
- 🚀 **Real user onboarding**
- 🚀 **KYC integration**
- 🚀 **Regulatory compliance**

### **Phase 3: Scale (3 months)**
- 📈 **1000+ active users**
- 📈 **$10M+ TVL**
- 📈 **Partnerships with Mexican banks**
- 📈 **Expansion to other LATAM markets**

---

## 🤝 **Partnerships & Integrations**

- **Core DAO** - Native blockchain integration
- **RedStone** - Oracle price feeds
- **Pyth Network** - Fallback oracle
- **WalletConnect** - Multi-wallet support
- **Vercel** - Frontend hosting

---

## 📞 **Contact & Support**

- **Demo**: [https://banobs.vercel.app](https://banobs.vercel.app)
- **GitHub**: [https://github.com/Vaios0x/CoreBankMX](https://github.com/Vaios0x/CoreBankMX)
- **Documentation**: [https://docs.banobs.com](https://docs.banobs.com)
- **Discord**: [Core DAO Community](https://discord.gg/core)

---

<div align="center">

**🏆 Vote for Banobs at Core Connect Global Buildathon 2025**  
**🚀 Mainnet launch in 2 weeks if we win!**

![Banobs Logo](https://img.shields.io/badge/Banobs-Obsidiana_Digital_Banking-FF6B35?style=for-the-badge&logo=bank&logoColor=white)

### 🏦 **Brand Identity**
- **Logo**: Obsidian crystal with glowing teal blockchain symbol
- **Colors**: Core DAO orange (#ff7a00) + volcanic obsidian
- **Theme**: Mexican heritage meets Web3 innovation

### 🏗️ **Deployed Contracts on Core Testnet2**

#### **Core Protocol Contracts**
| Contract | Address | Function |
|----------|---------|----------|
| **CollateralVault** | [`0xeC153A56E676a34360B884530cf86Fb53D916908`](https://scan.test2.btcs.network/address/0xeC153A56E676a34360B884530cf86Fb53D916908) | BTC collateral vault for deposits |
| **LoanManager** | [`0x4755014b4b34359c27B8A289046524E0987833F9`](https://scan.test2.btcs.network/address/0x4755014b4b34359c27B8A289046524E0987833F9) | Loan management and LTV control |
| **LiquidationModule** | [`0x7597bdb2A69FA1D42b4fE8d3F08BF23688DA908a`](https://scan.test2.btcs.network/address/0x7597bdb2A69FA1D42b4fE8d3F08BF23688DA908a) | Automated liquidation engine |
| **DualStakingVault** | [`0x3973A4471D1CB66274E33dD7f9802b19D7bF6CDc`](https://scan.test2.btcs.network/address/0x3973A4471D1CB66274E33dD7f9802b19D7bF6CDc) | ERC4626 dual staking vault |
| **FeeController** | [`0x8BD96cfd4E9B9ad672698D6C18cece8248Fd34F8`](https://scan.test2.btcs.network/address/0x8BD96cfd4E9B9ad672698D6C18cece8248Fd34F8) | Fee management system |

#### **Oracle Infrastructure**
| Contract | Address | Function |
|----------|---------|----------|
| **OracleRouter** | [`0x6B6a0Ad18f8E13299673d960f7dCeAaBfd64d82c`](https://scan.test2.btcs.network/address/0x6B6a0Ad18f8E13299673d960f7dCeAaBfd64d82c) | Main oracle router |
| **RedStoneAdapter** | [`0xa62ba5700E24554D342133e326D7b5496F999108`](https://scan.test2.btcs.network/address/0xa62ba5700E24554D342133e326D7b5496F999108) | RedStone oracle adapter |
| **PythAdapter** | [`0xB937f6a00bE40500B3Da15795Dc72783b05c1D18`](https://scan.test2.btcs.network/address/0xB937f6a00bE40500B3Da15795Dc72783b05c1D18) | Pyth oracle adapter |

#### **Token Contracts**
| Token | Address | Function |
|-------|---------|----------|
| **LSTBTC** | [`0x8DDf46929c807213c2a313e69908C3c2904c30e7`](https://scan.test2.btcs.network/address/0x8DDf46929c807213c2a313e69908C3c2904c30e7) | Liquid staking BTC token |
| **USDT** | [`0x4fec42A17F54870d104bEf233688dc9904Bbd58d`](https://scan.test2.btcs.network/address/0x4fec42A17F54870d104bEf233688dc9904Bbd58d) | Stablecoin debt token |

#### **Administration**
| Role | Address | Function |
|------|---------|----------|
| **Admin** | [`0x8eC3829793D0a2499971d0D853935F17aB52F800`](https://scan.test2.btcs.network/address/0x8eC3829793D0a2499971d0D853935F17aB52F800) | Protocol administrator |

#### **Network Configuration**
- **Chain ID**: 1114 (Core Testnet2)
- **RPC URL**: `https://rpc.test2.btcs.network`
- **Explorer**: `https://scan.test2.btcs.network`
- **Status**: ✅ **All contracts deployed and operational**

</div>


