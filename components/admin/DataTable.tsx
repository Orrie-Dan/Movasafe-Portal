'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  pagination?: {
    pageSize: number
  }
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
  loading?: boolean
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination,
  onRowClick,
  emptyMessage = 'No data available',
  className,
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery) return data
    
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor ? col.accessor(row) : row[col.key]
        return String(value).toLowerCase().includes(searchQuery.toLowerCase())
      })
    )
  }, [data, searchQuery, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData
    
    const column = columns.find((col) => col.key === sortColumn)
    if (!column || !column.sortable) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aValue = column.accessor ? column.accessor(a) : a[sortColumn]
      const bValue = column.accessor ? column.accessor(b) : b[sortColumn]
      
      const comparison = String(aValue).localeCompare(String(bValue))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData
    
    const startIndex = (currentPage - 1) * pagination.pageSize
    return sortedData.slice(startIndex, startIndex + pagination.pageSize)
  }, [sortedData, currentPage, pagination])

  const totalPages = pagination
    ? Math.ceil(sortedData.length / pagination.pageSize)
    : 1

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey)
    if (!column || !column.sortable) return
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {searchable && (
        <div className="flex items-center gap-4">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
          />
        </div>
      )}
      
      <div className="rounded-md border border-slate-200 dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    'text-slate-600 dark:text-slate-400 font-medium',
                    column.sortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-white',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <div className="flex flex-col">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-8"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.accessor ? column.accessor(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(currentPage * pagination.pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-200 dark:border-slate-700 text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-200 dark:border-slate-700 text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

