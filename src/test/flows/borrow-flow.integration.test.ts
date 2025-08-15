import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Borrow } from '../../pages/Borrow'
import { mockWallet, mockTransaction, clearMocks } from '../utils'

// Mock de hooks
vi.mock('../../hooks/useContracts', () => ({
  useContracts: () => ({
    loanManager: {
      read: vi.fn().mockResolvedValue('1000000000000000000'),
      write: vi.fn().mockResolvedValue({ hash: mockTransaction.hash }),
    },
    collateralVault: {
      read: vi.fn().mockResolvedValue('5000000000000000000'),
      write: vi.fn().mockResolvedValue({ hash: mockTransaction.hash }),
    },
  }),
}))

vi.mock('../../hooks/useOracle', () => ({
  useOracle: () => ({
    getPrice: vi.fn().mockResolvedValue(50000),
    getPrices: vi.fn().mockResolvedValue({ BTC: 50000, USDT: 1 }),
  }),
}))

vi.mock('wagmi', () => ({
  useAccount: () => mockWallet,
  useChainId: () => 1114,
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
}))

describe('Borrow Flow Integration', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    clearMocks()
  })

  it('should complete full borrow flow', async () => {
    render(<Borrow />)

    // 1. Verificar que la página se carga correctamente
    expect(screen.getByText(/Borrow/i)).toBeInTheDocument()
    expect(screen.getByText(/Collateral/i)).toBeInTheDocument()
    expect(screen.getByText(/Loan Amount/i)).toBeInTheDocument()

    // 2. Ingresar cantidad de colateral
    const collateralInput = screen.getByLabelText(/collateral amount/i)
    await user.type(collateralInput, '1.5')

    // 3. Verificar que el LTV se calcula correctamente
    await waitFor(() => {
      expect(screen.getByText(/LTV: 60%/i)).toBeInTheDocument()
    })

    // 4. Verificar que el monto máximo de préstamo se calcula
    await waitFor(() => {
      expect(screen.getByText(/Max Loan: \$75,000/i)).toBeInTheDocument()
    })

    // 5. Ingresar monto de préstamo
    const loanInput = screen.getByLabelText(/loan amount/i)
    await user.type(loanInput, '50000')

    // 6. Verificar que el botón de préstamo está habilitado
    const borrowButton = screen.getByRole('button', { name: /borrow/i })
    expect(borrowButton).toBeEnabled()

    // 7. Hacer clic en el botón de préstamo
    await user.click(borrowButton)

    // 8. Verificar que se muestra el modal de confirmación
    await waitFor(() => {
      expect(screen.getByText(/Confirm Transaction/i)).toBeInTheDocument()
    })

    // 9. Confirmar la transacción
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // 10. Verificar que se muestra el estado de la transacción
    await waitFor(() => {
      expect(screen.getByText(/Transaction Submitted/i)).toBeInTheDocument()
    })

    // 11. Verificar que se muestra el hash de la transacción
    await waitFor(() => {
      expect(screen.getByText(mockTransaction.hash.slice(0, 10))).toBeInTheDocument()
    })
  })

  it('should handle insufficient collateral', async () => {
    render(<Borrow />)

    // Intentar préstamo con colateral insuficiente
    const collateralInput = screen.getByLabelText(/collateral amount/i)
    await user.type(collateralInput, '0.1')

    const loanInput = screen.getByLabelText(/loan amount/i)
    await user.type(loanInput, '10000')

    // Verificar que se muestra error de colateral insuficiente
    await waitFor(() => {
      expect(screen.getByText(/Insufficient collateral/i)).toBeInTheDocument()
    })

    // Verificar que el botón está deshabilitado
    const borrowButton = screen.getByRole('button', { name: /borrow/i })
    expect(borrowButton).toBeDisabled()
  })

  it('should handle oracle price errors', async () => {
    // Mock de error en oracle
    vi.mocked(useOracle).mockReturnValue({
      getPrice: vi.fn().mockRejectedValue(new Error('Oracle error')),
      getPrices: vi.fn().mockRejectedValue(new Error('Oracle error')),
    })

    render(<Borrow />)

    // Verificar que se muestra error de oracle
    await waitFor(() => {
      expect(screen.getByText(/Oracle error/i)).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    // Mock de error de red
    vi.mocked(useContracts).mockReturnValue({
      loanManager: {
        read: vi.fn().mockRejectedValue(new Error('Network error')),
        write: vi.fn().mockRejectedValue(new Error('Network error')),
      },
      collateralVault: {
        read: vi.fn().mockRejectedValue(new Error('Network error')),
        write: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    })

    render(<Borrow />)

    // Verificar que se muestra error de red
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })
})
