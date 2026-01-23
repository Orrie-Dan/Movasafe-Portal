import React from 'react'
import { Transaction, TransactionType, TransactionStatus } from '@/lib/api'
import { ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react'

/* =========================
   STATUS BADGE
========================= */
export function getTransactionStatusBadge(
  status: TransactionStatus | string
): string {
  switch (status) {
    case TransactionStatus.SUCCESSFUL:
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case TransactionStatus.PENDING:
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case TransactionStatus.FAILED:
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    case TransactionStatus.ROLLED_BACK:
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    case TransactionStatus.CANCELLED:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}

/* =========================
   TYPE ICON
========================= */
export function getTransactionTypeIcon(
  type: TransactionType | string
): React.ReactNode {
  switch (type) {
    case TransactionType.CASH_IN:
      return <ArrowDownRight className="h-4 w-4 text-green-400" />
    case TransactionType.CASH_OUT:
      return <ArrowUpRight className="h-4 w-4 text-red-400" />
    default:
      return <FileText className="h-4 w-4 text-slate-400" />
  }
}

/* =========================
   SAFE CURRENCY FORMATTER
========================= */
export function formatCurrency(
  amount?: number | null,
  currency: string = 'RWF'
): string {
  // 🚨 Guard against undefined / null / NaN
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${currency}`
  }

  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} ${currency}`
}

/* =========================
   FAILURE CATEGORY
========================= */
export interface FailureInfo {
  category: string
  retryEligible: boolean
}

export function getFailureCategory(
  status: TransactionStatus,
  description?: string
): FailureInfo {
  if (status !== TransactionStatus.FAILED) {
    return { category: 'N/A', retryEligible: false }
  }

  const desc = (description || '').toLowerCase()

  if (desc.includes('insufficient') || desc.includes('balance')) {
    return { category: 'Insufficient Funds', retryEligible: false }
  }

  if (desc.includes('timeout') || desc.includes('network')) {
    return { category: 'Network Error', retryEligible: true }
  }

  if (desc.includes('invalid') || desc.includes('validation')) {
    return { category: 'Validation Error', retryEligible: false }
  }

  if (desc.includes('provider') || desc.includes('gateway')) {
    return { category: 'Provider Error', retryEligible: true }
  }

  return { category: 'Unknown Error', retryEligible: true }
}

/* =========================
   RELATED FAILURES
========================= */
export function getRelatedFailures(
  transaction: Transaction,
  allTransactions: Transaction[]
): Transaction[] {
  if (transaction.status !== TransactionStatus.FAILED) return []

  return allTransactions
    .filter((t) => {
      if (t.id === transaction.id) return false
      if (t.status !== TransactionStatus.FAILED) return false

      if (t.userId === transaction.userId) return true

      if (t.description && transaction.description) {
        const keyword = transaction.description.toLowerCase().split(' ')[0]
        return t.description.toLowerCase().includes(keyword)
      }

      return false
    })
    .slice(0, 5)
}

/* =========================
   CHANNEL NAME
========================= */
export function getChannelName(description?: string): string {
  if (!description) return 'Wallet'

  const desc = description.toUpperCase()

  if (desc.includes('ESCROW')) return 'Escrow'
  if (desc.includes('MOBILE')) return 'Mobile Money'
  if (desc.includes('BANK')) return 'Bank Transfer'

  return 'Wallet'
}
