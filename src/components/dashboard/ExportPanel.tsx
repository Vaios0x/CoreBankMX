import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useExport } from '../../hooks/useExport'
import { useI18n } from '../../i18n/i18n'
import { Badge } from '../ui/Badge'

interface ExportData {
  metrics?: any
  priceHistory?: any[]
  liquidations?: any[]
  positions?: any[]
  transactions?: any[]
}

interface ExportPanelProps {
  data: ExportData
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function ExportPanel({
  data,
  isOpen,
  onClose,
  title = 'Export Data'
}: ExportPanelProps) {
  const t = useI18n()
  const { exportToCSV, exportToExcel, exportToPDF, exportDashboardData } = useExport()
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf'>('excel')
  const [selectedSections, setSelectedSections] = useState<string[]>(['metrics', 'priceHistory', 'liquidations'])
  const [exportOptions, setExportOptions] = useState({
    includeTimestamp: true,
    formatNumbers: true,
    includeCharts: false,
    customTitle: '',
    customSubtitle: ''
  })

  const availableSections = [
    { key: 'metrics', label: t('export.metrics'), count: data.metrics ? 1 : 0 },
    { key: 'priceHistory', label: t('export.price_history'), count: data.priceHistory?.length || 0 },
    { key: 'liquidations', label: t('export.liquidations'), count: data.liquidations?.length || 0 },
    { key: 'positions', label: t('export.positions'), count: data.positions?.length || 0 },
    { key: 'transactions', label: t('export.transactions'), count: data.transactions?.length || 0 }
  ]

  const toggleSection = (sectionKey: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionKey)
        ? prev.filter(s => s !== sectionKey)
        : [...prev, sectionKey]
    )
  }

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      alert(t('export.select_sections'))
      return
    }

    setIsExporting(true)
    try {
      // Filtrar datos según las secciones seleccionadas
      const exportData = {
        metrics: selectedSections.includes('metrics') ? data.metrics : undefined,
        priceHistory: selectedSections.includes('priceHistory') ? data.priceHistory : [],
        liquidations: selectedSections.includes('liquidations') ? data.liquidations : [],
        positions: selectedSections.includes('positions') ? data.positions : [],
        transactions: selectedSections.includes('transactions') ? data.transactions : []
      }

      if (selectedFormat === 'csv') {
        // Exportar cada sección como CSV separado
        if (exportData.metrics) {
          exportToCSV([exportData.metrics], {
            filename: `dashboard_metrics_${exportOptions.customTitle || 'export'}`,
            includeTimestamp: exportOptions.includeTimestamp,
            formatNumbers: exportOptions.formatNumbers
          })
        }
        if (exportData.priceHistory && exportData.priceHistory.length > 0) {
          exportToCSV(exportData.priceHistory, {
            filename: `price_history_${exportOptions.customTitle || 'export'}`,
            includeTimestamp: exportOptions.includeTimestamp,
            formatNumbers: exportOptions.formatNumbers
          })
        }
        if (exportData.liquidations && exportData.liquidations.length > 0) {
          exportToCSV(exportData.liquidations, {
            filename: `liquidations_${exportOptions.customTitle || 'export'}`,
            includeTimestamp: exportOptions.includeTimestamp,
            formatNumbers: exportOptions.formatNumbers
          })
        }
        if (exportData.positions && exportData.positions.length > 0) {
          exportToCSV(exportData.positions, {
            filename: `positions_${exportOptions.customTitle || 'export'}`,
            includeTimestamp: exportOptions.includeTimestamp,
            formatNumbers: exportOptions.formatNumbers
          })
        }
        if (exportData.transactions && exportData.transactions.length > 0) {
          exportToCSV(exportData.transactions, {
            filename: `transactions_${exportOptions.customTitle || 'export'}`,
            includeTimestamp: exportOptions.includeTimestamp,
            formatNumbers: exportOptions.formatNumbers
          })
        }
      } else if (selectedFormat === 'excel') {
        // Exportar todo en un archivo Excel
        exportDashboardData(exportData, 'excel')
      } else if (selectedFormat === 'pdf') {
        // Exportar como PDF
        exportDashboardData(exportData, 'pdf')
      }

      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert(t('export.success'))
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Export error:', error)
      alert(t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }

  const totalRecords = availableSections.reduce((sum, section) => sum + section.count, 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Formato de exportación */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t('export.format')}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'excel', label: 'Excel', icon: '📊' },
                    { key: 'csv', label: 'CSV', icon: '📄' },
                    { key: 'pdf', label: 'PDF', icon: '📋' }
                  ].map((format) => (
                    <button
                      key={format.key}
                      onClick={() => setSelectedFormat(format.key as any)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedFormat === format.key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{format.icon}</div>
                      <div className="text-sm font-medium">{format.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secciones a exportar */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t('export.sections')} ({selectedSections.length} seleccionadas)
                </h3>
                <div className="space-y-2">
                  {availableSections.map((section) => (
                    <label
                      key={section.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(section.key)}
                          onChange={() => toggleSection(section.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {section.label}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {section.count} {t('export.records')}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              {/* Opciones avanzadas */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t('export.options')}
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTimestamp}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamp: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('export.include_timestamp')}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.formatNumbers}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, formatNumbers: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('export.format_numbers')}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('export.include_charts')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Título personalizado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('export.custom_title')}
                </label>
                <input
                  type="text"
                  value={exportOptions.customTitle}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, customTitle: e.target.value }))}
                  placeholder={t('export.title_placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('export.total_records')}: {totalRecords}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || selectedSections.length === 0}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('export.exporting')}</span>
                    </div>
                  ) : (
                    t('export.export')
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
