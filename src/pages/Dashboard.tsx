import { useMarketStore } from '../state/useMarketStore'
import { useOracle } from '../hooks/useOracle'
import { useI18n } from '../i18n/i18n'
import { Alert } from '../components/ui/Alert'
import { formatUSD } from '../lib/format'
import { useEffect, useState } from 'react'
import { env } from '../lib/env'
import Sparkline from '../components/ui/Sparkline'
import ExplorerLink from '../components/web3/ExplorerLink'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { tvlUsd, baseRate, setParams } = useMarketStore()
  const [symbol, setSymbol] = useState<'BTC' | 'LSTBTC'>('BTC')
  const { data: priceNow, isLoading, stale, refetch } = useOracle(symbol)
  const t = useI18n()
  const [apiStatus, setApiStatus] = useState<'ok' | 'down' | 'loading'>('loading')
  const [contracts, setContracts] = useState<any>(null)
  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const [tvlHistory, setTvlHistory] = useState<number[]>([])
  const [metrics, setMetrics] = useState<{ activePositions: number; liquidations24h: number } | null>(null)
  const [liqs, setLiqs] = useState<Array<{ tx: string; user: string; repayAmount: number; collateralSeized: number; incentive: number; blockNumber: number }>>([])
  const [apiAvailable, setApiAvailable] = useState(true)
  
  // Datos de demostración
  const demoContracts = {
    CollateralVault: '0x1234567890123456789012345678901234567890',
    LoanManager: '0x2345678901234567890123456789012345678901',
    LiquidationModule: '0x3456789012345678901234567890123456789012',
    OracleRouter: '0x4567890123456789012345678901234567890123',
    StakingVault: '0x5678901234567890123456789012345678901234'
  }

  const demoLiquidations = [
    {
      tx: '0x1234567890123456789012345678901234567890123456789012345678901234',
      user: '0x8eC3829793D0a2499971d0D853935F17aB52F800',
      repayAmount: 15000,
      collateralSeized: 0.25,
      incentive: 750,
      blockNumber: 12345678
    },
    {
      tx: '0x2345678901234567890123456789012345678901234567890123456789012345',
      user: '0x9fD493B8E1C2499971d0D853935F17aB52F801',
      repayAmount: 8500,
      collateralSeized: 0.15,
      incentive: 425,
      blockNumber: 12345677
    },
    {
      tx: '0x3456789012345678901234567890123456789012345678901234567890123456',
      user: '0x0aE594B9E1C2499971d0D853935F17aB52F802',
      repayAmount: 22000,
      collateralSeized: 0.35,
      incentive: 1100,
      blockNumber: 12345676
    }
  ]

  const demoMetrics = {
    activePositions: 47,
    liquidations24h: 3,
    tvlUsd: 2850000
  }

  const demoMarketParams = {
    baseRate: 0.05,
    targetLtv: 0.60,
    liquidationLtv: 0.75,
    originationFeeBps: 50,
    minBorrowAmount: 100
  }
  
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/status`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setApiStatus(json?.ok ? 'ok' : 'down')
        setContracts(json?.contracts ?? null)
        setApiAvailable(true)
      } catch {
        if (mounted) {
          setApiStatus('down')
          setApiAvailable(false)
          setContracts(demoContracts)
        }
      }
    })()
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/params`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        if (json && typeof json.baseRate === 'number') {
          setParams({ baseRate: json.baseRate, targetLtv: json.targetLtv, liquidationLtv: json.liquidationLtv, originationFeeBps: json.originationFeeBps, minBorrowAmount: json.minBorrowAmount })
        }
      } catch {
        if (mounted) {
          setParams(demoMarketParams)
        }
      }
    })()
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/metrics`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setMetrics({ activePositions: json?.activePositions ?? 0, liquidations24h: json?.liquidations24h ?? 0 })
        if (typeof json?.tvlUsd === 'number') {
          setParams({ tvlUsd: json.tvlUsd })
        }
      } catch {
        if (mounted) {
          setMetrics({ activePositions: demoMetrics.activePositions, liquidations24h: demoMetrics.liquidations24h })
          setParams({ tvlUsd: demoMetrics.tvlUsd })
        }
      }
    })()
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/liquidations`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setLiqs(Array.isArray(json?.items) ? json.items : [])
      } catch {
        if (mounted) {
          setLiqs(demoLiquidations)
        }
      }
    })()
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/history/BTC`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setPriceHistory((json?.points ?? []).map((p: any) => Number(p.v) || 0))
      } catch {
        if (mounted) {
          const seed = Number(priceNow ?? 0) || 60000
          const series = Array.from({ length: 24 }).map((_, i) => seed * (1 + Math.sin(i / 3) * 0.01))
          setPriceHistory(series)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Histórico de precios por símbolo + auto-refresco
  useEffect(() => {
    let mounted = true
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/history/${symbol}`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setPriceHistory((json?.points ?? []).map((p: any) => Number(p.v) || 0))
      } catch {
        if (!mounted) return
        const seed = Number(priceNow ?? 0) || 60000
        const series = Array.from({ length: 24 }).map((_, i) => seed * (1 + Math.sin(i / 3) * 0.01))
        setPriceHistory(series)
      }
    }
    fetchHistory()
    const interval = setInterval(fetchHistory, 30_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [symbol, priceNow])

  // Histórico de TVL (mock)
  useEffect(() => {
    const seed = tvlUsd || 2850000
    const series = Array.from({ length: 24 }).map((_, i) => seed * (1 + Math.sin(i / 4) * 0.02))
    setTvlHistory(series)
  }, [tvlUsd])

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{t('nav.dashboard')}</h1>
          <p className="text-sm text-ui-muted mt-1">{t('dashboard.subtitle') as string}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-outline text-xs px-2 sm:px-3 py-1 motion-press"
          >
            {isLoading ? t('dashboard.loading') : t('dashboard.recalculate')}
          </button>
          {stale && (
            <Alert variant="warning" className="w-full sm:w-auto">
              {t('dashboard.oracle_stale')}
            </Alert>
          )}
        </div>
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

      {/* Metrics Section */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dashboard.metrics_24h')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="kpi-card p-3 sm:p-4">
            <div className="h-6 sm:h-7 w-20 sm:w-28 skeleton" />
            <p className="text-lg sm:text-xl lg:text-2xl font-medium break-words">
              {formatUSD(tvlUsd || demoMetrics.tvlUsd)}
            </p>
            <p className="text-xs sm:text-sm text-ui-muted">TVL</p>
          </div>
          <div className="kpi-card p-3 sm:p-4">
            <div className="h-6 sm:h-7 w-20 sm:w-28 skeleton" />
            <p className="text-lg sm:text-xl lg:text-2xl font-medium break-words">
              {formatUSD((priceNow || 60000) * 0.5)}
            </p>
            <p className="text-xs sm:text-sm text-ui-muted">BTC Price</p>
          </div>
          <div className="kpi-card p-3 sm:p-4">
            <div className="h-6 sm:h-7 w-20 sm:w-28 skeleton" />
            <p className="text-lg sm:text-xl lg:text-2xl font-medium break-words">
              {metrics?.activePositions || demoMetrics.activePositions}
            </p>
            <p className="text-xs sm:text-sm text-ui-muted">{t('dashboard.active_positions')}</p>
          </div>
          <div className="kpi-card p-3 sm:p-4">
            <div className="h-6 sm:h-7 w-20 sm:w-28 skeleton" />
            <p className="text-lg sm:text-xl lg:text-2xl font-medium break-words">
              {metrics?.liquidations24h || demoMetrics.liquidations24h}
            </p>
            <p className="text-xs sm:text-sm text-ui-muted">{t('dashboard.liquidations_24h')}</p>
          </div>
        </div>
      </section>

      {/* Price Chart */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">BTC Price (24h)</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSymbol('BTC')}
              className={`btn-outline text-xs px-2 sm:px-3 py-1 motion-press ${symbol === 'BTC' ? 'btn-primary' : ''}`}
            >
              BTC
            </button>
            <button
              onClick={() => setSymbol('LSTBTC')}
              className={`btn-outline text-xs px-2 sm:px-3 py-1 motion-press ${symbol === 'LSTBTC' ? 'btn-primary' : ''}`}
            >
              LSTBTC
            </button>
          </div>
        </div>
        <div className="h-32 sm:h-40">
          <Sparkline values={priceHistory} width={800} height={160} />
        </div>
      </section>

      {/* Liquidations Section */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">{t('dashboard.liquidations_recent')}</h2>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {liqs.length === 0 ? (
            <p className="text-sm text-ui-muted text-center py-4">No recent liquidations</p>
          ) : (
            liqs.slice(0, 5).map((liq, i) => (
              <motion.div
                key={liq.tx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg bg-gray-800/30 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-400">💥</span>
                  <span className="font-medium">{liq.user.slice(0, 6)}…{liq.user.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-xs">
                  <span>Repaid: {formatUSD(liq.repayAmount)}</span>
                  <span>Seized: {liq.collateralSeized.toFixed(3)} BTC</span>
                  <span>Incentive: {formatUSD(liq.incentive)}</span>
                  <ExplorerLink type="tx" hash={liq.tx} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Contracts Section */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dashboard.deployed_contracts')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {contracts && Object.entries(contracts).map(([name, address]) => (
            <div key={name} className="p-2 sm:p-3 rounded-lg bg-gray-800/30 text-xs sm:text-sm">
              <div className="font-medium">{name}</div>
              <ExplorerLink type="address" hash={address as string} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


