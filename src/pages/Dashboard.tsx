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
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('nav.dashboard')}</h1>
          <p className="text-sm text-ui-muted">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {stale && (
            <Alert variant="warning" className="text-xs py-1">
              {t('dashboard.oracle_stale')}
            </Alert>
          )}
          <button
            type="button"
            className="btn-outline text-xs px-3 py-1"
            onClick={() => refetch()}
          >
            {t('dashboard.recalculate')}
          </button>
          <div className="hidden items-center gap-1 sm:flex">
            {(['BTC','LSTBTC'] as const).map((sym) => (
              <button
                key={sym}
                type="button"
                className={`${symbol === sym ? 'btn-primary' : 'btn-outline'} btn-sm`}
                aria-pressed={symbol === sym}
                onClick={() => setSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-medium">Métricas 24h</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[{
            label: 'Posiciones activas', value: metrics ? String(metrics.activePositions) : t('dashboard.loading')
          },{
            label: 'Liquidaciones 24h', value: metrics ? String(metrics.liquidations24h) : t('dashboard.loading')
          }].map((m) => (
            <div key={m.label} className="kpi-card">
              <div className="text-xs uppercase tracking-wide text-ui-muted">{m.label}</div>
              <div className="mt-1 text-2xl font-medium">{m.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <h3 className="text-xs font-medium text-ui-muted">Liquidations (recent)</h3>
          {liqs.length === 0 ? (
            <div className="mt-2 text-xs text-ui-muted">{t('dashboard.loading')}</div>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {liqs.slice(0, 5).map((it) => (
                <li key={it.tx} className="rounded border border-ui bg-ui-surface p-2">
                  <div className="flex items-center justify-between">
                    <span className="truncate" title={it.user}><ExplorerLink hash={it.user} type="address" /></span>
                    <span className="text-ui-muted">#{it.blockNumber}</span>
                  </div>
                  <div className="mt-1 text-ui-muted">tx: <ExplorerLink hash={it.tx} type="tx" /></div>
                  <div className="mt-1 text-ui-muted">repay: {it.repayAmount.toFixed(4)} | seized: {it.collateralSeized.toFixed(4)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
            className="kpi-card shadow-sm"
            role="group"
          >
            <div className="text-xs uppercase tracking-wide text-ui-muted">{kpi.label}</div>
            {kpi.skeleton ? (
              <div className="mt-2 h-7 w-28 skeleton" aria-hidden />
            ) : (
              <motion.div
                key={String(kpi.value)}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className={`mt-1 text-2xl font-medium ${
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

      <section className="card p-5">
        <h2 className="text-sm font-medium">Contratos desplegados</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {contracts ? Object.entries(contracts).map(([name, addr]: any) => (
            <div key={name as string} className="rounded border border-ui bg-ui-surface p-3 text-xs">
              <div className="text-ui-muted">{name}</div>
              <div className="mt-1 truncate" title={String(addr)}>{String(addr)}</div>
            </div>
          )) : (
            <div className="text-sm text-ui-muted">{t('dashboard.loading')}</div>
          )}
        </div>
      </section>
    </div>
  )
}


