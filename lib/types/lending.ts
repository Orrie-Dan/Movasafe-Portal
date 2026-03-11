// Lending (Loan) Service types

export type LoanStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'OFFERED'
  | 'EXPIRED'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'PAID'
  | 'DEFAULTED'
  | 'CANCELLED'

export type RepaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'

export interface LoanResponse {
  id: string
  userId: string
  reference?: string
  firstName?: string
  lastName?: string
  principal: number
  interestRate: number
  totalPayable: number
  status: LoanStatus
  disbursedAt: string | null
  dueDate: string | null
  createdAt: string
  currency: string
  termDays: number
  totalPaid: number | null
  lastPaymentAt: string | null
  interestAmount: number
  offeredAt: string | null
  offerExpiresAt: string | null
}

export interface RepaymentScheduleItem {
  id: string
  loanId: string
  amountDue: number
  amountPaid: number
  dueDate: string
  paidAt: string | null
  status: RepaymentStatus
  sequence: number
}

export interface RepaymentHistoryItem {
  id: string
  amount: number
  paidAt: string
}

export interface LoanLimitResponse {
  userId: string
  currentLimit: number
  maxLimit: number
}

export interface CreditScoreResponse {
  score: number
  riskLevel: string
  recommendedLimit: number
  approval: boolean
  breakdown?: string
}

export interface ApproveLoanRequest {
  approvalNotes?: string
  interestRate?: number
}

export interface RejectLoanRequest {
  rejectionReason?: string
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
}

export interface AdminLoanListParams {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'ASC' | 'DESC'
  status?: LoanStatus
  userId?: string
}
