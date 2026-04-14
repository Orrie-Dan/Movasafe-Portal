export type FraudSignal =
  | 'HIGH_VALUE'
  | 'HIGH_FREQUENCY_WINDOW'
  | 'LARGE_BALANCE_DROP'
  | 'POST_AUTH_ANOMALY'
  | string

export interface FraudReviewMetadata {
  fraudReviewedBy?: string | null
  fraudReviewedAt?: string | null
  fraudReviewNotes?: string | null
}

export interface FraudTransaction {
  id: string
  status: string
  description?: string | null
  internalReference?: string | null
  amount?: number | null
  currency?: string | null
  createdAt?: string
  updatedAt?: string

  // Sender / recipient details (best-effort; depends on backend payload)
  fromDetails?: {
    accountNumber?: string | null
    accountName?: string | null
    currency?: string | null
    ownerName?: string | null
    ownerPhoneNumber?: string | null
    ownerEmail?: string | null
  } | null
  toDetails?: {
    accountNumber?: string | null
    accountName?: string | null
    currency?: string | null
    ownerName?: string | null
    ownerPhoneNumber?: string | null
    ownerEmail?: string | null
  } | null

  fraudSignals?: string | null
  fraudReviewReason?: string | null
  pendingTransferData?: unknown

  // Review metadata
  fraudReviewedBy?: string | null
  fraudReviewedAt?: string | null
  fraudReviewNotes?: string | null
}

export interface FraudReviewStats {
  pendingReviewsCount: number
  approvedCount: number
  rejectedCount: number
  totalReviewed: number
}

export interface FraudReviewListResponse {
  content: FraudTransaction[]
  totalElements?: number
  totalPages?: number
  size?: number
  number?: number
}

