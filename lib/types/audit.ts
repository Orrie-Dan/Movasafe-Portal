// Audit log types

export interface AuditLog {
  id: string
  userId: string
  username?: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  resourceType?: string
  ipAddress?: string
  userAgent?: string
  requestMethod?: string
  requestUrl?: string
  requestBody?: Record<string, any>
  responseStatus?: number
  status: 'success' | 'failure' | 'error'
  errorMessage?: string
  duration?: number
  metadata?: Record<string, any>
  timestamp: string
}

export interface AuditLogFilters {
  page?: number
  limit?: number
  userId?: string
  action?: string
  resource?: string
  resourceId?: string
  status?: 'success' | 'failure' | 'error'
  startDate?: string
  endDate?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface AuditLogListResponse {
  data: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuditLogStats {
  total: number
  byAction: Record<string, number>
  byResource: Record<string, number>
  byStatus: Record<string, number>
  byUser: Record<string, number>
  timeRange: {
    start: string
    end: string
  }
}

export interface ComplianceReport {
  id: string
  type: 'gdpr' | 'audit' | 'security' | 'data_retention'
  period: {
    start: string
    end: string
  }
  generatedAt: string
  generatedBy: string
  data: Record<string, any>
  summary: {
    totalEvents: number
    criticalEvents: number
    complianceScore: number
  }
}

