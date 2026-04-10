'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ViewDetailsDialog } from '@/components/admin/ViewDetailsDialog'
import { toast } from '@/hooks/use-toast'
import { apiGetExternalAuditLogsAll, type ExternalAuditLog } from '@/lib/api/audit-logs'
import { RefreshCw, Search, Eye } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type Filters = {
  search: string
  action: string
  entity: string
  actorType: string
  sourceService: string
  startDate: string
  endDate: string
}

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

export default function ExternalAuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ExternalAuditLog[]>([])
  const [selected, setSelected] = useState<ExternalAuditLog | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    action: 'all',
    entity: 'all',
    actorType: 'all',
    sourceService: 'all',
    startDate: '',
    endDate: '',
  })

  const loadLogs = async () => {
    try {
      setLoading(true)
      const res = await apiGetExternalAuditLogsAll({
        page: 0,
        limit: 100,
        sortBy: 'createdAt',
        order: 'DESC',
      })
      const content = res?.data?.content ?? []
      setLogs(Array.isArray(content) ? content : [])
    } catch (err) {
      console.error('Failed to load external audit logs:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load audit logs',
        variant: 'destructive',
      })
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const actionOptions = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => l.action && set.add(l.action))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [logs])

  const entityOptions = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => l.entity && set.add(l.entity))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [logs])

  const actorTypeOptions = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => l.actorType && set.add(String(l.actorType)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [logs])

  const sourceServiceOptions = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => l.sourceService && set.add(l.sourceService))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [logs])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()

    return logs.filter((l) => {
      if (filters.action !== 'all' && l.action !== filters.action) return false
      if (filters.entity !== 'all' && l.entity !== filters.entity) return false
      if (filters.actorType !== 'all' && String(l.actorType || '') !== filters.actorType) return false
      if (filters.sourceService !== 'all' && String(l.sourceService || '') !== filters.sourceService) return false
      if (filters.startDate && new Date(l.createdAt) < new Date(filters.startDate)) return false
      if (filters.endDate && new Date(l.createdAt) > new Date(`${filters.endDate}T23:59:59`)) return false

      if (!q) return true

      const haystack = [
        l.id,
        l.action,
        l.entity,
        l.entityId,
        l.actorDisplayName,
        l.actorId,
        l.actorFirstName,
        l.actorLastName,
        l.actorPhoneNumber,
        l.doneByFirstName,
        l.doneByLastName,
        l.doneByPhoneNumber,
        l.doneByRoleName,
        l.sourceService,
        l.details,
        l.createdAt,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ')

      return haystack.includes(q)
    })
  }, [logs, filters])

  const columns: Column<ExternalAuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      accessor: (l) => (
        <span className="text-foreground">
          {l.createdAt ? format(parseISO(l.createdAt), 'MMM d, yyyy HH:mm:ss') : '—'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (l) => <span className="text-blue-400 font-medium">{l.action}</span>,
      sortable: true,
    },
    {
      key: 'entity',
      header: 'Entity',
      accessor: (l) => <span className="text-foreground">{l.entity || '—'}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      accessor: (l) => (
        <div className="space-y-0.5">
          <div className="text-foreground">{l.actorDisplayName || '—'}</div>
          <div className="text-xs text-muted-foreground">
            {l.actorType ? (
              <Badge variant="outline" className="text-[11px]">
                {l.actorType}
              </Badge>
            ) : null}{' '}
            {l.actorPhoneNumber ? <span className="font-mono">{l.actorPhoneNumber}</span> : null}
          </div>
        </div>
      ),
    },
    {
      key: 'sourceService',
      header: 'Source',
      accessor: (l) => (
        <span className="text-sm text-muted-foreground">{l.sourceService || '—'}</span>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      accessor: (l) => {
        const result = (l.detailsJson as any)?.result
        const resultStr = safeStr(result).toUpperCase()
        if (!resultStr) return <span className="text-muted-foreground">—</span>
        const cls =
          resultStr === 'SUCCESS'
            ? 'bg-green-500/15 text-green-400 border-green-500/25'
            : resultStr === 'FAILED' || resultStr === 'ERROR'
            ? 'bg-red-500/15 text-red-400 border-red-500/25'
            : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
        return (
          <Badge className={cls} variant="outline">
            {resultStr}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (l) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={(e) => {
            e.stopPropagation()
            setSelected(l)
          }}
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      className: 'text-right',
    },
  ]

  const exportCsv = () => {
    const headers = ['timestamp', 'action', 'entity', 'entityId', 'actor', 'actorType', 'sourceService', 'details']
    const rows = filtered.map((l) => [
      l.createdAt,
      l.action,
      l.entity,
      l.entityId || '',
      l.actorDisplayName || '',
      l.actorType || '',
      l.sourceService || '',
      (l.details || '').replaceAll('"', '""'),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v ?? '')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black min-h-screen">
      <PageHeader
        title="Audit Logs"
        description="Centralized audit trail from audit service"
        action={{
          label: 'Refresh',
          onClick: loadLogs,
          icon: <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />,
        }}
      />

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, entity, actor, phone, id..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
              />
            </div>

            <Select value={filters.action} onValueChange={(v) => setFilters((p) => ({ ...p, action: v }))}>
              <SelectTrigger className="w-full lg:w-48 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.entity} onValueChange={(v) => setFilters((p) => ({ ...p, entity: v }))}>
              <SelectTrigger className="w-full lg:w-44 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityOptions.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.actorType} onValueChange={(v) => setFilters((p) => ({ ...p, actorType: v }))}>
              <SelectTrigger className="w-full lg:w-40 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Actor Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actor Types</SelectItem>
                {actorTypeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sourceService} onValueChange={(v) => setFilters((p) => ({ ...p, sourceService: v }))}>
              <SelectTrigger className="w-full lg:w-56 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Source Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {sourceServiceOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
              className="w-full lg:w-44 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
              className="w-full lg:w-44 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
            />
            <Button onClick={exportCsv} variant="outline">
              Export CSV
            </Button>
          </div>

          <DataTable
            data={filtered}
            columns={columns}
            pagination={{ pageSize: 15 }}
            emptyMessage="No audit logs found"
            loading={loading}
          />
        </CardContent>
      </Card>

      {selected && (
        <ViewDetailsDialog
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          title="Audit Log Details"
          subtitle={selected.action}
          badge={
            <Badge variant="outline" className="text-xs">
              {selected.entity}
            </Badge>
          }
          maxWidth="4xl"
          sections={[
            {
              title: 'Event',
              gridCols: 2,
              fields: [
                { label: 'Action', value: selected.action },
                { label: 'Entity', value: selected.entity },
                { label: 'Source Service', value: selected.sourceService || '—' },
                {
                  label: 'Timestamp',
                  value: selected.createdAt ? format(parseISO(selected.createdAt), 'PPpp') : '—',
                },
              ],
            },
            {
              title: 'Actor',
              gridCols: 2,
              fields: [
                { label: 'Display Name', value: selected.actorDisplayName || '—' },
                { label: 'Actor Type', value: selected.actorType || '—' },
                { label: 'First Name', value: selected.actorFirstName || '—' },
                { label: 'Last Name', value: selected.actorLastName || '—' },
                { label: 'Phone', value: selected.actorPhoneNumber || '—' },
              ],
            },
            {
              title: 'Done By',
              gridCols: 2,
              fields: [
                { label: 'First Name', value: selected.doneByFirstName || '—' },
                { label: 'Last Name', value: selected.doneByLastName || '—' },
                { label: 'Phone', value: selected.doneByPhoneNumber || '—' },
                { label: 'Role', value: selected.doneByRoleName || '—' },
              ],
            },
          ]}
        />
      )}
    </div>
  )
}

