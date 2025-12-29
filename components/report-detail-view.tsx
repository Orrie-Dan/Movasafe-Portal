'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ReportDetailViewProps {
  reportId: string
  onUpdate?: () => void
  onClose?: () => void
  userRole?: string
}

export function ReportDetailView({ reportId, onUpdate, onClose, userRole }: ReportDetailViewProps) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    // TODO: Fetch report details
    setLoading(false)
  }, [reportId])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Report ID: {reportId}</p>
          <p className="mt-4">Report details will be displayed here.</p>
        </CardContent>
      </Card>
      {onClose && (
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      )}
    </div>
  )
}

