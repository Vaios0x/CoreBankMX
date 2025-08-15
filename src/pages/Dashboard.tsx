import { useMarketStore } from '../state/useMarketStore'
import { useOracle } from '../hooks/useOracle'
import { useI18n } from '../i18n/i18n'
import { Alert } from '../components/ui/Alert'
import { formatUSD, formatNumber } from '../lib/format'
import { useEffect, useState, useMemo } from 'react'
import { env } from '../lib/env'
import { CONTRACTS } from '../lib/contracts'
import Sparkline from '../components/ui/Sparkline'
import ExplorerLink from '../components/web3/ExplorerLink'
import { motion } from 'framer-motion'
import { useWebSocket } from '../hooks/useWebSocket'
import { useExport } from '../hooks/useExport'
import { PriceChart } from '../components/charts/PriceChart'
import { AdvancedFilters } from '../components/dashboard/AdvancedFilters'
import { ExportPanel } from '../components/dashboard/ExportPanel'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { getDevConfig } from '../lib/dev-config'

interface FilterOptions {
  search: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
  priceRange: {
    min: number | null
    max: number | null
  }
  symbols: string[]
  status: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  limit: number
}

export default function Dashboard() {
  const { tvlUsd, setParams } = useMarketStore()
  const [symbol, setSymbol] = useState<'BTC' | 'LSTBTC'>('BTC')
  const { data: priceNow, isLoading, stale, refetch } = useOracle(symbol)
  const t = useI18n()
  const [contracts, setContracts] = useState<any>(null)
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: number; price: number; volume?: number }>>([])
  const [metrics, setMetrics] = useState<{ activePositions: number; liquidations24h: number } | null>(null)
  const [liqs, setLiqs] = useState<Array<{ tx: string; user: string; repayAmount: number; collateralSeized: number; incentive: number; blockNumber: number; timestamp: number }>>([])
  const [apiAvailable, setApiAvailable] = useState(true)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    dateRange: { start: null, end: null },
    priceRange: { min: null, max: null },
    symbols: [],
    status: [],
    sortBy: 'timestamp',
    sortOrder: 'desc',
    limit: 100
  })

  const devConfig = getDevConfig()

  // WebSocket para actualizaciones en tiempo real
  const { isConnected, isConnecting, error: wsError, messages } = useWebSocket('/dashboard', {
    onMessage: (message) => {
      if (message.type === 'price_update' && message.data.symbol === symbol) {
        setPriceHistory(prev => [...prev.slice(-99), {
          timestamp: message.timestamp,
          price: message.data.price,
          volume: message.data.volume
        }])
      } else if (message.type === 'tvl_update') {
        setParams({ tvlUsd: message.data.tvlUsd })
      } else if (message.type === 'liquidation_event') {
        setLiqs(prev => [message.data, ...prev.slice(0, 99)])
      }
    },
    autoConnect: !devConfig.disableWebSocket,
    reconnectAttempts: devConfig.websocketConfig.reconnectAttempts,
    reconnectDelay: devConfig.websocketConfig.reconnectDelay
  })

  const { exportDashboardData } = useExport()
  
  // Memoizar el símbolo para evitar re-renders innecesarios
  const memoizedSymbol = useMemo(() => symbol, [symbol])
  
  // Fallback contracts from centralized config
  const fallbackContracts = {
    CollateralVault: CONTRACTS.CollateralVault,
    LoanManager: CONTRACTS.LoanManager,
    LiquidationModule: CONTRACTS.LiquidationModule,
    OracleRouter: CONTRACTS.OracleRouter,
    StakingVault: CONTRACTS.DualStakingVault,
    FeeController: CONTRACTS.FeeController,
    LSTBTC: CONTRACTS.LSTBTC,
    USDT: CONTRACTS.USDT
  }
  
  // Inicialización de datos del dashboard (solo una vez)
  useEffect(() => {
    let mounted = true
    
    const fetchInitialData = async () => {
      // Fetch status
      try {
        const res = await fetch(`${env.API_URL}/status`, { cache: 'no-store' })
        if (!mounted) return
        const json = await res.json()
        setContracts(json?.contracts ?? null)
        setApiAvailable(true)
      } catch {
        if (mounted) {
          setApiAvailable(false)
          setContracts(fallbackContracts)
        }
      }

      // Fetch market params
      try {
        const res = await fetch(`${env.API_URL}/market/params`, { cache: 'no-store' })
        if (!mounted) return
        const json = await res.json()
        if (json && typeof json.baseRate === 'number') {
          setParams({ baseRate: json.baseRate, targetLtv: json.targetLtv, liquidationLtv: json.liquidationLtv, originationFeeBps: json.originationFeeBps, minBorrowAmount: json.minBorrowAmount })
        }
      } catch (error) {
        console.error('Failed to fetch market params:', error)
      }

      // Fetch market metrics
      try {
        const res = await fetch(`${env.API_URL}/market/metrics`, { cache: 'no-store' })
        if (!mounted) return
        const json = await res.json()
        setMetrics({ activePositions: json?.activePositions ?? 0, liquidations24h: json?.liquidations24h ?? 0 })
        if (typeof json?.tvlUsd === 'number') {
          setParams({ tvlUsd: json.tvlUsd })
        }
      } catch (error) {
        console.error('Failed to fetch market metrics:', error)
      }

      // Fetch liquidations
      try {
        const res = await fetch(`${env.API_URL}/market/liquidations`, { cache: 'no-store' })
        if (!mounted) return
        const json = await res.json()
        const liquidationsWithTimestamp = Array.isArray(json?.items) ? json.items.map((liq: any) => ({
          ...liq,
          timestamp: Date.now() - Math.random() * 86400000
        })) : []
        setLiqs(liquidationsWithTimestamp)
      } catch (error) {
        console.error('Failed to fetch liquidations:', error)
      }

      // Fetch initial price history
      try {
        const res = await fetch(`${env.API_URL}/market/history/BTC`, { cache: 'no-store' })
        if (!mounted) return
        const json = await res.json()
        const historyWithTimestamp = (json?.points ?? []).map((p: any, index: number) => ({
          timestamp: Date.now() - (24 - index) * 3600000,
          price: Number(p.v) || 0,
          volume: Math.random() * 1000000
        }))
        setPriceHistory(historyWithTimestamp)
      } catch {
        if (mounted) {
          const seed = 60000 // Valor fijo para evitar dependencias
          const series = Array.from({ length: 24 }).map((_, i) => ({
            timestamp: Date.now() - (24 - i) * 3600000,
            price: seed * (1 + Math.sin(i / 3) * 0.01),
            volume: Math.random() * 1000000
          }))
          setPriceHistory(series)
        }
      }
    }

    fetchInitialData()
    
    return () => {
      mounted = false
    }
  }, []) // Sin dependencias para ejecutar solo una vez

  // Histórico de precios por símbolo + auto-refresco
  useEffect(() => {
    // Evitar ejecución si no hay símbolo válido
    if (!symbol || symbol.length === 0) return
    
    let mounted = true
    let intervalId: NodeJS.Timeout | null = null
    
    const fetchHistory = async () => {
      if (!mounted) return
      
      try {
        const res = await fetch(`${env.API_URL}/market/history/${symbol}`, { cache: 'no-store' })
        if (!mounted) return
        const json = await res.json()
        const historyWithTimestamp = (json?.points ?? []).map((p: any, index: number) => ({
          timestamp: Date.now() - (24 - index) * 3600000,
          price: Number(p.v) || 0,
          volume: Math.random() * 1000000
        }))
        setPriceHistory(historyWithTimestamp)
      } catch {
        if (!mounted) return
        const seed = 60000 // Valor fijo para evitar dependencias
        const series = Array.from({ length: 24 }).map((_, i) => ({
          timestamp: Date.now() - (24 - i) * 3600000,
          price: seed * (1 + Math.sin(i / 3) * 0.01),
          volume: Math.random() * 1000000
        }))
        setPriceHistory(series)
      }
    }
    
    // Ejecutar inmediatamente
    fetchHistory()
    
    // Configurar intervalo
    intervalId = setInterval(fetchHistory, devConfig.pollingConfig.priceUpdateInterval)
    
    return () => {
      mounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [symbol]) // Solo depende del símbolo

  // Filtrar datos según los filtros aplicados
  const filteredLiquidations = useMemo(() => {
    let filtered = liqs

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(liq => 
        liq.user.toLowerCase().includes(searchLower) ||
        liq.tx.toLowerCase().includes(searchLower)
      )
    }

    // Filtro de fecha
    if (filters.dateRange.start) {
      filtered = filtered.filter(liq => liq.timestamp >= filters.dateRange.start!.getTime())
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(liq => liq.timestamp <= filters.dateRange.end!.getTime())
    }

    // Filtro de precio
    if (filters.priceRange.min) {
      filtered = filtered.filter(liq => liq.repayAmount >= filters.priceRange.min!)
    }
    if (filters.priceRange.max) {
      filtered = filtered.filter(liq => liq.repayAmount <= filters.priceRange.max!)
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof typeof a]
      const bValue = b[filters.sortBy as keyof typeof b]
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered.slice(0, filters.limit)
  }, [liqs, filters])

  const handleExport = () => {
    const exportData = {
      metrics: {
        tvlUsd,
        activePositions: metrics?.activePositions || 0,
        liquidations24h: metrics?.liquidations24h || 0,
        currentPrice: priceNow || 0
      },
      priceHistory,
      liquidations: liqs,
      positions: [], // TODO: Add positions data
      transactions: [] // TODO: Add transactions data
    }
    
    exportDashboardData(exportData, 'excel')
  }

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
          <button
            onClick={() => setShowExportPanel(true)}
            className="btn-primary text-xs px-2 sm:px-3 py-1 motion-press"
          >
            📊 {t('dashboard.export_data')}
          </button>
          {stale && (
            <Alert variant="warning" className="w-full sm:w-auto">
              {t('dashboard.oracle_stale')}
            </Alert>
          )}
        </div>
      </div>

      {/* WebSocket Status - Ocultado en desarrollo */}
      {/* <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'}`} />
        <span className="text-gray-600 dark:text-gray-400">
          {t('dashboard.websocket_status')}: {
            isConnected ? t('dashboard.connected') :
            isConnecting ? t('dashboard.connecting') :
            t('dashboard.disconnected')
          }
        </span>
        {wsError && (
          <span className="text-red-500 text-xs">
            Error: {wsError.message}
          </span>
        )}
      </div> */}

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
              {formatUSD(tvlUsd || 0)}
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
              {metrics?.activePositions || 0}
            </p>
            <p className="text-xs sm:text-sm text-ui-muted">{t('dashboard.active_positions')}</p>
          </div>
          <div className="kpi-card p-3 sm:p-4">
            <div className="h-6 sm:h-7 w-20 sm:w-28 skeleton" />
            <p className="text-lg sm:text-xl lg:text-2xl font-medium break-words">
              {metrics?.liquidations24h || 0}
            </p>
            <p className="text-xs sm:text-sm text-ui-muted">{t('dashboard.liquidations_24h')}</p>
          </div>
        </div>
      </section>

      {/* Advanced Price Chart */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">BTC Price Chart</h2>
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
        <PriceChart
          data={priceHistory}
          symbol={symbol}
          timeframe="24h"
          height={300}
          showVolume={true}
          showChange={true}
          interactive={true}
        />
      </section>

      {/* Advanced Filters */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('dashboard.advanced_filters')}</h2>
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableSymbols={['BTC', 'LSTBTC', 'ETH']}
          availableStatuses={['active', 'liquidated', 'closed']}
          showDateRange={true}
          showPriceRange={true}
          showSymbols={false}
          showStatus={false}
          showSort={true}
          showLimit={true}
        />
      </section>

      {/* Liquidations Section with Advanced Features */}
      <section className="card p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            {t('dashboard.liquidations_recent')} ({filteredLiquidations.length})
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "success" : "warning"}>
              {isConnected ? "🟢 Live" : "🟡 Offline"}
            </Badge>
          </div>
        </div>
        
        {filteredLiquidations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ui-muted">
              {filters.search || filters.dateRange.start || filters.dateRange.end 
                ? 'No se encontraron liquidaciones con los filtros aplicados'
                : 'No hay liquidaciones recientes'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredLiquidations.map((liq, i) => (
              <motion.div
                key={liq.tx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-gray-800/30 text-xs sm:text-sm hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-400">💥</span>
                  <span className="font-medium">{liq.user.slice(0, 6)}…{liq.user.slice(-4)}</span>
                  <Badge variant="warning" className="text-xs">
                    {new Date(liq.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-xs">
                  <span>Repaid: {formatUSD(liq.repayAmount)}</span>
                  <span>Seized: {(liq.collateralSeized || 0).toFixed(3)} BTC</span>
                  <span>Incentive: {formatUSD(liq.incentive)}</span>
                  <ExplorerLink type="tx" hash={liq.tx} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Contracts Section - Removed, now available in /docs */}

      {/* Export Panel */}
      <ExportPanel
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        data={{
          metrics: {
            tvlUsd,
            activePositions: metrics?.activePositions || 0,
            liquidations24h: metrics?.liquidations24h || 0,
            currentPrice: priceNow || 0
          },
          priceHistory,
          liquidations: liqs,
          positions: [],
          transactions: []
        }}
        title="Exportar Datos del Dashboard"
      />
    </div>
  )
}


