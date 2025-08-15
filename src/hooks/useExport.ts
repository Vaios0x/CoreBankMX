import { useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { useI18n } from '../i18n/i18n'

interface ExportData {
  [key: string]: any
}

interface ExportOptions {
  filename?: string
  sheetName?: string
  title?: string
  subtitle?: string
  includeTimestamp?: boolean
  formatNumbers?: boolean
  locale?: string
}

export function useExport() {
  const { t, config } = useI18n()

  const exportToCSV = useCallback((
    data: ExportData[],
    options: ExportOptions = {}
  ) => {
    const {
      filename = 'export',
      includeTimestamp = true,
      formatNumbers = true
    } = options

    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header]
          
          if (formatNumbers && typeof value === 'number') {
            value = value.toLocaleString(config.locale)
          } else if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`
          }
          
          return value
        }).join(',')
      )
    ].join('\n')

    const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}` : ''
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [config.locale])

  const exportToExcel = useCallback((
    data: ExportData[],
    options: ExportOptions = {}
  ) => {
    const {
      filename = 'export',
      sheetName = 'Sheet1',
      includeTimestamp = true,
      formatNumbers = true
    } = options

    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new()
    
    // Formatear datos para Excel
    const formattedData = data.map(row => {
      const formattedRow: any = {}
      Object.keys(row).forEach(key => {
        let value = row[key]
        
        if (formatNumbers && typeof value === 'number') {
          formattedRow[key] = {
            v: value,
            t: 'n',
            z: '#,##0.00'
          }
        } else if (value instanceof Date) {
          formattedRow[key] = {
            v: value,
            t: 'd',
            z: 'dd/mm/yyyy hh:mm'
          }
        } else {
          formattedRow[key] = value
        }
      })
      return formattedRow
    })

    const ws = XLSX.utils.json_to_sheet(formattedData)
    
    // Configurar estilos de columnas
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, 15)
    }))
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}` : ''
    XLSX.writeFile(wb, `${filename}${timestamp}.xlsx`)
  }, [])

  const exportToPDF = useCallback((
    data: ExportData[],
    options: ExportOptions = {}
  ) => {
    const {
      filename = 'export',
      title = 'Report',
      subtitle = '',
      includeTimestamp = true
    } = options

    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20

    // Título
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(title, pageWidth / 2, margin, { align: 'center' })

    // Subtítulo
    if (subtitle) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(subtitle, pageWidth / 2, margin + 10, { align: 'center' })
    }

    // Timestamp
    if (includeTimestamp) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss')
      doc.text(`Generated: ${timestamp}`, pageWidth / 2, margin + 20, { align: 'center' })
    }

    // Preparar datos para la tabla
    const headers = Object.keys(data[0])
    const tableData = data.map(row => 
      headers.map(header => {
        let value = row[header]
        if (value instanceof Date) {
          return format(value, 'dd/MM/yyyy HH:mm')
        }
        if (typeof value === 'number') {
          return value.toLocaleString(config.locale)
        }
        return String(value || '')
      })
    )

    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: margin + 30,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: margin + 30 }
    })

    const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}` : ''
    doc.save(`${filename}${timestamp}.pdf`)
  }, [config.locale])

  const exportDashboardData = useCallback((
    dashboardData: {
      metrics: any
      priceHistory: any[]
      liquidations: any[]
      positions: any[]
    },
    format: 'csv' | 'excel' | 'pdf' = 'excel'
  ) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    
    switch (format) {
      case 'csv':
        // Exportar cada sección como CSV separado
        if (dashboardData.metrics) {
          exportToCSV([dashboardData.metrics], {
            filename: `dashboard_metrics_${timestamp}`,
            title: 'Dashboard Metrics'
          })
        }
        if (dashboardData.priceHistory.length > 0) {
          exportToCSV(dashboardData.priceHistory, {
            filename: `price_history_${timestamp}`,
            title: 'Price History'
          })
        }
        if (dashboardData.liquidations.length > 0) {
          exportToCSV(dashboardData.liquidations, {
            filename: `liquidations_${timestamp}`,
            title: 'Liquidations'
          })
        }
        break

      case 'excel':
        // Exportar todo en un archivo Excel con múltiples hojas
        const wb = XLSX.utils.book_new()
        
        if (dashboardData.metrics) {
          const metricsWs = XLSX.utils.json_to_sheet([dashboardData.metrics])
          XLSX.utils.book_append_sheet(wb, metricsWs, 'Metrics')
        }
        
        if (dashboardData.priceHistory.length > 0) {
          const priceWs = XLSX.utils.json_to_sheet(dashboardData.priceHistory)
          XLSX.utils.book_append_sheet(wb, priceWs, 'Price History')
        }
        
        if (dashboardData.liquidations.length > 0) {
          const liqWs = XLSX.utils.json_to_sheet(dashboardData.liquidations)
          XLSX.utils.book_append_sheet(wb, liqWs, 'Liquidations')
        }
        
        if (dashboardData.positions.length > 0) {
          const posWs = XLSX.utils.json_to_sheet(dashboardData.positions)
          XLSX.utils.book_append_sheet(wb, posWs, 'Positions')
        }
        
        XLSX.writeFile(wb, `dashboard_export_${timestamp}.xlsx`)
        break

      case 'pdf':
        // Exportar como PDF con múltiples páginas
        const doc = new jsPDF()
        let currentY = 20
        
        // Métricas
        if (dashboardData.metrics) {
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text('Dashboard Metrics', 20, currentY)
          currentY += 20
          
          const metricsData = Object.entries(dashboardData.metrics).map(([key, value]) => [key, String(value)])
          autoTable(doc, {
            head: [['Metric', 'Value']],
            body: metricsData,
            startY: currentY,
            styles: { fontSize: 10 }
          })
          currentY = (doc as any).lastAutoTable.finalY + 20
        }
        
        // Historial de precios
        if (dashboardData.priceHistory.length > 0) {
          doc.addPage()
          currentY = 20
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text('Price History', 20, currentY)
          currentY += 20
          
          const priceData = dashboardData.priceHistory.slice(0, 50).map(item => [
            format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm'),
            String(item.price),
            String(item.volume || 'N/A')
          ])
          
          autoTable(doc, {
            head: [['Date', 'Price', 'Volume']],
            body: priceData,
            startY: currentY,
            styles: { fontSize: 8 }
          })
        }
        
        doc.save(`dashboard_export_${timestamp}.pdf`)
        break
    }
  }, [exportToCSV, exportToExcel, exportToPDF])

  return {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportDashboardData
  }
}
