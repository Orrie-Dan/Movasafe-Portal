'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function HeatmapView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap View</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Heatmap visualization will be displayed here.</p>
      </CardContent>
    </Card>
  )
}

