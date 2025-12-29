'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiGetAttendanceMetrics } from '@/lib/api'

interface AttendanceMetricsProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function AttendanceMetrics({
  startDate,
  endDate,
  className,
}: AttendanceMetricsProps) {
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendance()
  }, [startDate, endDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await apiGetAttendanceMetrics({ startDate, endDate })
      setAttendanceData(response)
    } catch (error) {
      console.error('Failed to fetch attendance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const attendanceRate = attendanceData?.attendanceRate || 0
  const totalShifts = attendanceData?.totalShifts || 0
  const presentShifts = attendanceData?.presentShifts || 0
  const absentShifts = attendanceData?.absentShifts || 0
  const trendData = attendanceData?.trendData || []
  const byDepartment = attendanceData?.byDepartment || []

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Attendance Metrics
            </CardTitle>
            <CardDescription className="text-slate-400">
              Worker attendance and shift tracking
            </CardDescription>
          </div>
          <Badge className={
            attendanceRate >= 90 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
            attendanceRate >= 80 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
            'bg-red-500/20 text-red-400 border-red-500/50'
          }>
            {attendanceRate.toFixed(1)}% Rate
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400">Attendance Rate</p>
            <p className={`text-2xl font-bold ${
              attendanceRate >= 90 ? 'text-green-400' :
              attendanceRate >= 80 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {attendanceRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Shifts</p>
            <p className="text-2xl font-bold text-white">{totalShifts}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Present</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {presentShifts}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Absent</p>
            <p className="text-2xl font-bold text-red-400 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              {absentShifts}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Attendance Trend */}
            {trendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Attendance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="period"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      domain={[0, 100]}
                      label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance Rate']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Attendance Rate"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Attendance by Department */}
            {byDepartment.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Attendance by Department</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="department"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      domain={[0, 100]}
                      label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance Rate']}
                    />
                    <Bar dataKey="attendanceRate" name="Attendance Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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

