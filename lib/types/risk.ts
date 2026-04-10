export type RiskSeverity = 'critical' | 'medium' | 'low'

export interface RiskAlert {
  id: string
  severity: RiskSeverity
  title: string
  description: string
  userId?: string
  accountAgeDays?: number
  amount?: number
  location?: string
  createdAt: string
  elapsedMinutes: number
  status: 'open' | 'acknowledged' | 'resolved'
  actions: Array<'review' | 'freeze' | 'dismiss' | 'escalate'>
}

export interface RiskUser {
  userId: string
  maskedDisplayName: string
  riskScore: number
  status: 'frozen' | 'under_review' | 'monitoring' | 'active'
  flags: string[]
  totalTransactionValueToday: number
  lastTransactionAt?: string
  assignedAnalyst?: string
}

export interface RiskCase {
  caseId: string
  userId: string
  alertTypes: string[]
  riskScore: number
  createdAt: string
  assignedAnalyst?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'escalated' | 'closed'
}

export type SlaState = 'within_target' | 'approaching_breach' | 'breach'

export type RiskActionType = 'block' | 'flag' | 'approve' | 'freeze' | 'escalate' | 'dismiss'

export interface RiskAuditPayload {
  actionType: RiskActionType
  targetType: 'transaction' | 'user' | 'case'
  targetId: string
  reasonCode: string
  reasonText: string
  beforeState?: Record<string, unknown>
  afterState?: Record<string, unknown>
  metadata?: Record<string, unknown>
}
