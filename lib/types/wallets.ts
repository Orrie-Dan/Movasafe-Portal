// Wallet types and interfaces

export interface Wallet {
  id: string
  userId: string
  walletBalance: number
  reservedBalance: number
  savingsBalance: number
  availableBalance: number // Calculated: walletBalance - reservedBalance
  currency: string
  createdAt: string
  updatedAt: string
}

export interface CreateWalletAccountDTO {
  userId: string
  currency?: string
}

export interface WalletResponse {
  success: boolean
  data: Wallet | Wallet[]
  message?: string
}

export interface WalletFilters {
  userId?: string
  userType?: 'CLIENT' | 'VENDOR'
  minBalance?: number
  maxBalance?: number
  page?: number
  limit?: number
  offset?: number
}






