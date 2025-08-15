import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { useI18n } from '../../i18n/i18n'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

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

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableSymbols?: string[]
  availableStatuses?: string[]
  showDateRange?: boolean
  showPriceRange?: boolean
  showSymbols?: boolean
  showStatus?: boolean
  showSort?: boolean
  showLimit?: boolean
}

const PRESET_RANGES = {
  '1h': { start: subDays(new Date(), 1), end: new Date() },
  '24h': { start: subDays(new Date(), 1), end: new Date() },
  '7d': { start: subDays(new Date(), 7), end: new Date() },
  '30d': { start: subDays(new Date(), 30), end: new Date() },
  '90d': { start: subDays(new Date(), 90), end: new Date() }
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableSymbols = ['BTC', 'LSTBTC', 'ETH'],
  availableStatuses = ['active', 'liquidated', 'closed'],
  showDateRange = true,
  showPriceRange = true,
  showSymbols = true,
  showStatus = true,
  showSort = true,
  showLimit = true
}: AdvancedFiltersProps) {
  const t = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilters = (updates: Partial<FilterOptions>) => {
    const newFilters = { ...localFilters, ...updates }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
      search: '',
      dateRange: { start: null, end: null },
      priceRange: { min: null, max: null },
      symbols: [],
      status: [],
      sortBy: 'timestamp',
      sortOrder: 'desc',
      limit: 100
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const applyPresetRange = (preset: keyof typeof PRESET_RANGES) => {
    const range = PRESET_RANGES[preset]
    updateFilters({
      dateRange: {
        start: range.start,
        end: range.end
      }
    })
  }

  const toggleSymbol = (symbol: string) => {
    const newSymbols = localFilters.symbols.includes(symbol)
      ? localFilters.symbols.filter(s => s !== symbol)
      : [...localFilters.symbols, symbol]
    updateFilters({ symbols: newSymbols })
  }

  const toggleStatus = (status: string) => {
    const newStatuses = localFilters.status.includes(status)
      ? localFilters.status.filter(s => s !== status)
      : [...localFilters.status, status]
    updateFilters({ status: newStatuses })
  }

  const activeFiltersCount = [
    localFilters.search ? 1 : 0,
    localFilters.dateRange.start || localFilters.dateRange.end ? 1 : 0,
    localFilters.priceRange.min || localFilters.priceRange.max ? 1 : 0,
    localFilters.symbols.length,
    localFilters.status.length
  ].reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda principal */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t('filters.search_placeholder')}
            value={localFilters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full"
          />
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-outline px-3 py-2 text-sm"
        >
          {t('filters.advanced')}
          {activeFiltersCount > 0 && (
            <Badge variant="primary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </button>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="btn-outline text-red-600 hover:text-red-700 px-3 py-2 text-sm"
          >
            {t('filters.clear')}
          </button>
        )}
      </div>

      {/* Filtros avanzados */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Rango de fechas */}
              {showDateRange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('filters.date_range')}
                  </label>
                  
                  {/* Presets rápidos */}
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(PRESET_RANGES).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => applyPresetRange(preset as keyof typeof PRESET_RANGES)}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={localFilters.dateRange.start ? format(localFilters.dateRange.start, 'yyyy-MM-dd') : ''}
                      onChange={(e) => updateFilters({
                        dateRange: {
                          ...localFilters.dateRange,
                          start: e.target.value ? startOfDay(new Date(e.target.value)) : null
                        }
                      })}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      value={localFilters.dateRange.end ? format(localFilters.dateRange.end, 'yyyy-MM-dd') : ''}
                      onChange={(e) => updateFilters({
                        dateRange: {
                          ...localFilters.dateRange,
                          end: e.target.value ? endOfDay(new Date(e.target.value)) : null
                        }
                      })}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Rango de precios */}
              {showPriceRange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('filters.price_range')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder={t('filters.min_price')}
                      value={localFilters.priceRange.min || ''}
                      onChange={(e) => updateFilters({
                        priceRange: {
                          ...localFilters.priceRange,
                          min: e.target.value ? Number(e.target.value) : null
                        }
                      })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder={t('filters.max_price')}
                      value={localFilters.priceRange.max || ''}
                      onChange={(e) => updateFilters({
                        priceRange: {
                          ...localFilters.priceRange,
                          max: e.target.value ? Number(e.target.value) : null
                        }
                      })}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Símbolos */}
              {showSymbols && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('filters.symbols')}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {availableSymbols.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => toggleSymbol(symbol)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          localFilters.symbols.includes(symbol)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Estados */}
              {showStatus && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('filters.status')}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {availableStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          localFilters.status.includes(status)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {t(`status.${status}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ordenamiento */}
              {showSort && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('filters.sort_by')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={localFilters.sortBy}
                      onChange={(e) => updateFilters({ sortBy: e.target.value })}
                      className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                      <option value="timestamp">{t('filters.sort_timestamp')}</option>
                      <option value="price">{t('filters.sort_price')}</option>
                      <option value="volume">{t('filters.sort_volume')}</option>
                      <option value="amount">{t('filters.sort_amount')}</option>
                    </select>
                    <select
                      value={localFilters.sortOrder}
                      onChange={(e) => updateFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
                      className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                      <option value="desc">{t('filters.sort_desc')}</option>
                      <option value="asc">{t('filters.sort_asc')}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Límite de resultados */}
              {showLimit && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('filters.limit')}
                  </label>
                  <select
                    value={localFilters.limit}
                    onChange={(e) => updateFilters({ limit: Number(e.target.value) })}
                    className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                </div>
              )}
            </div>

            {/* Filtros activos */}
            {activeFiltersCount > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {localFilters.search && (
                    <Badge variant="secondary" className="text-xs">
                      {t('filters.search')}: "{localFilters.search}"
                    </Badge>
                  )}
                  {localFilters.dateRange.start && (
                    <Badge variant="secondary" className="text-xs">
                      {t('filters.from')}: {format(localFilters.dateRange.start, 'MMM dd')}
                    </Badge>
                  )}
                  {localFilters.dateRange.end && (
                    <Badge variant="secondary" className="text-xs">
                      {t('filters.to')}: {format(localFilters.dateRange.end, 'MMM dd')}
                    </Badge>
                  )}
                  {localFilters.priceRange.min && (
                    <Badge variant="secondary" className="text-xs">
                      {t('filters.min')}: ${localFilters.priceRange.min}
                    </Badge>
                  )}
                  {localFilters.priceRange.max && (
                    <Badge variant="secondary" className="text-xs">
                      {t('filters.max')}: ${localFilters.priceRange.max}
                    </Badge>
                  )}
                  {localFilters.symbols.map((symbol) => (
                    <Badge key={symbol} variant="primary" className="text-xs">
                      {symbol}
                    </Badge>
                  ))}
                  {localFilters.status.map((status) => (
                    <Badge key={status} variant="success" className="text-xs">
                      {t(`status.${status}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
