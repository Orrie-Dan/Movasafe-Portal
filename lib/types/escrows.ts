// Escrow types and interfaces

export enum EscrowStatus {
  ACTIVE = 'ACTIVE',
  DISPUTED = 'DISPUTED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

export interface EscrowTransaction {
  id: string
  escrowId?: string // Alias for id
  clientId: string
  vendorId: string
  amount: number
  escrowAmount?: number // Alias for amount
  commissionPercentage: number
  commissionAmount: number
  vendorAmount: number
  status: EscrowStatus
  escrowStatus?: EscrowStatus // Alias for status
  clientApproved: boolean
  vendorApproved: boolean
  description?: string
  createdAt: string
  updatedAt: string
  releasedAt?: string
  refundedAt?: string
  // Dispute-related fields (from GET /api/admin/escrows/disputed)
  disputedAt?: string
  disputeResolvedAt?: string | null
  disputeResolvedBy?: string | null
  disputeResolutionNotes?: string | null
  resolutionAction?: 'RELEASE' | 'REFUND' | null
  // Optional display fields
  clientName?: string
  vendorName?: string
}

export interface CreateEscrowDTO {
  vendorId: string
  amount: number
  description?: string
  transactionPin?: string
}

export interface EscrowResponse {
  success: boolean
  data: EscrowTransaction | EscrowTransaction[]
  message?: string
}

export interface EscrowFilters {
  clientId?: string
  vendorId?: string
  status?: EscrowStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}






