import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  ComposedChart,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts'
import { format } from 'date-fns'
import { useI18n } from '../../i18n/i18n'
import { formatUSD, formatNumber } from '../../lib/format'

interface PriceData {
  timestamp: number
  price: number
  volume?: number
  change?: number
  changePercent?: number
}

interface PriceChartProps {
  data: PriceData[]
  symbol: string
  timeframe: '1h' | '24h' | '7d' | '30d'
  height?: number
  showVolume?: boolean
  showChange?: boolean
  interactive?: boolean
  theme?: 'light' | 'dark'
}

const CustomTooltip = ({ active, payload, label, symbol }: any) => {
  const { formatCurrency, formatDateTime } = useI18n()
  
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {formatDateTime(data.timestamp)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {symbol}: {formatCurrency(data.price, 'USD')}
        </p>
        {data.volume && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Volume: {formatNumber(data.volume)}
          </p>
        )}
        {data.changePercent && (
          <p className={`text-sm ${data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Change: {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
          </p>
        )}
      </div>
    )
  }
  return null
}

export function PriceChart({
  data,
  symbol,
  timeframe,
  height = 400,
  showVolume = false,
  showChange = false,
  interactive = true,
  theme = 'dark'
}: PriceChartProps) {
  const { t } = useI18n()
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick'>('line')
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null)

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.map((item, index) => {
      const change = index > 0 ? item.price - data[index - 1].price : 0
      const changePercent = index > 0 ? ((change / data[index - 1].price) * 100) : 0
      
      return {
        ...item,
        change,
        changePercent,
        time: format(new Date(item.timestamp), 'HH:mm'),
        date: format(new Date(item.timestamp), 'MM/dd')
      }
    })
  }, [data])

  const isPositive = useMemo(() => {
    if (processedData.length < 2) return true
    const first = processedData[0].price
    const last = processedData[processedData.length - 1].price
    return last >= first
  }, [processedData])

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    if (showVolume && chartType === 'line') {
      return (
        <ComposedChart {...commonProps} height={height}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatUSD(value)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip content={<CustomTooltip symbol={symbol} />} />
          <Legend />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="volume"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            name="Volume"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "#10B981" : "#EF4444"}
            strokeWidth={2}
            dot={false}
            name="Price"
          />
        </ComposedChart>
      )
    }

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps} height={height}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatUSD(value)}
          />
          <Tooltip content={<CustomTooltip symbol={symbol} />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "#10B981" : "#EF4444"}
            fill={isPositive ? "#10B981" : "#EF4444"}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </AreaChart>
      )
    }

    return (
      <LineChart {...commonProps} height={height}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="time"
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatUSD(value)}
        />
        <Tooltip content={<CustomTooltip symbol={symbol} />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={isPositive ? "#10B981" : "#EF4444"}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: isPositive ? "#10B981" : "#EF4444" }}
        />
        {showChange && (
          <ReferenceLine y={processedData[0]?.price || 0} stroke="#6B7280" strokeDasharray="3 3" />
        )}
      </LineChart>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles del chart */}
      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('charts.line')}
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('charts.area')}
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{t('charts.timeframe')}: {timeframe}</span>
            {showChange && processedData.length > 1 && (
              <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{((processedData[processedData.length - 1].price - processedData[0].price) / processedData[0].price * 100).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Información adicional */}
      {processedData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-600 dark:text-gray-400">{t('charts.current_price')}</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {formatUSD(processedData[processedData.length - 1].price)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-600 dark:text-gray-400">{t('charts.high_24h')}</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {formatUSD(Math.max(...processedData.map(d => d.price)))}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-600 dark:text-gray-400">{t('charts.low_24h')}</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {formatUSD(Math.min(...processedData.map(d => d.price)))}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-600 dark:text-gray-400">{t('charts.volume')}</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {formatNumber(processedData.reduce((sum, d) => sum + (d.volume || 0), 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
