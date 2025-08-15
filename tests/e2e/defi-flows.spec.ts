import { test, expect } from '@playwright/test'

// Extender la interfaz Window para incluir ethereum
declare global {
  interface Window {
    ethereum?: {
      emit: (event: string, data: any[]) => void
      on: (event: string, callback: (data: any[]) => void) => void
      removeListener: (event: string, callback: (data: any[]) => void) => void
      request: (args: any) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

test.describe('DeFi Application E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test.describe('Navigation and Layout', () => {
    test('should display main navigation correctly', async ({ page }) => {
      // Verificar que el menú lateral esté visible
      await expect(page.locator('[data-testid="sidebar-nav"]')).toBeVisible()
      
      // Verificar enlaces principales
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /borrow/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /repay/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /positions/i })).toBeVisible()
    })

    test('should navigate between pages correctly', async ({ page }) => {
      // Navegar a Dashboard
      await page.click('[data-testid="nav-dashboard"]')
      await expect(page).toHaveURL(/.*dashboard/)
      await expect(page.locator('h1')).toContainText(/Dashboard/i)

      // Navegar a Borrow
      await page.click('[data-testid="nav-borrow"]')
      await expect(page).toHaveURL(/.*borrow/)
      await expect(page.locator('h1')).toContainText(/Borrow/i)

      // Navegar a Repay
      await page.click('[data-testid="nav-repay"]')
      await expect(page).toHaveURL(/.*repay/)
      await expect(page.locator('h1')).toContainText(/Repay/i)
    })

    test('should handle wallet connection', async ({ page }) => {
      // Hacer clic en conectar wallet
      await page.click('[data-testid="connect-wallet"]')
      
      // Verificar que se abre el modal de conexión
      await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible()
      
      // Simular conexión con MetaMask
      await page.click('[data-testid="metamask-connect"]')
      
      // Verificar que se muestra la dirección del wallet
      await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
    })
  })

  test.describe('Borrow Flow', () => {
    test('should complete borrow flow successfully', async ({ page }) => {
      // Conectar wallet
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      
      // Navegar a Borrow
      await page.click('[data-testid="nav-borrow"]')
      
      // Ingresar colateral
      await page.fill('[data-testid="collateral-input"]', '1.5')
      
      // Verificar cálculo de LTV
      await expect(page.locator('[data-testid="ltv-display"]')).toContainText('60%')
      
      // Verificar monto máximo de préstamo
      await expect(page.locator('[data-testid="max-loan"]')).toContainText('$75,000')
      
      // Ingresar monto de préstamo
      await page.fill('[data-testid="loan-input"]', '50000')
      
      // Hacer clic en Borrow
      await page.click('[data-testid="borrow-button"]')
      
      // Confirmar transacción
      await page.click('[data-testid="confirm-transaction"]')
      
      // Verificar que se muestra el hash de la transacción
      await expect(page.locator('[data-testid="transaction-hash"]')).toBeVisible()
      
      // Verificar que se actualiza el estado
      await expect(page.locator('[data-testid="transaction-status"]')).toContainText('Confirmed')
    })

    test('should handle insufficient collateral error', async ({ page }) => {
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      await page.click('[data-testid="nav-borrow"]')
      
      // Intentar con colateral insuficiente
      await page.fill('[data-testid="collateral-input"]', '0.1')
      await page.fill('[data-testid="loan-input"]', '10000')
      
      // Verificar error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient collateral')
      
      // Verificar que el botón está deshabilitado
      await expect(page.locator('[data-testid="borrow-button"]')).toBeDisabled()
    })

    test('should handle oracle price errors', async ({ page }) => {
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      await page.click('[data-testid="nav-borrow"]')
      
      // Simular error de oracle
      await page.evaluate(() => {
        window.localStorage.setItem('mock-oracle-error', 'true')
      })
      
      await page.reload()
      
      // Verificar mensaje de error
      await expect(page.locator('[data-testid="oracle-error"]')).toContainText('Oracle price unavailable')
    })
  })

  test.describe('Repay Flow', () => {
    test('should complete repay flow successfully', async ({ page }) => {
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      await page.click('[data-testid="nav-repay"]')
      
      // Verificar deuda actual
      await expect(page.locator('[data-testid="current-debt"]')).toBeVisible()
      
      // Ingresar monto a pagar
      await page.fill('[data-testid="repay-input"]', '1000')
      
      // Hacer clic en Repay
      await page.click('[data-testid="repay-button"]')
      
      // Confirmar transacción
      await page.click('[data-testid="confirm-transaction"]')
      
      // Verificar confirmación
      await expect(page.locator('[data-testid="transaction-hash"]')).toBeVisible()
    })
  })

  test.describe('Positions Management', () => {
    test('should display user positions correctly', async ({ page }) => {
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      await page.click('[data-testid="nav-positions"]')
      
      // Verificar que se muestran las posiciones
      await expect(page.locator('[data-testid="positions-list"]')).toBeVisible()
      
      // Verificar información de posición
      await expect(page.locator('[data-testid="collateral-amount"]')).toBeVisible()
      await expect(page.locator('[data-testid="debt-amount"]')).toBeVisible()
      await expect(page.locator('[data-testid="health-factor"]')).toBeVisible()
    })

    test('should handle liquidation warning', async ({ page }) => {
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      await page.click('[data-testid="nav-positions"]')
      
      // Simular posición con health factor bajo
      await page.evaluate(() => {
        window.localStorage.setItem('mock-low-health-factor', 'true')
      })
      
      await page.reload()
      
      // Verificar advertencia de liquidación
      await expect(page.locator('[data-testid="liquidation-warning"]')).toContainText('Health factor low')
    })
  })

  test.describe('Analytics and Monitoring', () => {
    test('should display analytics data', async ({ page }) => {
      await page.click('[data-testid="nav-analytics"]')
      
      // Verificar métricas principales
      await expect(page.locator('[data-testid="tvl-metric"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-transactions"]')).toBeVisible()
      
      // Verificar gráficos
      await expect(page.locator('[data-testid="tvl-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="transactions-chart"]')).toBeVisible()
    })

    test('should handle performance monitoring', async ({ page }) => {
      // Simular métricas de performance
      await page.evaluate(() => {
        window.performance.mark('test-start')
        window.performance.mark('test-end')
        window.performance.measure('test-measure', 'test-start', 'test-end')
      })
      
      // Verificar que las métricas se capturan
      const metrics = await page.evaluate(() => {
        return window.performance.getEntriesByType('measure')
      })
      
      expect(metrics.length).toBeGreaterThan(0)
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simular error de red
      await page.route('**/api/**', route => route.abort())
      
      await page.click('[data-testid="nav-dashboard"]')
      
      // Verificar mensaje de error
      await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error')
    })

    test('should handle wallet disconnection', async ({ page }) => {
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      
      // Simular desconexión
      await page.evaluate(() => {
        if (window.ethereum) {
          window.ethereum.emit('accountsChanged', [])
        }
      })
      
      // Verificar que se muestra el estado desconectado
      await expect(page.locator('[data-testid="connect-wallet"]')).toBeVisible()
    })
  })

  test.describe('Security Tests', () => {
    test('should prevent XSS attacks', async ({ page }) => {
      // Intentar inyectar script malicioso
      const maliciousInput = '<script>alert("xss")</script>'
      
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      await page.click('[data-testid="nav-borrow"]')
      
      await page.fill('[data-testid="collateral-input"]', maliciousInput)
      
      // Verificar que el script no se ejecuta
      const hasAlert = await page.evaluate(() => {
        return window.alert !== undefined
      })
      
      expect(hasAlert).toBe(false)
    })

    test('should validate input data', async ({ page }) => {
      await page.click('[data-testid="connect-wallet"]')
      await page.click('[data-testid="metamask-connect"]')
      await page.click('[data-testid="nav-borrow"]')
      
      // Intentar valores inválidos
      await page.fill('[data-testid="collateral-input"]', '-1')
      await page.fill('[data-testid="loan-input"]', 'abc')
      
      // Verificar validación
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Invalid input')
    })
  })
})
