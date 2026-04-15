const SUPPORT_AGENT_ALLOWED_LABELS = new Set([
  'Overview',
  'Analytics',
  'Transactions',
  'System Settings',
])
const PLATFORM_ADMIN_ALLOWED_LABELS = new Set([
  'Transactions',
  'Refund & Disputes',
  'Risk & Fraud Management',
  'Live Alerts',
])

function normalizePortalRole(role: string | undefined): 'TRUST_ADMIN' | 'SUPPORT_AGENT' | 'PLATFORM_ADMIN' | '' {
  const normalizedRole = String(role || '').trim().toUpperCase()
  if (normalizedRole.includes('TRUST_ADMIN')) return 'TRUST_ADMIN'
  if (normalizedRole.includes('SUPPORT_AGENT')) return 'SUPPORT_AGENT'
  if (normalizedRole.includes('PLATFORM_ADMIN')) return 'PLATFORM_ADMIN'
  return ''
}

export function canSeeMenuLabelByRole(role: string | undefined, label: string): boolean {
  const normalizedRole = normalizePortalRole(role)
  if (normalizedRole === 'TRUST_ADMIN') return true
  if (normalizedRole === 'SUPPORT_AGENT') return SUPPORT_AGENT_ALLOWED_LABELS.has(label)
  if (normalizedRole === 'PLATFORM_ADMIN') return PLATFORM_ADMIN_ALLOWED_LABELS.has(label)
  return false
}

export function canAccessPathByRole(role: string | undefined, pathname: string): boolean {
  const normalizedRole = normalizePortalRole(role)
  if (normalizedRole === 'TRUST_ADMIN') return true
  const allowedPrefixes =
    normalizedRole === 'SUPPORT_AGENT'
      ? ['/admin', '/admin/analytics', '/admin/transactions', '/admin/settings']
      : normalizedRole === 'PLATFORM_ADMIN'
        ? ['/admin/transactions', '/admin/refund-disputes', '/admin/risk-fraud', '/admin/alerts']
        : []

  return allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function getDefaultPathByRole(role: string | undefined): string {
  const normalizedRole = normalizePortalRole(role)
  if (normalizedRole === 'TRUST_ADMIN') return '/admin'
  if (normalizedRole === 'SUPPORT_AGENT') return '/admin'
  if (normalizedRole === 'PLATFORM_ADMIN') return '/admin/transactions'
  return '/admin'
}

