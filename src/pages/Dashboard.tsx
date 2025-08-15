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
  
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/status`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setApiStatus(json?.ok ? 'ok' : 'down')
        setContracts(json?.contracts ?? null)
      } catch {
        if (mounted) setApiStatus('down')
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
      } catch {}
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
        if (mounted) setMetrics({ activePositions: 0, liquidations24h: 0 })
      }
    })()
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/liquidations`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setLiqs(Array.isArray(json?.items) ? json.items : [])
      } catch {
        if (mounted) setLiqs([])
      }
    })()
    ;(async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/history/BTC`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setPriceHistory((json?.points ?? []).map((p: any) => Number(p.v) || 0))
      } catch {
         const seed = Number(priceNow ?? 0) || 60000
        const series = Array.from({ length: 24 }).map((_, i) => seed * (1 + Math.sin(i / 3) * 0.01))
        setPriceHistory(series)
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
    const id = setInterval(fetchHistory, 60_000)
    return () => { mounted = false; clearInterval(id) }
  }, [symbol, priceNow])
  
  // Histórico de TVL (auto-refresco cada 60s)
  useEffect(() => {
    let mounted = true
    const fetchTvl = async () => {
      try {
        const res = await fetch(`${env.API_URL}/market/history/tvl`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        setTvlHistory((json?.points ?? []).map((p: any) => Number(p.v) || 0))
      } catch {
        if (!mounted) return
        const base = tvlUsd || 1_500_000
        const series = Array.from({ length: 48 }).map((_, i) => base * (1 + Math.sin(i / 5) * 0.02))
        setTvlHistory(series)
      }
    }
    fetchTvl()
    const id = setInterval(fetchTvl, 60_000)
    return () => { mounted = false; clearInterval(id) }
  }, [tvlUsd])
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('nav.dashboard')}</h1>
          <p className="text-xs sm:text-sm text-ui-muted">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
          {stale && (
            <Alert variant="warning" className="text-xs py-1 w-full sm:w-auto">
              {t('dashboard.oracle_stale')}
            </Alert>
          )}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              className="btn-outline text-xs px-2 sm:px-3 py-1 flex-1 sm:flex-none"
              onClick={() => refetch()}
            >
              {t('dashboard.recalculate')}
            </button>
            <div className="flex items-center gap-1">
              {(['BTC','LSTBTC'] as const).map((sym) => (
                <button
                  key={sym}
                  type="button"
                  className={`${symbol === sym ? 'btn-primary' : 'btn-outline'} btn-sm text-xs px-2 py-1`}
                  aria-pressed={symbol === sym}
                  onClick={() => setSymbol(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <h2 className="text-sm font-medium">{t('dashboard.metrics_24h')}</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[{
            label: t('dashboard.active_positions') as string, 
            value: metrics ? String(metrics.activePositions) : t('dashboard.loading') as string
          },{
            label: t('dashboard.liquidations_24h') as string, 
            value: metrics ? String(metrics.liquidations24h) : t('dashboard.loading') as string
          }].map((m) => (
            <div key={m.label} className="kpi-card p-3 sm:p-4">
              <div className="text-xs uppercase tracking-wide text-ui-muted">{m.label}</div>
              <div className="mt-1 text-xl sm:text-2xl font-medium">{m.value}</div>
            </div>
          ))}
        </div>
        
        {/* Liquidations Section */}
        <div className="mt-4 sm:mt-5">
          <h3 className="text-xs font-medium text-ui-muted">{t('dashboard.liquidations_recent')}</h3>
          {liqs.length === 0 ? (
            <div className="mt-2 text-xs text-ui-muted">{t('dashboard.loading')}</div>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {liqs.slice(0, 5).map((it) => (
                <li key={it.tx} className="rounded border border-ui bg-ui-surface p-2 sm:p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <span className="truncate" title={it.user}>
                      <ExplorerLink hash={it.user} type="address" />
                    </span>
                    <span className="text-ui-muted text-xs">#{it.blockNumber}</span>
                  </div>
                  <div className="mt-1 text-ui-muted text-xs">
                    tx: <ExplorerLink hash={it.tx} type="tx" />
                  </div>
                  <div className="mt-1 text-ui-muted text-xs">
                    repay: {it.repayAmount.toFixed(4)} | seized: {it.collateralSeized.toFixed(4)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[{
          label: 'TVL', value: formatUSD(tvlUsd), skeleton: false
        },{
          label: 'Base Rate', value: `${(baseRate * 100).toFixed(2)}%`, skeleton: false
        },{
          label: `${symbol}/USD`, value: isLoading ? t('dashboard.loading') : formatUSD(priceNow ?? 0), skeleton: isLoading
        },{
          label: 'API', value: apiStatus === 'loading' ? t('dashboard.loading') : apiStatus === 'ok' ? 'Online' : 'Offline', skeleton: false
        }].map((kpi) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="kpi-card shadow-sm p-3 sm:p-4"
            role="group"
          >
            <div className="text-xs uppercase tracking-wide text-ui-muted">{kpi.label}</div>
            {kpi.skeleton ? (
              <div className="mt-2 h-6 sm:h-7 w-20 sm:w-28 skeleton" aria-hidden />
            ) : (
              <motion.div
                key={String(kpi.value)}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className={`mt-1 text-lg sm:text-xl lg:text-2xl font-medium break-words ${
                  kpi.label === 'API'
                    ? (apiStatus === 'ok' ? 'text-green-400' : apiStatus === 'down' ? 'text-red-400' : '')
                    : kpi.label === 'TVL' && tvlHistory.length > 1
                      ? (tvlHistory[tvlHistory.length - 1] - tvlHistory[0] > 0 ? 'text-green-400' : tvlHistory[tvlHistory.length - 1] - tvlHistory[0] < 0 ? 'text-red-400' : '')
                      : ''
                }`}
              >
                {kpi.value}
              </motion.div>
            )}
            {kpi.label === 'TVL' && tvlHistory.length > 0 && (
              <div className="mt-2">
                <Sparkline values={tvlHistory} width={200} height={40} />
              </div>
            )}
            {kpi.label.includes('/USD') && priceHistory.length > 0 && (
              <div className="mt-2">
                <Sparkline values={priceHistory} width={200} height={40} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Contracts Section */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <h2 className="text-sm font-medium">{t('dashboard.deployed_contracts') as string}</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {contracts ? Object.entries(contracts).map(([name, addr]: any) => (
            <div key={name as string} className="rounded border border-ui bg-ui-surface p-2 sm:p-3 text-xs">
              <div className="text-ui-muted font-medium">{name}</div>
              <div className="mt-1 truncate text-xs" title={String(addr)}>{String(addr)}</div>
            </div>
          )) : (
            <div className="text-sm text-ui-muted">{t('dashboard.loading') as string}</div>
          )}
        </div>
      </section>
    </div>
  )
}


