import { usePositionsStore } from '../state/usePositionsStore'
import { useOracle } from '../hooks/useOracle'
import { computeHealthFactor, computeLtv } from '../lib/ltv'
import { useI18n } from '../i18n/i18n'
import { Link, useLocation } from 'react-router-dom'
import { formatUSD } from '../lib/format'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { env } from '../lib/env'
import { Badge } from '../components/ui/Badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkline } from '../components/ui/Sparkline'

export default function Positions() {
  const location = useLocation()
  const { positions } = usePositionsStore()
  const { data: price } = useOracle()
  const t = useI18n()
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(true)

  // Cargar posición real desde API si hay address
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!address) return
      setIsLoading(true)
      setError(null)
      try {
        // Intentar conectar a la API
        const apiUrl = env.API_URL || 'http://localhost:8080'
        const res = await fetch(`${apiUrl}/positions/${address}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Timeout de 5 segundos
          signal: AbortSignal.timeout(5000)
        })
        
        if (!mounted) return
        
        if (res.ok) {
          const json = await res.json()
          if (json && json.debt && json.collateral) {
            // Interpretar colateral como BTC (18d) y deuda como USDT (18d en mocks)
            const collateralBtc = Number(json.collateral) / 1e18
            const debtUsdt = Number(json.debt) / 1e18
            usePositionsStore.getState().setPositions([{ id: 'current', collateralBtc, debtUsdt }])
            setApiAvailable(true)
          }
        } else {
          throw new Error(`API responded with status ${res.status}`)
        }
      } catch (err) {
        if (mounted) {
          console.warn('API not available, using fallback data:', err)
          setApiAvailable(false)
          // No mostrar error al usuario, usar datos mock
          setError(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [address])

  // Fallback on-chain directo si la API no está disponible
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!address || positions.length > 0 || isLoading) return
      try {
        const loanAddr = env.LOAN_MANAGER as `0x${string}`
        if (!loanAddr || loanAddr === '0x0000000000000000000000000000000000000000') {
          // Si no hay contrato configurado, usar datos mock
          if (!cancelled) {
            usePositionsStore.getState().setPositions([
              { id: 'demo-1', collateralBtc: 0.5, debtUsdt: 15000 },
              { id: 'demo-2', collateralBtc: 0.25, debtUsdt: 7500 }
            ])
          }
          return
        }
        
        const viemMod = await (new Function('env', `return import('viem')`) as (env: any) => Promise<any>)(env)
        const { createPublicClient, http, getContract } = viemMod
        const chainId = env.CHAIN_ID_TESTNET
        const rpc = env.RPC_TESTNET
        const chain = { id: chainId, name: 'Core', nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } } as any
        const client = createPublicClient({ transport: http(rpc), chain })
        const abi = [{ inputs: [{ name: 'user', type: 'address' }], name: 'getAccountData', outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' }] as const
        const contract = getContract({ address: loanAddr, abi: abi as any, client })
        const result = await contract.read.getAccountData([address])
        if (cancelled) return
        const collateral = Number((result as any)[0]) / 1e18
        const debt = Number((result as any)[1]) / 1e18
        if (Number.isFinite(collateral) && Number.isFinite(debt)) {
          usePositionsStore.getState().setPositions([{ id: 'current', collateralBtc: collateral, debtUsdt: debt }])
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Blockchain fallback failed, using demo data:', err)
          // Usar datos demo si todo falla
          usePositionsStore.getState().setPositions([
            { id: 'demo-1', collateralBtc: 0.5, debtUsdt: 15000 },
            { id: 'demo-2', collateralBtc: 0.25, debtUsdt: 7500 }
          ])
        }
      }
    })()
    return () => { cancelled = true }
  }, [address, positions.length, isLoading])

  // Calcular métricas agregadas
  const totalCollateralBtc = positions.reduce((sum, p) => sum + p.collateralBtc, 0)
  const totalDebtUsdt = positions.reduce((sum, p) => sum + p.debtUsdt, 0)
  const totalCollateralUsd = totalCollateralBtc * (price ?? 0)
  const totalDebtUsd = totalDebtUsdt
  const avgHealthFactor = positions.length > 0 
    ? positions.reduce((sum, p) => {
        const collateralUsd = p.collateralBtc * (price ?? 0)
        return sum + computeHealthFactor(collateralUsd, p.debtUsdt)
      }, 0) / positions.length
    : 0
  const avgLtv = positions.length > 0
    ? positions.reduce((sum, p) => {
        const collateralUsd = p.collateralBtc * (price ?? 0)
        return sum + computeLtv(collateralUsd, p.debtUsdt)
      }, 0) / positions.length
    : 0

  const getHealthFactorColor = (hf: number) => {
    if (hf < 1.1) return 'text-red-400 bg-red-400/10 border-red-400/20'
    if (hf < 1.3) return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    if (hf < 1.5) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    return 'text-green-400 bg-green-400/10 border-green-400/20'
  }

  const getLtvColor = (ltv: number) => {
    if (ltv > 0.8) return 'text-red-400'
    if (ltv > 0.7) return 'text-orange-400'
    if (ltv > 0.6) return 'text-yellow-400'
    return 'text-green-400'
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-semibold">{t('nav.positions')}</h1>
        <p className="text-sm text-ui-muted mt-1">{t('positions.subtitle') as string}</p>
      </div>

      {/* API Status Banner */}
      {!apiAvailable && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-yellow-500/20 bg-yellow-500/5 p-3 text-center"
        >
          <p className="text-sm text-yellow-400">
            🔧 API no disponible - Mostrando datos de demostración
          </p>
        </motion.div>
      )}

      {/* Summary Cards - Solo si hay posiciones */}
      {positions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <span className="text-xs text-ui-muted uppercase tracking-wider">Total Collateral</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold">{totalCollateralBtc.toFixed(6)} BTC</p>
            <p className="text-xs text-ui-muted">{formatUSD(totalCollateralUsd)}</p>
          </div>

          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💳</span>
              <span className="text-xs text-ui-muted uppercase tracking-wider">Total Debt</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold">{totalDebtUsdt.toFixed(2)} USDT</p>
            <p className="text-xs text-ui-muted">{formatUSD(totalDebtUsd)}</p>
          </div>

          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <span className="text-xs text-ui-muted uppercase tracking-wider">Avg LTV</span>
            </div>
            <p className={`text-lg sm:text-xl font-semibold ${getLtvColor(avgLtv)}`}>
              {(avgLtv * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-ui-muted">Loan-to-Value</p>
          </div>

          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🛡️</span>
              <span className="text-xs text-ui-muted uppercase tracking-wider">Avg Health</span>
            </div>
            <p className={`text-lg sm:text-xl font-semibold ${getHealthFactorColor(avgHealthFactor).split(' ')[0]}`}>
              {avgHealthFactor.toFixed(2)}
            </p>
            <p className="text-xs text-ui-muted">Health Factor</p>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
            <span className="text-sm text-ui-muted">Loading positions...</span>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card border-red-500/20 bg-red-500/5 p-4 text-center"
        >
          <p className="text-sm text-red-400 mb-2">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-outline text-xs px-3 py-1"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && positions.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-lg font-medium mb-2">No positions yet</h3>
            <p className="text-sm text-ui-muted mb-6">
              Start by borrowing against your BTC collateral to create your first position.
            </p>
            <Link
              to="/borrow"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>🚀</span>
              Start Borrowing
            </Link>
          </div>
        </motion.div>
      )}

      {/* Mobile Cards View */}
      <AnimatePresence>
        {!isLoading && !error && positions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="block sm:hidden space-y-3"
          >
            {positions.map((p, index) => {
              const collateralUsd = (p.collateralBtc * (price ?? 0))
              const debtUsd = p.debtUsdt
              const hf = computeHealthFactor(collateralUsd, debtUsd)
              const ltv = computeLtv(collateralUsd, debtUsd)
              
              return (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-4 space-y-4"
                >
                  {/* Position Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📈</span>
                      <h3 className="font-medium text-sm">Position #{p.id}</h3>
                    </div>
                    <Badge 
                      variant={hf < 1.2 ? 'error' : hf < 1.5 ? 'warning' : 'success'}
                      className="text-xs"
                    >
                      HF: {hf.toFixed(2)}
                    </Badge>
                  </div>

                  {/* Health Factor Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ui-muted">Health Factor</span>
                      <span className={getHealthFactorColor(hf).split(' ')[0]}>{hf.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          hf < 1.1 ? 'bg-red-500' : hf < 1.3 ? 'bg-orange-500' : hf < 1.5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (hf / 2) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Position Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-ui-muted text-xs flex items-center gap-1">
                        <span>💰</span>
                        {t('positions.collateral_label') as string}
                      </span>
                      <p className="font-semibold text-base">{p.collateralBtc.toFixed(6)} BTC</p>
                      <p className="text-xs text-ui-muted">{formatUSD(collateralUsd)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-ui-muted text-xs flex items-center gap-1">
                        <span>💳</span>
                        {t('positions.debt_label') as string}
                      </span>
                      <p className="font-semibold text-base">{p.debtUsdt.toFixed(2)} USDT</p>
                      <p className="text-xs text-ui-muted">{formatUSD(debtUsd)}</p>
                    </div>
                  </div>

                  {/* LTV */}
                  <div className="flex items-center justify-between text-sm p-3 bg-gray-800/30 rounded-lg">
                    <span className="text-ui-muted flex items-center gap-1">
                      <span>📊</span>
                      {t('positions.ltv_label') as string}
                    </span>
                    <span className={`font-semibold ${getLtvColor(ltv)}`}>
                      {(ltv * 100).toFixed(2)}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Link
                      to={`/borrow?${(() => { const params = new URLSearchParams(location.search); if (p.collateralBtc) params.set('collateral', String(p.collateralBtc)); return params.toString() })()}`}
                      className="btn-outline text-xs py-2.5 motion-press text-center flex items-center justify-center gap-2"
                    >
                      <span>➕</span>
                      {t('positions.add_collateral')}
                    </Link>
                    <Link
                      to={`/repay?${(() => { const params = new URLSearchParams(location.search); if (p.debtUsdt) params.set('repay', String(Math.min(50, p.debtUsdt))); return params.toString() })()}`}
                      className="btn-primary text-xs py-2.5 motion-press text-center flex items-center justify-center gap-2"
                    >
                      <span>💸</span>
                      {t('positions.repay')}
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Table View */}
      <AnimatePresence>
        {!isLoading && !error && positions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden sm:block"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto divide-y divide-gray-800 dark:divide-ui" role="table" aria-label="Positions table">
                <caption className="sr-only">Tabla de posiciones de usuario</caption>
                <thead className="bg-gray-900">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Position</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Collateral (BTC)</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Debt (USDT)</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">LTV</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">Health Factor</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ui-muted">{t('positions.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 dark:divide-ui">
                  {positions.map((p, index) => {
                    const collateralUsd = (p.collateralBtc * (price ?? 0))
                    const debtUsd = p.debtUsdt
                    const hf = computeHealthFactor(collateralUsd, debtUsd)
                    const ltv = computeLtv(collateralUsd, debtUsd)
                    return (
                      <motion.tr 
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-800/30 transition-colors"
                      >
                        <th scope="row" className="px-4 py-3 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📈</span>
                            <span>Position #{p.id}</span>
                          </div>
                        </th>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium">{p.collateralBtc.toFixed(6)}</p>
                            <p className="text-xs text-ui-muted">{formatUSD(collateralUsd)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium">{p.debtUsdt.toFixed(2)}</p>
                            <p className="text-xs text-ui-muted">{formatUSD(debtUsd)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${getLtvColor(ltv)}`}>
                            {(ltv * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${getHealthFactorColor(hf).split(' ')[0]}`}>
                              {hf.toFixed(2)}
                            </span>
                            <div className="w-16 bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  hf < 1.1 ? 'bg-red-500' : hf < 1.3 ? 'bg-orange-500' : hf < 1.5 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, (hf / 2) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/borrow?${(() => { const params = new URLSearchParams(location.search); if (p.collateralBtc) params.set('collateral', String(p.collateralBtc)); return params.toString() })()}`}
                              className="btn-outline text-xs px-3 py-1.5 motion-press flex items-center gap-1"
                            >
                              <span>➕</span>
                              {t('positions.add_collateral')}
                            </Link>
                            <Link
                              to={`/repay?${(() => { const params = new URLSearchParams(location.search); if (p.debtUsdt) params.set('repay', String(Math.min(50, p.debtUsdt))); return params.toString() })()}`}
                              className="btn-primary text-xs px-3 py-1.5 motion-press flex items-center gap-1"
                            >
                              <span>💸</span>
                              {t('positions.repay')}
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-md border border-gray-800 bg-gray-900 p-3 sm:p-4 text-xs sm:text-sm text-ui-muted"
      >
        <div className="flex items-center justify-between">
          <p>
            {t('positions.note_prices')}: {price ? formatUSD(price) : '—'} {t('positions.note_prices_suffix')}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs">📈</span>
            <Sparkline 
              values={[price ?? 0, price ?? 0, price ?? 0, price ?? 0, price ?? 0]} 
              width={60} 
              height={20}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}


