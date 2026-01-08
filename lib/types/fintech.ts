// Fintech-specific types and interfaces
// These extend existing types for fintech wallet admin features

export interface FraudAlert {
  id: string
  type: 'transaction' | 'user' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  transactionId?: string
  userId?: string
  createdAt: string
  resolvedAt?: string
  status: 'active' | 'resolved' | 'false_positive'
}

export interface KYCStatus {
  userId: string
  status: 'pending' | 'verified' | 'rejected' | 'expired'
  documents: KYCDocument[]
  submittedAt: string
  verifiedAt?: string
  rejectedReason?: string
}

export interface KYCDocument {
  id: string
  type: 'id' | 'proof_of_address' | 'selfie' | 'other'
  url: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  reviewedBy?: string
}

export interface SupportTicket {
  id: string
  userId: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  slaDeadline?: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  relatedTransactionId?: string
}

export interface SystemHealth {
  service: string
  status: 'operational' | 'degraded' | 'down'
  uptime: number // percentage
  responseTime: number // ms
  errorRate: number // percentage
  lastChecked: string
}

export interface RevenueMetrics {
  totalRevenue: number
  transactionVolume: number
  commissionEarned: number
  period: 'today' | 'week' | 'month' | 'quarter' | 'year'
  trend: number // percentage change
}

// Extended transaction type with fintech fields
export interface FintechTransaction {
  id: string
  userId: string
  amount: number
  transactionType: string
  status: string
  description?: string
  commissionAmount?: number
  currency: string
  createdAt: string
  updatedAt: string
  // Fintech extensions
  riskScore?: number // 0-100
  fraudFlagged?: boolean
  kycRequired?: boolean
  retryCount?: number
  reversedAt?: string
  refundedAt?: string
}

// Extended user type with fintech fields
export interface FintechUser {
  id: string
  email: string
  fullName: string
  role: string
  status: string
  // Fintech extensions
  kycStatus?: 'pending' | 'verified' | 'rejected' | 'expired'
  kycVerifiedAt?: string
  riskLevel?: 'low' | 'medium' | 'high'
  walletId?: string
  walletBalance?: number
}

// Extended wallet type with fintech fields
export interface FintechWallet {
  id: string
  userId: string
  walletBalance: number
  reservedBalance: number
  savingsBalance: number
  availableBalance: number
  currency: string
  createdAt: string
  updatedAt: string
  // Fintech extensions
  frozen?: boolean
  frozenAt?: string
  frozenBy?: string
  frozenReason?: string
}

