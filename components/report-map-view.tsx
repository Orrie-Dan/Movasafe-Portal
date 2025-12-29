'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ReportMapView() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Map View</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Map view will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}

