'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ActionButton } from '@/components/admin/ActionButton'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { Plus, Trash2, Key } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

// Placeholder API key type - replace with actual type from API
interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
  expiresAt?: string
  lastUsed?: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; key: ApiKey | null }>({
    open: false,
    key: null,
  })

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await apiGetApiKeys()
      // setApiKeys(response.data)
      setApiKeys([])
    } catch (error) {
      console.error('Failed to load API keys:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load API keys',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.key) return

    try {
      // TODO: Replace with actual API call
      // await apiDeleteApiKey(deleteDialog.key.id)
      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      })
      loadApiKeys()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete API key',
        variant: 'destructive',
      })
    }
  }

  const columns: Column<ApiKey>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: (key) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-white">{key.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'key',
      header: 'API Key',
      accessor: (key) => (
        <code className="text-sm text-slate-300 bg-slate-800 px-2 py-1 rounded">
          {key.key.substring(0, 20)}...
        </code>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      accessor: (key) => (
        <span className="text-slate-300">{key.permissions.length} permissions</span>
      ),
    },
    {
      key: 'lastUsed',
      header: 'Last Used',
      accessor: (key) => (
        <span className="text-slate-400">
          {key.lastUsed ? format(new Date(key.lastUsed), 'MMM d, yyyy') : 'Never'}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      accessor: (key) => (
        <span className="text-slate-400">
          {key.expiresAt ? format(new Date(key.expiresAt), 'MMM d, yyyy') : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (key) => (
        <ActionButton
          permission={PERMISSIONS.DELETE_API_KEY}
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            setDeleteDialog({ open: true, key })
          }}
          className="h-8 w-8 text-red-400 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </ActionButton>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-900/50">
      <PageHeader
        title="API Keys"
        description="Manage API keys for external integrations"
        action={{
          label: 'Create API Key',
          onClick: () => {
            // TODO: Navigate to create page or open dialog
            toast({
              title: 'Coming Soon',
              description: 'API key creation will be available soon',
            })
          },
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />

      <Card className="bg-black border-slate-800">
        <CardContent className="p-6">
          <DataTable
            data={apiKeys}
            columns={columns}
            searchable
            searchPlaceholder="Search API keys..."
            pagination={{ pageSize: 25 }}
            emptyMessage="No API keys found"
            loading={loading}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, key: deleteDialog.key })}
        title="Delete API Key"
        description={`Are you sure you want to delete ${deleteDialog.key?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

