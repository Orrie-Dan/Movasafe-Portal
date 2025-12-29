'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react'
import type { FinancialFilters } from '@/lib/types/financial'
import { apiExportFinancialReport } from '@/lib/api'

export interface ExportControlsProps {
  filters?: FinancialFilters
  onRefresh?: () => void
}

export function ExportControls({ filters, onRefresh }: ExportControlsProps) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(format)
    try {
      const blob = await apiExportFinancialReport(format, filters)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-slate-700 text-white hover:bg-slate-800 text-xs sm:text-sm"
        >
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={exporting === 'pdf'}
        className="border-slate-700 text-white hover:bg-slate-800 text-xs sm:text-sm"
      >
        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}</span>
        <span className="sm:hidden">PDF</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('excel')}
        disabled={exporting === 'excel'}
        className="border-slate-700 text-white hover:bg-slate-800 text-xs sm:text-sm"
      >
        <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{exporting === 'excel' ? 'Exporting...' : 'Export Excel'}</span>
        <span className="sm:hidden">Excel</span>
      </Button>
    </div>
  )
}

