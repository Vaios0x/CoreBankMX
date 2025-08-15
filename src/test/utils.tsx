import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { coreTestnet } from '../lib/chains'
import { AppProviders } from '../app/providers'

// Configuración de Wagmi para testing
const config = createConfig({
  chains: [coreTestnet],
  transports: {
    [coreTestnet.id]: http(),
  },
})

// QueryClient para testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Wrapper personalizado para testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Render personalizado con providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock de wallet
export const mockWallet = {
  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  chainId: 1114,
  isConnected: true,
}

// Mock de transacción
export const mockTransaction = {
  hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: '1000000000000000000',
  gasLimit: '21000',
  gasPrice: '20000000000',
}

// Mock de contrato
export const mockContract = {
  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  abi: [],
  read: vi.fn(),
  write: vi.fn(),
  estimateGas: vi.fn(),
}

// Mock de oracle price
export const mockOraclePrice = {
  symbol: 'BTC/USD',
  price: 50000,
  timestamp: Date.now(),
  source: 'pyth',
}

// Helper para esperar
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper para mock de fetch
export const mockFetchResponse = (data: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
  })
}

// Helper para mock de localStorage
export const mockLocalStorage = (data: Record<string, string>) => {
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
}

// Helper para limpiar mocks
export const clearMocks = () => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
}

export * from '@testing-library/react'
export { customRender as render }
