'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GraduationCap, CheckCircle2, XCircle } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiGetTrainingCompliance } from '@/lib/api'

interface TrainingComplianceProps {
  className?: string
}

export function TrainingCompliance({ className }: TrainingComplianceProps) {
  const [complianceData, setComplianceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompliance()
  }, [])

  const fetchCompliance = async () => {
    setLoading(true)
    try {
      const response = await apiGetTrainingCompliance()
      setComplianceData(response)
    } catch (error) {
      console.error('Failed to fetch training compliance:', error)
    } finally {
      setLoading(false)
    }
  }

  const overallCompliance = complianceData?.overallCompliance || 0
  const compliantWorkers = complianceData?.compliantWorkers || 0
  const nonCompliantWorkers = complianceData?.nonCompliantWorkers || 0
  const totalWorkers = compliantWorkers + nonCompliantWorkers
  const byTraining = complianceData?.byTraining || []

  const pieData = [
    { name: 'Compliant', value: compliantWorkers, color: '#10b981' },
    { name: 'Non-Compliant', value: nonCompliantWorkers, color: '#ef4444' },
  ]

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-400" />
              Training Compliance
            </CardTitle>
            <CardDescription className="text-slate-400">
              Worker training completion and compliance tracking
            </CardDescription>
          </div>
          <Badge className={
            overallCompliance >= 90 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
            overallCompliance >= 80 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
            'bg-red-500/20 text-red-400 border-red-500/50'
          }>
            {overallCompliance.toFixed(1)}% Compliant
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Overall Compliance</p>
            <p className={`text-2xl font-bold ${
              overallCompliance >= 90 ? 'text-green-400' :
              overallCompliance >= 80 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {overallCompliance.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Compliant</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {compliantWorkers}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Non-Compliant</p>
            <p className="text-2xl font-bold text-red-400 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              {nonCompliantWorkers}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Compliance Distribution */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Compliance Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Compliance by Training Type */}
            {byTraining.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Compliance by Training Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={byTraining}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="trainingType"
                      stroke="#9ca3af"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      domain={[0, 100]}
                      label={{ value: 'Compliance (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Compliance']}
                    />
                    <Bar dataKey="complianceRate" name="Compliance Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

