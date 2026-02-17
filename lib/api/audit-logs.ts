// External Audit Logs (audit.movasafe.com) API functions

import { getToken } from './auth'

// IMPORTANT:
// - Calling https://audit.movasafe.com directly from the browser can fail due to CORS.
// - Default to a same-origin proxy path (`/audit-proxy`) which is configured in `vite.config.ts`.
// - In production, configure your reverse proxy to forward `/audit-proxy/*` to https://audit.movasafe.com/*
const AUDIT_BASE_URL =
  typeof process !== 'undefined' &&
  (process.env as any)?.NEXT_PUBLIC_AUDIT_API_URL &&
  String((process.env as any).NEXT_PUBLIC_AUDIT_API_URL).trim() !== ''
    ? String((process.env as any).NEXT_PUBLIC_AUDIT_API_URL).trim()
    : '/audit-proxy'

export type AuditLogActorType = 'USER' | 'ADMIN' | 'SYSTEM' | string

export interface ExternalAuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  actorId: string | null
  actorType: AuditLogActorType | null
  actorDisplayName: string | null
  actorFirstName: string | null
  actorLastName: string | null
  actorPhoneNumber: string | null
  actorRoles: string[] | null
  doneByFirstName: string | null
  doneByLastName: string | null
  doneByPhoneNumber: string | null
  doneByRoleName: string | null
  sourceService: string | null
  details: string | null
  detailsJson: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export interface ExternalAuditLogsResponse {
  success: boolean
  message: string | null
  data: {
    content: ExternalAuditLog[]
    pageable?: any
    totalPages?: number
    totalElements?: number
    number?: number
    size?: number
  }
}

export type ExternalAuditLogsQuery = {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'ASC' | 'DESC' | string
}

function buildUrl(endpoint: string): string {
  // If AUDIT_BASE_URL is absolute, this yields an absolute URL.
  // If it's relative (e.g. '/audit-proxy'), keep it relative so same-origin proxy can work.
  if (AUDIT_BASE_URL.startsWith('http://') || AUDIT_BASE_URL.startsWith('https://')) {
    return `${AUDIT_BASE_URL}${endpoint}`
  }
  return `${AUDIT_BASE_URL}${endpoint}`
}

async function auditRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(endpoint)
  const token = getToken()
  const headers: Record<string, string> = {
    Accept: '*/*',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(url, { ...options, headers })
  } catch (err) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown'
    const hint =
      'Network error (often CORS, DNS, TLS, or server unreachable). If this is running in the browser, ensure the request is proxied via /audit-proxy in dev and via your production reverse proxy.'
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to fetch audit logs.\nURL: ${url}\nOrigin: ${origin}\nReason: ${detail}\nHint: ${hint}`)
  }

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || ''
    const raw = await res.text().catch(() => '')
    let bodyMsg = raw
    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(raw)
        bodyMsg = parsed?.message || parsed?.error || JSON.stringify(parsed)
      } catch {
        // keep raw
      }
    }
    throw new Error(
      `Audit API request failed.\nURL: ${url}\nStatus: ${res.status} ${res.statusText}\nBody: ${bodyMsg || '(empty)'}`
    )
  }

  try {
    return (await res.json()) as T
  } catch (err) {
    const raw = await res.text().catch(() => '')
    throw new Error(
      `Audit API returned a non-JSON response.\nURL: ${url}\nStatus: ${res.status} ${res.statusText}\nBody: ${raw || '(empty)'}`
    )
  }
}

export async function apiGetExternalAuditLogsAll(
  params?: ExternalAuditLogsQuery
): Promise<ExternalAuditLogsResponse> {
  const query = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      query.append(k, String(v))
    })
  }
  const qs = query.toString()
  return auditRequest<ExternalAuditLogsResponse>(`/api/audit-logs/all${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  })
}

