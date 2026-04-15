'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { API_CONFIG } from '@/lib/config/api'
import { getToken } from '@/lib/auth'

type ProvisionRole = 'SUPPORT_AGENT' | 'PLATFORM_ADMIN'

type ProvisionEnvelope = {
  success?: boolean
  message?: string | null
  data?: unknown
  error?: string
}

export default function TrustUserManagementPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProvisionRole>('SUPPORT_AGENT')
  const [reasonCode, setReasonCode] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [ticketReference, setTicketReference] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const url = useMemo(
    () => `${API_CONFIG.AUTH.baseUrl}/api/auth/users/portal/privileged/provision`,
    []
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const submittedRoleRaw = String(formData.get('targetRole') || role).trim().toUpperCase()
    const submittedRole: ProvisionRole =
      submittedRoleRaw === 'PLATFORM_ADMIN' ? 'PLATFORM_ADMIN' : 'SUPPORT_AGENT'

    const token = getToken()
    if (!token) {
      setLoading(false)
      setError('No authentication token found. Please sign in again.')
      return
    }

    const payload = {
      email: email.trim(),
      targetRole: submittedRole,
      reasonCode: reasonCode.trim(),
      reasonDetail: reasonDetail.trim() || undefined,
      ticketReference: ticketReference.trim() || undefined,
      validUntil: validUntil || undefined,
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      let result: ProvisionEnvelope | null = null
      try {
        result = text ? (JSON.parse(text) as ProvisionEnvelope) : null
      } catch {
        result = null
      }

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
            result?.error ||
            text ||
            'Failed to provision privileged user'
        )
      }

      setSuccess('Invite sent. User must activate account.')
      setEmail('')
      setRole('SUPPORT_AGENT')
      setReasonCode('')
      setReasonDetail('')
      setTicketReference('')
      setValidUntil('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision privileged user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Trust User Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Provision SUPPORT_AGENT and PLATFORM_ADMIN users.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto w-full bg-black border-slate-800">
        <CardHeader>
          <CardTitle>Create Privileged User</CardTitle>
          <CardDescription>
            TRUST_ADMIN can provision SUPPORT_AGENT and PLATFORM_ADMIN only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="user@example.com"
                className="bg-black border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="targetRole"
                value={role}
                onChange={(e) => setRole(e.target.value as ProvisionRole)}
                disabled={loading}
                className="w-full h-10 rounded-md border border-slate-700 bg-black px-3 text-sm text-white"
              >
                <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonCode">Reason Code</Label>
              <Input
                id="reasonCode"
                type="text"
                required
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                disabled={loading}
                placeholder="ACCESS_JUSTIFICATION"
                className="bg-black border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonDetail">Reason Detail (optional)</Label>
              <Textarea
                id="reasonDetail"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                disabled={loading}
                placeholder="Additional details"
                className="bg-black border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketReference">Ticket Reference (optional)</Label>
              <Input
                id="ticketReference"
                type="text"
                value={ticketReference}
                onChange={(e) => setTicketReference(e.target.value)}
                disabled={loading}
                placeholder="JIRA-1234"
                className="bg-black border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until (optional)</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={loading}
                className="bg-black border-slate-700 text-white"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-500">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Provision User'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

