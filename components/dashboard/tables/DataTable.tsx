'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  sorting?: {
    column: string
    direction: 'asc' | 'desc'
  }
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
  onRowClick?: (item: T) => void
  selectable?: boolean
  selectedRows?: Set<string>
  onRowSelect?: (id: string, selected: boolean) => void
  getRowId?: (item: T) => string
  emptyState?: {
    title: string
    description: string
    icon: LucideIcon
  }
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  sorting,
  onSort,
  pagination,
  onRowClick,
  selectable = false,
  selectedRows = new Set(),
  onRowSelect,
  getRowId = (item) => item.id,
  emptyState,
  className,
}: DataTableProps<T>) {
  const handleSort = (column: string) => {
    if (!onSort || !columns.find(c => c.key === column)?.sortable) return
    
    const newDirection =
      sorting?.column === column && sorting.direction === 'asc' ? 'desc' : 'asc'
    onSort(column, newDirection)
  }

  const getSortIcon = (column: string) => {
    if (!sorting || sorting.column !== column) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sorting.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  if (loading) {
    return (
      <div className="rounded-md border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              {columns.map((column) => (
                <TableHead key={column.key} className="text-slate-300">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-slate-800">
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    if (emptyState) {
      return (
        <div className="py-12">
          <EmptyState {...emptyState} />
        </div>
      )
    }
    return (
      <div className="rounded-md border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              {columns.map((column) => (
                <TableHead key={column.key} className="text-slate-300">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-slate-800">
              <TableCell colSpan={columns.length} className="text-center py-8 text-slate-400">
                No data available
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-md border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              {selectable && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={(e) => {
                      if (onRowSelect) {
                        data.forEach(item => {
                          onRowSelect(getRowId(item), e.target.checked)
                        })
                      }
                    }}
                    className="rounded border-slate-700"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-slate-300 ${column.className || ''}`}
                >
                  {column.sortable && onSort ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.key)}
                      className="h-8 px-2 hover:bg-slate-700"
                    >
                      {column.header}
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const rowId = getRowId(item)
              const isSelected = selectedRows.has(rowId)
              return (
                <TableRow
                  key={rowId}
                  className={`border-slate-800 hover:bg-slate-800/50 ${
                    isSelected ? 'bg-slate-800/30' : ''
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          onRowSelect?.(rowId, e.target.checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-700"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-400">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-400">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

