'use client'

import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, FileText, Image, Download, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DataManagementPage() {
  const router = useRouter()

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-900/50">
      <PageHeader
        title="Data Management"
        description="Manage system data, transactions, and media"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          onClick={() => router.push('/admin/data/transactions')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Manage transaction data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm">
              View, filter, and manage all system transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          onClick={() => router.push('/admin/data/media')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Image className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle>Media Library</CardTitle>
                <CardDescription>Manage uploaded media files</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm">
              Organize and manage all media assets
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black border-slate-800">
        <CardHeader>
          <CardTitle>Data Operations</CardTitle>
          <CardDescription>Import, export, and archive data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="border-slate-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          <p className="text-slate-400 text-sm">
            Data import/export functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

