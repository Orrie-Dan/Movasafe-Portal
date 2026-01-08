'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Eye, Download, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { KYCStatus } from '@/lib/types/fintech'
import { DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

// Mock data - replace with actual API calls
const mockKYCStatuses: (KYCStatus & { userId: string; userName: string; email: string })[] = [
  {
    userId: 'user_123',
    userName: 'John Doe',
    email: 'john@example.com',
    status: 'pending',
    documents: [
      {
        id: 'doc_1',
        type: 'id',
        url: '/documents/doc_1.pdf',
        status: 'pending',
      },
    ],
    submittedAt: new Date().toISOString(),
  },
]

export default function ComplianceKYCPage() {
  const [loading, setLoading] = useState(true)
  const [kycStatuses, setKycStatuses] = useState(mockKYCStatuses)
  const [selectedKYC, setSelectedKYC] = useState<(typeof mockKYCStatuses)[0] | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<{ kyc: typeof mockKYCStatuses[0]; doc: any } | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isDocumentOpen, setIsDocumentOpen] = useState(false)
  const [reviewNote, setReviewNote] = useState('')

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchData = async () => {
    //   const data = await apiGetKYCStatuses()
    //   setKycStatuses(data)
    //   setLoading(false)
    // }
    // fetchData()
    setLoading(false)
  }, [])

  const getKYCStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'expired':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  }

  const handleApproveDocument = async (docId: string) => {
    try {
      // TODO: Replace with actual API call
      // await apiApproveKYCDocument(selectedDocument!.kyc.userId, docId, reviewNote)
      toast({
        title: 'Success',
        description: 'Document approved successfully',
      })
      setSelectedDocument(null)
      setIsDocumentOpen(false)
      setReviewNote('')
      // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve document',
        variant: 'destructive',
      })
    }
  }

  const handleRejectDocument = async (docId: string) => {
    try {
      // TODO: Replace with actual API call
      // await apiRejectKYCDocument(selectedDocument!.kyc.userId, docId, reviewNote)
      toast({
        title: 'Success',
        description: 'Document rejected',
      })
      setSelectedDocument(null)
      setIsDocumentOpen(false)
      setReviewNote('')
      // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject document',
        variant: 'destructive',
      })
    }
  }

  const handleExport = () => {
    // TODO: Implement CSV/PDF export
    toast({
      title: 'Export',
      description: 'Export functionality will be implemented',
    })
  }

  const columns: Column<typeof mockKYCStatuses[0]>[] = [
    {
      key: 'userName',
      header: 'User',
      accessor: (kyc) => (
        <div>
          <div className="font-medium text-foreground">{kyc.userName}</div>
          <div className="text-sm text-muted-foreground">{kyc.email}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'KYC Status',
      accessor: (kyc) => (
        <Badge className={getKYCStatusBadge(kyc.status)}>
          {kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      accessor: (kyc) => (
        <span className="text-muted-foreground">
          {new Date(kyc.submittedAt).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'documents',
      header: 'Documents',
      accessor: (kyc) => (
        <span className="text-muted-foreground">{kyc.documents.length} document(s)</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (kyc) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedKYC(kyc)
              setIsReviewOpen(true)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            Compliance & KYC
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Manage KYC verification and compliance status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV/PDF
        </Button>
      </div>

      {/* KYC Status Table */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">KYC Status</CardTitle>
          <CardDescription className="z-10 relative">User KYC verification status and documents</CardDescription>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <DataTable
              data={kycStatuses}
              columns={columns}
              searchable
              searchPlaceholder="Search users..."
              pagination={{ pageSize: 25 }}
              emptyMessage="No KYC records found"
            />
          )}
        </CardContent>
      </Card>

      {/* Document Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {selectedKYC && (
            <>
              <DialogHeader>
                <DialogTitle>KYC Document Review</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Review KYC documents for {selectedKYC.userName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-slate-400">Status</label>
                  <div className="mt-1">
                    <Badge className={getKYCStatusBadge(selectedKYC.status)}>
                      {selectedKYC.status.charAt(0).toUpperCase() + selectedKYC.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Documents</label>
                  <div className="mt-2 space-y-2">
                    {selectedKYC.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">{doc.type}</span>
                          <Badge
                            className={
                              doc.status === 'approved'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : doc.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument({ kyc: selectedKYC, doc })
                            setIsDocumentOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Review Modal */}
      <Dialog open={isDocumentOpen} onOpenChange={setIsDocumentOpen}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-white">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>Document Review</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedDocument.doc.type} - {selectedDocument.kyc.userName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded p-4 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Document Preview</p>
                    <p className="text-xs text-slate-500 mt-2">URL: {selectedDocument.doc.url}</p>
                    {/* In production, this would show an image or PDF viewer */}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Review Notes</Label>
                  <Textarea
                    placeholder="Add notes about this document..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="mt-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground"
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDocumentOpen(false)
                      setReviewNote('')
                    }}
                    className="border-slate-200 dark:border-slate-700 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectDocument(selectedDocument.doc.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproveDocument(selectedDocument.doc.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AML Alerts */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            AML Flagged Transactions
          </CardTitle>
          <CardDescription className="z-10 relative">Transactions flagged for AML review</CardDescription>
        </div>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
            <p>No AML flagged transactions</p>
            <p className="text-xs text-muted-foreground mt-2">AML monitoring is active</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

