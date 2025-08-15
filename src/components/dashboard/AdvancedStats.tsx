import React from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/i18n'
import { formatUSD, formatNumber, formatPercent } from '../../lib/format'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface AdvancedStatsProps {
  metrics: {
    tvlUsd: number
    activePositions: number
    liquidations24h: number
    totalVolume24h: number
    averageLtv: number
    healthFactorDistribution: {
      healthy: number
      warning: number
      danger: number
    }
    topCollateralAssets: Array<{
      symbol: string
      amount: number
      percentage: number
    }>
    liquidationsByHour: Array<{
      hour: number
      count: number
      volume: number
    }>
  }
}

export function AdvancedStats({ metrics }: AdvancedStatsProps) {
  const t = useI18n()

  const totalPositions = metrics.healthFactorDistribution.healthy + 
                        metrics.healthFactorDistribution.warning + 
                        metrics.healthFactorDistribution.danger

  const healthFactorPercentage = {
    healthy: totalPositions > 0 ? (metrics.healthFactorDistribution.healthy / totalPositions) * 100 : 0,
    warning: totalPositions > 0 ? (metrics.healthFactorDistribution.warning / totalPositions) * 100 : 0,
    danger: totalPositions > 0 ? (metrics.healthFactorDistribution.danger / totalPositions) * 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">TVL Total</p>
              <p className="text-2xl font-bold">{formatUSD(metrics.tvlUsd)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Posiciones Activas</p>
              <p className="text-2xl font-bold">{formatNumber(metrics.activePositions)}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Volumen 24h</p>
              <p className="text-2xl font-bold">{formatUSD(metrics.totalVolume24h)}</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">LTV Promedio</p>
              <p className="text-2xl font-bold">{formatPercent(metrics.averageLtv)}</p>
            </div>
            <div className="text-3xl">⚖️</div>
          </div>
        </motion.div>
      </div>

      {/* Distribución de Health Factor */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribución de Health Factor</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Saludable (HF ≥ 1.5)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{metrics.healthFactorDistribution.healthy}</span>
              <span className="text-sm text-gray-500">({healthFactorPercentage.healthy.toFixed(1)}%)</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${healthFactorPercentage.healthy}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Advertencia (1.2 ≤ HF < 1.5)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{metrics.healthFactorDistribution.warning}</span>
              <span className="text-sm text-gray-500">({healthFactorPercentage.warning.toFixed(1)}%)</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${healthFactorPercentage.warning}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Peligro (HF < 1.2)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{metrics.healthFactorDistribution.danger}</span>
              <span className="text-sm text-gray-500">({healthFactorPercentage.danger.toFixed(1)}%)</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${healthFactorPercentage.danger}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Top Collateral Assets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Principales Activos de Colateral</h3>
        <div className="space-y-3">
          {metrics.topCollateralAssets.map((asset, index) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge variant="primary">{index + 1}</Badge>
                <span className="font-medium">{asset.symbol}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatUSD(asset.amount)}</p>
                <p className="text-sm text-gray-500">{asset.percentage.toFixed(1)}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Liquidaciones por Hora */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Liquidaciones por Hora (24h)</h3>
        <div className="grid grid-cols-6 gap-2">
          {metrics.liquidationsByHour.map((hourData, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="text-center"
            >
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">{hourData.hour}:00</p>
                <p className="font-semibold text-sm">{hourData.count}</p>
                <p className="text-xs text-gray-500">{formatUSD(hourData.volume)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Resumen de Liquidaciones */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumen de Liquidaciones (24h)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{metrics.liquidations24h}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Liquidaciones</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {metrics.liquidations24h > 0 ? formatUSD(metrics.totalVolume24h / metrics.liquidations24h) : '$0'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Liquidación</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {metrics.activePositions > 0 ? ((metrics.liquidations24h / metrics.activePositions) * 100).toFixed(2) : '0'}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Liquidación</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
