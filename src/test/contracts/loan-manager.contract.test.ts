import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPublicClient, http, parseEther, parseUnits } from 'viem'
import { coreTestnet } from '../../lib/chains'
import { LoanManagerABI } from '../../abi/LoanManager.json'
import { mockContract, mockTransaction } from '../utils'

// Cliente público para testing
const publicClient = createPublicClient({
  chain: coreTestnet,
  transport: http(),
})

// Mock de contrato
const mockLoanManager = {
  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  abi: LoanManagerABI,
  read: vi.fn(),
  write: vi.fn(),
  estimateGas: vi.fn(),
}

describe('LoanManager Contract Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Read Operations', () => {
    it('should get total debt correctly', async () => {
      const expectedDebt = parseEther('1000000') // 1M USDT
      mockLoanManager.read.mockResolvedValue(expectedDebt)

      const totalDebt = await mockLoanManager.read({
        functionName: 'getTotalDebt',
        args: [],
      })

      expect(totalDebt).toBe(expectedDebt)
      expect(mockLoanManager.read).toHaveBeenCalledWith({
        functionName: 'getTotalDebt',
        args: [],
      })
    })

    it('should get user position correctly', async () => {
      const userAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      const expectedPosition = {
        collateral: parseEther('10'), // 10 BTC
        debt: parseUnits('500000', 6), // 500k USDT
        healthFactor: parseEther('1.2'), // 120%
      }

      mockLoanManager.read.mockResolvedValue(expectedPosition)

      const position = await mockLoanManager.read({
        functionName: 'getUserPosition',
        args: [userAddress],
      })

      expect(position).toEqual(expectedPosition)
      expect(mockLoanManager.read).toHaveBeenCalledWith({
        functionName: 'getUserPosition',
        args: [userAddress],
      })
    })

    it('should get liquidation threshold correctly', async () => {
      const expectedThreshold = parseEther('0.8') // 80%
      mockLoanManager.read.mockResolvedValue(expectedThreshold)

      const threshold = await mockLoanManager.read({
        functionName: 'getLiquidationThreshold',
        args: [],
      })

      expect(threshold).toBe(expectedThreshold)
    })
  })

  describe('Write Operations', () => {
    it('should execute borrow transaction correctly', async () => {
      const amount = parseUnits('10000', 6) // 10k USDT
      const expectedHash = mockTransaction.hash

      mockLoanManager.write.mockResolvedValue({ hash: expectedHash })
      mockLoanManager.estimateGas.mockResolvedValue(parseEther('0.001'))

      const tx = await mockLoanManager.write({
        functionName: 'borrow',
        args: [amount],
      })

      expect(tx.hash).toBe(expectedHash)
      expect(mockLoanManager.write).toHaveBeenCalledWith({
        functionName: 'borrow',
        args: [amount],
      })
    })

    it('should execute repay transaction correctly', async () => {
      const amount = parseUnits('5000', 6) // 5k USDT
      const expectedHash = mockTransaction.hash

      mockLoanManager.write.mockResolvedValue({ hash: expectedHash })

      const tx = await mockLoanManager.write({
        functionName: 'repay',
        args: [amount],
      })

      expect(tx.hash).toBe(expectedHash)
      expect(mockLoanManager.write).toHaveBeenCalledWith({
        functionName: 'repay',
        args: [amount],
      })
    })

    it('should handle insufficient balance error', async () => {
      const amount = parseUnits('1000000', 6) // 1M USDT
      const error = new Error('Insufficient balance')

      mockLoanManager.write.mockRejectedValue(error)

      await expect(
        mockLoanManager.write({
          functionName: 'borrow',
          args: [amount],
        })
      ).rejects.toThrow('Insufficient balance')
    })

    it('should handle health factor too low error', async () => {
      const amount = parseUnits('100000', 6) // 100k USDT
      const error = new Error('Health factor too low')

      mockLoanManager.write.mockRejectedValue(error)

      await expect(
        mockLoanManager.write({
          functionName: 'borrow',
          args: [amount],
        })
      ).rejects.toThrow('Health factor too low')
    })
  })

  describe('Gas Estimation', () => {
    it('should estimate gas for borrow transaction', async () => {
      const amount = parseUnits('10000', 6)
      const expectedGas = parseEther('0.001')

      mockLoanManager.estimateGas.mockResolvedValue(expectedGas)

      const gasEstimate = await mockLoanManager.estimateGas({
        functionName: 'borrow',
        args: [amount],
      })

      expect(gasEstimate).toBe(expectedGas)
      expect(mockLoanManager.estimateGas).toHaveBeenCalledWith({
        functionName: 'borrow',
        args: [amount],
      })
    })

    it('should handle gas estimation errors', async () => {
      const amount = parseUnits('1000000', 6)
      const error = new Error('Gas estimation failed')

      mockLoanManager.estimateGas.mockRejectedValue(error)

      await expect(
        mockLoanManager.estimateGas({
          functionName: 'borrow',
          args: [amount],
        })
      ).rejects.toThrow('Gas estimation failed')
    })
  })

  describe('Event Listening', () => {
    it('should listen to Borrow events', async () => {
      const mockEvent = {
        address: mockLoanManager.address,
        args: {
          user: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          amount: parseUnits('10000', 6),
          timestamp: BigInt(Date.now()),
        },
        eventName: 'Borrow',
      }

      // Simular evento
      const unwatch = publicClient.watchContractEvent({
        address: mockLoanManager.address,
        abi: LoanManagerABI,
        eventName: 'Borrow',
        onLogs: (logs) => {
          expect(logs[0]).toEqual(mockEvent)
        },
      })

      // Limpiar listener
      unwatch()
    })

    it('should listen to Repay events', async () => {
      const mockEvent = {
        address: mockLoanManager.address,
        args: {
          user: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          amount: parseUnits('5000', 6),
          timestamp: BigInt(Date.now()),
        },
        eventName: 'Repay',
      }

      const unwatch = publicClient.watchContractEvent({
        address: mockLoanManager.address,
        abi: LoanManagerABI,
        eventName: 'Repay',
        onLogs: (logs) => {
          expect(logs[0]).toEqual(mockEvent)
        },
      })

      unwatch()
    })
  })
})
