// Transaction types and interfaces

export enum TransactionType {
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
  CANCELLED = 'CANCELLED',
}

export enum TransactionDescription {
  SAVINGS = 'SAVINGS',
  REWARD = 'REWARD',
  WALLET_TRANSFER = 'WALLET_TRANSFER',
  ESCROW_PAYMENT = 'ESCROW_PAYMENT',
  ESCROW_COMMISSION = 'ESCROW_COMMISSION',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  BILL_PAYMENT = 'BILL_PAYMENT',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  transactionType: TransactionType
  status: TransactionStatus
  description: TransactionDescription | string
  commissionAmount?: number
  commissionPercentage?: number
  vendorAmount?: number
  currency: string
  fromDetails?: Record<string, any>
  toDetails?: Record<string, any>
  counterpartyUserId?: string
  initiatorConfirmed?: boolean
  receiverConfirmed?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTransferDTO {
  toUserId: string
  amount: number
  description?: string
  transactionPin?: string
}

export interface CreateEscrowPaymentDTO {
  vendorId: string
  amount: number
  description?: string
  transactionPin?: string
}

export interface TransactionFilters {
  userId?: string
  transactionType?: TransactionType
  status?: TransactionStatus
  description?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface TransactionResponse {
  success: boolean
  data: Transaction | Transaction[]
  message?: string
}






