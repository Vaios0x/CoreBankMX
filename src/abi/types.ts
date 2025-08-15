// Tipos TypeScript para los ABIs de los contratos
export interface CollateralVaultABI {
  // Funciones principales
  deposit: (amount: bigint) => Promise<void>
  withdraw: (amount: bigint) => Promise<void>
  balanceOf: (user: string) => Promise<bigint>
  asset: () => Promise<string>
  
  // Eventos
  DepositCollateral: {
    user: string
    amount: bigint
  }
  WithdrawCollateral: {
    user: string
    amount: bigint
  }
}

export interface LoanManagerABI {
  // Funciones principales
  borrow: (amount: bigint) => Promise<void>
  repay: (amount: bigint) => Promise<void>
  getAccountData: (user: string) => Promise<[bigint, bigint, bigint]>
  targetLtv: () => Promise<bigint>
  liquidationLtv: () => Promise<bigint>
  baseRateBps: () => Promise<bigint>
  
  // Eventos
  Borrow: {
    user: string
    amount: bigint
  }
  Repay: {
    user: string
    amount: bigint
  }
  InterestAccrued: {
    newIndex: bigint
    lastAccrual: bigint
  }
}

export interface StakingVaultABI {
  // Funciones principales
  deposit: (assets: bigint) => Promise<bigint>
  withdraw: (assets: bigint) => Promise<bigint>
  balanceOf: (user: string) => Promise<bigint>
  asset: () => Promise<string>
  totalAssets: () => Promise<bigint>
  
  // Eventos
  Deposit: {
    caller: string
    owner: string
    assets: bigint
    shares: bigint
  }
  Withdraw: {
    caller: string
    receiver: string
    owner: string
    assets: bigint
    shares: bigint
  }
  Compound: {
    rewards: bigint
    newIndex: bigint
  }
}

export interface OracleRouterABI {
  // Funciones principales
  getPrice: (token: string) => Promise<[bigint, bigint]>
  primary: () => Promise<string>
  fallback: () => Promise<string>
  
  // Eventos
  PriceUpdated: {
    token: string
    price: bigint
    timestamp: bigint
  }
}

export interface MockERC20ABI {
  // Funciones estándar ERC20
  name: () => Promise<string>
  symbol: () => Promise<string>
  decimals: () => Promise<number>
  totalSupply: () => Promise<bigint>
  balanceOf: (account: string) => Promise<bigint>
  transfer: (to: string, amount: bigint) => Promise<boolean>
  approve: (spender: string, amount: bigint) => Promise<boolean>
  allowance: (owner: string, spender: string) => Promise<bigint>
  transferFrom: (from: string, to: string, amount: bigint) => Promise<boolean>
  
  // Eventos
  Transfer: {
    from: string
    to: string
    value: bigint
  }
  Approval: {
    owner: string
    spender: string
    value: bigint
  }
}

// Tipos para las funciones de transacción
export type ContractFunction<T = any> = (...args: any[]) => Promise<T>

// Tipos para los eventos
export type ContractEvent<T = any> = {
  [K in keyof T]: T[K]
}

// Exportar todos los tipos
export type {
  CollateralVaultABI,
  LoanManagerABI,
  StakingVaultABI,
  OracleRouterABI,
  MockERC20ABI,
  ContractFunction,
  ContractEvent
}
