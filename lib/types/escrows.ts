// Escrow types and interfaces

export enum EscrowStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

export interface EscrowTransaction {
  id: string
  clientId: string
  vendorId: string
  amount: number
  commissionPercentage: number
  commissionAmount: number
  vendorAmount: number
  status: EscrowStatus
  clientApproved: boolean
  vendorApproved: boolean
  description?: string
  createdAt: string
  updatedAt: string
  releasedAt?: string
  refundedAt?: string
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






