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
  AGENT_CASHOUT = 'AGENT_CASHOUT',
  WITHDRAW_SAVINGS = 'WITHDRAW_SAVINGS',
  MOMO_TRANSFER = 'MOMO_TRANSFER',
  SAVINGS_TRANSFER = 'SAVINGS_TRANSFER',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BILL_PAYMENT = 'BILL_PAYMENT',
  WALLET_TRANSFER = 'WALLET_TRANSFER',
  LOTTERY_PRIZE = 'LOTTERY_PRIZE',
  ACCIDENTAL_TRANSFER_ROLLBACK = 'ACCIDENTAL_TRANSFER_ROLLBACK',
  REFUND = 'REFUND',
  RECOVERY_DEBT = 'RECOVERY_DEBT',
  TRUST_ACCOUNT_DEPOSIT = 'TRUST_ACCOUNT_DEPOSIT',
  ESCROW_PAYMENT = 'ESCROW_PAYMENT',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  ESCROW_COMMISSION = 'ESCROW_COMMISSION',
  MOBILE_MONEY = 'MOBILE_MONEY',
}

export interface AccountDetails {
  accountName: string
  accountNumber: string
  accountSource: string
  ownerName?: string | null
  ownerPhoneNumber?: string | null
  ownerEmail?: string | null
  currency: string
  accountPin?: string | null
  version?: number | null
}

export interface Transaction {
  id: string
  userId: string
  counterpartyUserId?: string | null
  userName?: string | null
  userPhoneNumber?: string | null
  userNationalId?: string | null
  amount: number
  transactionType: TransactionType
  status: TransactionStatus
  chargeFee?: number | null
  description: TransactionDescription | string
  fromDetails?: AccountDetails | null
  toDetails?: AccountDetails | null
  originalBalance?: number | null
  internalReference: string
  transactionDetails?: any | null
  usedTrustAccount?: boolean | null
  createdAt: string
  updatedAt: string
  originalTrustAccountBalance?: number | null
  newTrustAccountBalance?: number | null
  totalTrustAccountBalance?: number | null
  initiatorConfirmed?: boolean | null
  receiverConfirmed?: boolean | null
  reservedAmount?: number | null
  // Legacy fields for backward compatibility
  commissionAmount?: number
  commissionPercentage?: number
  vendorAmount?: number
  currency?: string
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
  // Pagination
  page?: number
  limit?: number
  // Sorting
  sortBy?: string
  order?: 'ASC' | 'DESC'
  // User filters
  userName?: string
  userPhoneNumber?: string
  userNationalId?: string
  // Transaction filters
  transactionType?: TransactionType | string
  description?: string
  descriptions?: string[] // Array for multi-select
  status?: TransactionStatus | string
  transactionReference?: string
  // Amount filters
  minAmount?: number
  maxAmount?: number
  // Date filters
  startDate?: string // ISO date-time string
  endDate?: string // ISO date-time string
  // Legacy fields for backward compatibility
  userId?: string
  offset?: number
}

export interface TransactionResponse {
  success: boolean
  data: Transaction | Transaction[]
  message?: string
}

export interface PaginatedTransactionResponse {
  success: boolean
  message?: string | null
  data: {
    content: Transaction[]
    totalElements?: number
    totalPages?: number
    size?: number
    number?: number
  }
}






