import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useContracts } from './useContracts'
import { mockContract } from '../test/utils'

// Mock de wagmi hooks
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
  useAccount: vi.fn(),
  useChainId: vi.fn(),
}))

describe('useContracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return contract instances', () => {
    const { result } = renderHook(() => useContracts())

    expect(result.current).toHaveProperty('loanManager')
    expect(result.current).toHaveProperty('collateralVault')
    expect(result.current).toHaveProperty('stakingVault')
    expect(result.current).toHaveProperty('oracleRouter')
  })

  it('should handle contract read operations', async () => {
    const mockRead = vi.fn().mockResolvedValue('1000000000000000000')
    const { result } = renderHook(() => useContracts())

    // Simular lectura de contrato
    const balance = await result.current.loanManager.read({
      functionName: 'getTotalDebt',
      args: [],
    })

    expect(balance).toBe('1000000000000000000')
  })

  it('should handle contract write operations', async () => {
    const mockWrite = vi.fn().mockResolvedValue({
      hash: '0x1234567890abcdef',
    })
    const { result } = renderHook(() => useContracts())

    // Simular escritura de contrato
    const tx = await result.current.loanManager.write({
      functionName: 'borrow',
      args: ['1000000000000000000'],
    })

    expect(tx.hash).toBe('0x1234567890abcdef')
  })

  it('should handle contract errors gracefully', async () => {
    const mockError = new Error('Contract call failed')
    const mockRead = vi.fn().mockRejectedValue(mockError)
    const { result } = renderHook(() => useContracts())

    await expect(
      result.current.loanManager.read({
        functionName: 'getTotalDebt',
        args: [],
      })
    ).rejects.toThrow('Contract call failed')
  })
})
