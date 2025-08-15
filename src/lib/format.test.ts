import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatAddress, formatHash } from './format'

describe('format', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
      expect(formatCurrency(0, 'USD')).toBe('$0.00')
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00')
    })

    it('should format BTC correctly', () => {
      expect(formatCurrency(0.12345678, 'BTC')).toBe('₿0.12345678')
      expect(formatCurrency(1.5, 'BTC')).toBe('₿1.50000000')
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-1234.56, 'USD')).toBe('-$1,234.56')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567890.12, 'USD')).toBe('$1,234,567,890.12')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with default precision', () => {
      expect(formatNumber(1234.5678)).toBe('1,234.57')
      expect(formatNumber(0)).toBe('0.00')
    })

    it('should format numbers with custom precision', () => {
      expect(formatNumber(1234.5678, 4)).toBe('1,234.5678')
      expect(formatNumber(1234.5678, 0)).toBe('1,235')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234.56)).toBe('-1,234.56')
    })
  })

  describe('formatAddress', () => {
    it('should format Ethereum addresses', () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      expect(formatAddress(address)).toBe('0x742d...8b6')
    })

    it('should handle short addresses', () => {
      const shortAddress = '0x1234567890abcdef'
      expect(formatAddress(shortAddress)).toBe('0x1234...cdef')
    })

    it('should handle invalid addresses', () => {
      expect(formatAddress('invalid')).toBe('invalid')
      expect(formatAddress('')).toBe('')
    })
  })

  describe('formatHash', () => {
    it('should format transaction hashes', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      expect(formatHash(hash)).toBe('0x1234...cdef')
    })

    it('should handle short hashes', () => {
      const shortHash = '0x1234567890abcdef'
      expect(formatHash(shortHash)).toBe('0x1234...cdef')
    })

    it('should handle invalid hashes', () => {
      expect(formatHash('invalid')).toBe('invalid')
      expect(formatHash('')).toBe('')
    })
  })
})
