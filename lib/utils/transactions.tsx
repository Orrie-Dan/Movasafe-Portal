import { Transaction, TransactionType, TransactionStatus } from '@/lib/api'
import { ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react'

export function getTransactionStatusBadge(status: TransactionStatus | string): string {
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

export function getTransactionTypeIcon(type: TransactionType | string): JSX.Element {
  switch (type) {
    case TransactionType.CASH_IN:
      return <ArrowDownRight className="h-4 w-4 text-green-400" />
    case TransactionType.CASH_OUT:
      return <ArrowUpRight className="h-4 w-4 text-red-400" />
    default:
      return <FileText className="h-4 w-4 text-slate-400" />
  }
}

export function formatCurrency(amount: number, currency: string = 'RWF'): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${currency}`
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ${currency}`
  return `${amount.toFixed(2)} ${currency}`
}

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

export function getRelatedFailures(
  transaction: Transaction,
  allTransactions: Transaction[]
): Transaction[] {
  if (transaction.status !== TransactionStatus.FAILED) return []

  return allTransactions
    .filter(
      (t) =>
        t.id !== transaction.id &&
        t.status === TransactionStatus.FAILED &&
        (t.userId === transaction.userId ||
          (t.description &&
            transaction.description &&
            t.description
              .toLowerCase()
              .includes(transaction.description.toLowerCase().split(' ')[0])))
    )
    .slice(0, 5)
}

export function getChannelName(description?: string): string {
  if (!description) return 'Wallet'
  if (description.includes('ESCROW')) return 'Escrow'
  if (description.includes('MOBILE')) return 'Mobile Money'
  if (description.includes('BANK')) return 'Bank Transfer'
  return 'Wallet'
}


