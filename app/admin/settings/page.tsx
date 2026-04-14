'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { 
  Settings, 
  Shield, 
  Mail, 
  Plug, 
  Flag,
  Key,
  Clock,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  Webhook,
  CreditCard,
  MessageSquare,
  Bell,
  Zap,
  Trash2,
  Pencil,
} from 'lucide-react'
import {
  apiListSystemSettings,
  apiCreateSystemSetting,
  apiUpdateSystemSetting,
  apiDeleteSystemSetting,
  type SystemSettingResponse,
  type SystemSettingDTO,
} from '@/lib/api/system-settings'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { apiEvictCache, apiGetFraudConfigEffective, apiUpdateFraudConfig } from '@/lib/api/fraud-config'

// Types
interface SecuritySettings {
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecial: boolean
  passwordExpiryDays: number
  mfaEnabled: boolean
  mfaRequired: boolean
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  lockoutDurationMinutes: number
}

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
  replyToEmail: string
}

interface Integration {
  id: string
  name: string
  description: string
  icon: any
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  apiKey?: string
}

interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'core' | 'beta' | 'experimental'
}

interface GeneralSystemSettings {
  escrowCommission: string
  centralAccountId: string
  revenueAccountId: string
  reserveAccountId: string
  escrowAccountId: string
  reversalWindowMinutes: string
  debtAutoCollectionRate: string
}

const SYSTEM_SETTING_KEYS = {
  ESCROW_COMMISSION: 'escrow_commission_percentage',
  CENTRAL_ACCOUNT: 'movasafe_central_account',
  REVENUE_ACCOUNT: 'movasafe_revenue_account',
  RESERVE_ACCOUNT: 'movasafe_reserve_account',
  ESCROW_ACCOUNT: 'movasafe_escrow_account',
  REVERSAL_WINDOW: 'transfer_reversal_window_minutes',
  DEBT_AUTO_RATE: 'debt_auto_collection_rate',
} as const

export default function SettingsPage() {
  // General Settings State (backed by system-settings API)
  const [generalSettings, setGeneralSettings] = useState<GeneralSystemSettings>({
    escrowCommission: '5.0',
    centralAccountId: '',
    revenueAccountId: '',
    reserveAccountId: '',
    escrowAccountId: '',
    reversalWindowMinutes: '30',
    debtAutoCollectionRate: '0.50',
  })
  const [systemSettings, setSystemSettings] = useState<SystemSettingResponse[]>([])
  const [systemLoading, setSystemLoading] = useState(false)
  const visibleSystemSettings = useMemo(
    () => systemSettings.filter((s) => !s.settingKey?.toLowerCase().startsWith('movasafe')),
    [systemSettings]
  )

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    passwordExpiryDays: 90,
    mfaEnabled: true,
    mfaRequired: false,
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  })

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: '',
    fromName: 'Movasafe',
    replyToEmail: '',
  })
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  // Integrations State
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'persona',
      name: 'Persona KYC',
      description: 'Identity verification and KYC compliance',
      icon: Shield,
      status: 'connected',
      lastSync: '2026-01-23T10:30:00Z',
      apiKey: 'pk_live_••••••••',
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      description: 'Payment processing and card management',
      icon: CreditCard,
      status: 'connected',
      lastSync: '2026-01-23T11:00:00Z',
      apiKey: 'sk_live_••••••••',
    },
    {
      id: 'twilio',
      name: 'Twilio SMS',
      description: 'SMS notifications and 2FA verification',
      icon: MessageSquare,
      status: 'disconnected',
    },
    {
      id: 'sendgrid',
      name: 'SendGrid Email',
      description: 'Transactional email delivery',
      icon: Mail,
      status: 'error',
      lastSync: '2026-01-22T15:45:00Z',
    },
    {
      id: 'firebase',
      name: 'Firebase Push',
      description: 'Push notifications for mobile apps',
      icon: Bell,
      status: 'connected',
      lastSync: '2026-01-23T09:15:00Z',
    },
    {
      id: 'webhook',
      name: 'Custom Webhooks',
      description: 'Custom webhook endpoints for events',
      icon: Webhook,
      status: 'connected',
    },
  ])

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    {
      id: 'escrow_v2',
      name: 'Escrow 2.0',
      description: 'Enhanced escrow system with multi-party support',
      enabled: true,
      category: 'core',
    },
    {
      id: 'instant_transfers',
      name: 'Instant Transfers',
      description: 'Enable instant wallet-to-wallet transfers',
      enabled: true,
      category: 'core',
    },
    {
      id: 'crypto_payments',
      name: 'Cryptocurrency Payments',
      description: 'Accept cryptocurrency for escrow transactions',
      enabled: false,
      category: 'beta',
    },
    {
      id: 'ai_fraud_detection',
      name: 'AI Fraud Detection',
      description: 'Machine learning-powered fraud detection system',
      enabled: true,
      category: 'beta',
    },
    {
      id: 'biometric_auth',
      name: 'Biometric Authentication',
      description: 'Face ID and fingerprint login support',
      enabled: false,
      category: 'experimental',
    },
    {
      id: 'smart_contracts',
      name: 'Smart Contract Escrows',
      description: 'Blockchain-based escrow smart contracts',
      enabled: false,
      category: 'experimental',
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics Dashboard',
      description: 'Enhanced analytics with AI-powered insights',
      enabled: true,
      category: 'beta',
    },
    {
      id: 'multi_currency',
      name: 'Multi-Currency Support',
      description: 'Support for multiple currencies and forex',
      enabled: true,
      category: 'core',
    },
  ])

  const [saving, setSaving] = useState(false)
  const [fraudConfigLoading, setFraudConfigLoading] = useState(false)
  const [fraudConfigSaving, setFraudConfigSaving] = useState(false)
  const [fraudConfig, setFraudConfig] = useState<Record<string, any> | null>(null)
  const [editingSystemSetting, setEditingSystemSetting] = useState<SystemSettingDTO>({
    settingKey: '',
    settingValue: '',
    description: '',
  })
  /** When set, we're editing this existing setting (key used for PUT URL). */
  const [editingOriginalKey, setEditingOriginalKey] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    key: string | null
  }>({ open: false, key: null })

  // Load system settings from backend on mount
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        setSystemLoading(true)
        const data = await apiListSystemSettings()
        setSystemSettings(data)

        const findValue = (key: string, fallback: string): string => {
          const found = data.find((s) => s.settingKey === key)
          return (found?.settingValue ?? fallback) || fallback
        }

        setGeneralSettings((prev) => ({
          ...prev,
          escrowCommission: findValue(SYSTEM_SETTING_KEYS.ESCROW_COMMISSION, prev.escrowCommission),
          centralAccountId: findValue(SYSTEM_SETTING_KEYS.CENTRAL_ACCOUNT, prev.centralAccountId),
          revenueAccountId: findValue(SYSTEM_SETTING_KEYS.REVENUE_ACCOUNT, prev.revenueAccountId),
          reserveAccountId: findValue(SYSTEM_SETTING_KEYS.RESERVE_ACCOUNT, prev.reserveAccountId),
          escrowAccountId: findValue(SYSTEM_SETTING_KEYS.ESCROW_ACCOUNT, prev.escrowAccountId),
          reversalWindowMinutes: findValue(SYSTEM_SETTING_KEYS.REVERSAL_WINDOW, prev.reversalWindowMinutes),
          debtAutoCollectionRate: findValue(SYSTEM_SETTING_KEYS.DEBT_AUTO_RATE, prev.debtAutoCollectionRate),
        }))
      } catch (error) {
        console.error('Failed to load system settings:', error)
        toast({
          title: 'Error loading system settings',
          description: error instanceof Error ? error.message : 'Unable to fetch system settings.',
          variant: 'destructive',
        })
      } finally {
        setSystemLoading(false)
      }
    }

    loadSystemSettings()
  }, [])

  useEffect(() => {
    const loadFraudConfig = async () => {
      try {
        setFraudConfigLoading(true)
        const cfg = await apiGetFraudConfigEffective()
        setFraudConfig(cfg)
      } catch (error) {
        console.error('Failed to load fraud config:', error)
        toast({
          title: 'Error loading fraud config',
          description: error instanceof Error ? error.message : 'Unable to fetch fraud configuration.',
          variant: 'destructive',
        })
        setFraudConfig(null)
      } finally {
        setFraudConfigLoading(false)
      }
    }

    loadFraudConfig()
  }, [])

  // Handlers
  const upsertSystemSetting = async (settingKey: string, settingValue: string, description?: string) => {
    const existing = systemSettings.find((s) => s.settingKey === settingKey)
    const payload = { settingKey, settingValue, description }

    if (existing) {
      const updated = await apiUpdateSystemSetting(settingKey, payload)
      setSystemSettings((prev) =>
        prev.map((s) => (s.settingKey === settingKey ? updated : s))
      )
    } else {
      const created = await apiCreateSystemSetting(payload)
      setSystemSettings((prev) => [...prev, created])
    }
  }

  const handleSaveGeneral = async () => {
    try {
      setSaving(true)

      await Promise.all([
        upsertSystemSetting(
          SYSTEM_SETTING_KEYS.ESCROW_COMMISSION,
          generalSettings.escrowCommission,
          'Default escrow commission percentage'
        ),
        upsertSystemSetting(
          SYSTEM_SETTING_KEYS.CENTRAL_ACCOUNT,
          generalSettings.centralAccountId,
          'Movasafe central account UUID'
        ),
        upsertSystemSetting(
          SYSTEM_SETTING_KEYS.REVENUE_ACCOUNT,
          generalSettings.revenueAccountId,
          'Movasafe revenue account UUID'
        ),
        upsertSystemSetting(
          SYSTEM_SETTING_KEYS.RESERVE_ACCOUNT,
          generalSettings.reserveAccountId,
          'Movasafe reserve account UUID'
        ),
        upsertSystemSetting(
          SYSTEM_SETTING_KEYS.ESCROW_ACCOUNT,
          generalSettings.escrowAccountId,
          'Movasafe escrow holding account UUID'
        ),
        upsertSystemSetting(
          SYSTEM_SETTING_KEYS.REVERSAL_WINDOW,
          generalSettings.reversalWindowMinutes,
          'Time window for reversible transfers (minutes)'
        ),
        upsertSystemSetting(
          SYSTEM_SETTING_KEYS.DEBT_AUTO_RATE,
          generalSettings.debtAutoCollectionRate,
          'Debt auto-collection rate (0.50 = 50%)'
        ),
      ])

      toast({
        title: 'System settings saved',
        description: 'Escrow and reversal settings have been updated successfully.',
      })
    } catch (error) {
      console.error('Failed to save system settings:', error)
      toast({
        title: 'Error saving system settings',
        description: error instanceof Error ? error.message : 'Unable to update system settings.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditSetting = (setting: SystemSettingResponse) => {
    setEditingSystemSetting({
      settingKey: setting.settingKey,
      settingValue: setting.settingValue,
      description: setting.description ?? '',
    })
    setEditingOriginalKey(setting.settingKey)
  }

  const handleCreateSetting = async () => {
    if (!editingSystemSetting.settingKey.trim() || !editingSystemSetting.settingValue.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Both key and value are required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const dto: SystemSettingDTO = {
        settingKey: editingSystemSetting.settingKey.trim(),
        settingValue: editingSystemSetting.settingValue.trim(),
        description: editingSystemSetting.description?.trim() || undefined,
      }
      const created = await apiCreateSystemSetting(dto)
      setSystemSettings((prev) => [...prev, created])
      toast({
        title: 'Setting created',
        description: `System setting "${dto.settingKey}" has been created.`,
      })
      setEditingSystemSetting({ settingKey: '', settingValue: '', description: '' })
      setEditingOriginalKey(null)
    } catch (error) {
      console.error('Failed to create system setting:', error)
      toast({
        title: 'Error creating setting',
        description: error instanceof Error ? error.message : 'Unable to create system setting.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSetting = async () => {
    if (!editingOriginalKey) return
    if (!editingSystemSetting.settingKey.trim() || !editingSystemSetting.settingValue.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Both key and value are required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const dto: SystemSettingDTO = {
        settingKey: editingSystemSetting.settingKey.trim(),
        settingValue: editingSystemSetting.settingValue.trim(),
        description: editingSystemSetting.description?.trim() || undefined,
      }
      const updated = await apiUpdateSystemSetting(editingOriginalKey, dto)
      setSystemSettings((prev) =>
        prev.map((s) => (s.settingKey === editingOriginalKey ? updated : s))
      )
      toast({
        title: 'Setting updated',
        description: `System setting "${dto.settingKey}" has been updated.`,
      })
      setEditingSystemSetting({ settingKey: '', settingValue: '', description: '' })
      setEditingOriginalKey(null)
    } catch (error) {
      console.error('Failed to update system setting:', error)
      toast({
        title: 'Error updating setting',
        description: error instanceof Error ? error.message : 'Unable to update system setting.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: 'Security Settings Saved',
      description: 'Security configuration has been updated.',
    })
    setSaving(false)
  }

  const handleSaveEmail = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: 'Email Settings Saved',
      description: 'Email configuration has been updated.',
    })
    setSaving(false)
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast({
      title: 'Test Email Sent',
      description: 'A test email has been sent to your configured address.',
    })
    setTestingEmail(false)
  }

  const handleToggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(int =>
        int.id === id
          ? { ...int, status: int.status === 'connected' ? 'disconnected' : 'connected' }
          : int
      )
    )
    toast({
      title: 'Integration Updated',
      description: 'Integration status has been changed.',
    })
  }

  const handleToggleFeature = (id: string) => {
    setFeatureFlags(prev =>
      prev.map(flag =>
        flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
      )
    )
    const flag = featureFlags.find(f => f.id === id)
    toast({
      title: flag?.enabled ? 'Feature Disabled' : 'Feature Enabled',
      description: `${flag?.name} has been ${flag?.enabled ? 'disabled' : 'enabled'}.`,
    })
  }

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>
      case 'disconnected':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Disconnected</Badge>
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>
    }
  }

  const getCategoryBadge = (category: FeatureFlag['category']) => {
    switch (category) {
      case 'core':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Core</Badge>
      case 'beta':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Beta</Badge>
      case 'experimental':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Experimental</Badge>
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      <PageHeader
        title="System Settings"
        description="Configure system-wide settings, security policies, and integrations"
      />

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
            {/* System Settings only */}
            <div className="mt-6 space-y-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Fraud Configuration</CardTitle>
                  <CardDescription>
                    Configure fraud thresholds and blocking behavior. Updates are applied via /admin/fraud-config.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fraudConfigLoading ? (
                    <div className="space-y-2">
                      <div className="h-10 w-full bg-slate-100 dark:bg-slate-900 rounded" />
                      <div className="h-10 w-full bg-slate-100 dark:bg-slate-900 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label>Blocking Enabled</Label>
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                            <div className="text-sm text-muted-foreground">Block transfers when signals trigger</div>
                            <Switch
                              checked={!!fraudConfig?.blockingEnabled}
                              onCheckedChange={async (checked) => {
                                try {
                                  setFraudConfigSaving(true)
                                  const updated = await apiUpdateFraudConfig('blockingEnabled', !!checked)
                                  setFraudConfig(updated)
                                  toast({ title: 'Saved', description: 'Blocking setting updated.' })
                                } catch (e) {
                                  toast({
                                    title: 'Save failed',
                                    description: e instanceof Error ? e.message : 'Unable to update blocking setting',
                                    variant: 'destructive',
                                  })
                                } finally {
                                  setFraudConfigSaving(false)
                                }
                              }}
                              disabled={fraudConfigSaving}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label>First Time Recipient Verification</Label>
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                            <div className="text-sm text-muted-foreground">Extra checks for new recipients</div>
                            <Switch
                              checked={!!fraudConfig?.firstTimeRecipientVerification}
                              onCheckedChange={async (checked) => {
                                try {
                                  setFraudConfigSaving(true)
                                  const updated = await apiUpdateFraudConfig('firstTimeRecipientVerification', !!checked)
                                  setFraudConfig(updated)
                                  toast({ title: 'Saved', description: 'Recipient verification updated.' })
                                } catch (e) {
                                  toast({
                                    title: 'Save failed',
                                    description: e instanceof Error ? e.message : 'Unable to update setting',
                                    variant: 'destructive',
                                  })
                                } finally {
                                  setFraudConfigSaving(false)
                                }
                              }}
                              disabled={fraudConfigSaving}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label>High value threshold</Label>
                          <Input
                            value={String(fraudConfig?.highValueThreshold ?? '')}
                            onChange={(e) => setFraudConfig((p) => ({ ...(p || {}), highValueThreshold: e.target.value }))}
                            placeholder="e.g. 1000000"
                            disabled={fraudConfigSaving}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={fraudConfigSaving}
                            onClick={async () => {
                              try {
                                setFraudConfigSaving(true)
                                const updated = await apiUpdateFraudConfig('highValueThreshold', Number(fraudConfig?.highValueThreshold))
                                setFraudConfig(updated)
                                toast({ title: 'Saved', description: 'High value threshold updated.' })
                              } catch (e) {
                                toast({
                                  title: 'Save failed',
                                  description: e instanceof Error ? e.message : 'Unable to update threshold',
                                  variant: 'destructive',
                                })
                              } finally {
                                setFraudConfigSaving(false)
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <Label>High frequency window (count)</Label>
                          <Input
                            value={String(fraudConfig?.highFrequencyCountThreshold ?? '')}
                            onChange={(e) => setFraudConfig((p) => ({ ...(p || {}), highFrequencyCountThreshold: e.target.value }))}
                            placeholder="e.g. 5"
                            disabled={fraudConfigSaving}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={fraudConfigSaving}
                            onClick={async () => {
                              try {
                                setFraudConfigSaving(true)
                                const updated = await apiUpdateFraudConfig('highFrequencyCountThreshold', Number(fraudConfig?.highFrequencyCountThreshold))
                                setFraudConfig(updated)
                                toast({ title: 'Saved', description: 'High frequency threshold updated.' })
                              } catch (e) {
                                toast({
                                  title: 'Save failed',
                                  description: e instanceof Error ? e.message : 'Unable to update threshold',
                                  variant: 'destructive',
                                })
                              } finally {
                                setFraudConfigSaving(false)
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <Label>Balance drop (%)</Label>
                          <Input
                            type="range"
                            min={0}
                            max={100}
                            value={Number(fraudConfig?.balanceDropPercentage ?? 0)}
                            onChange={(e) => setFraudConfig((p) => ({ ...(p || {}), balanceDropPercentage: Number(e.target.value) }))}
                            disabled={fraudConfigSaving}
                          />
                          <div className="text-xs text-muted-foreground">
                            Current: {Number(fraudConfig?.balanceDropPercentage ?? 0)}%
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={fraudConfigSaving}
                            onClick={async () => {
                              try {
                                setFraudConfigSaving(true)
                                const updated = await apiUpdateFraudConfig('balanceDropPercentage', Number(fraudConfig?.balanceDropPercentage ?? 0))
                                setFraudConfig(updated)
                                toast({ title: 'Saved', description: 'Balance drop percentage updated.' })
                              } catch (e) {
                                toast({
                                  title: 'Save failed',
                                  description: e instanceof Error ? e.message : 'Unable to update percentage',
                                  variant: 'destructive',
                                })
                              } finally {
                                setFraudConfigSaving(false)
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          disabled={fraudConfigSaving}
                          onClick={async () => {
                            try {
                              setFraudConfigSaving(true)
                              const cfg = await apiGetFraudConfigEffective()
                              setFraudConfig(cfg)
                              toast({ title: 'Refreshed', description: 'Fraud config reloaded.' })
                            } catch (e) {
                              toast({
                                title: 'Refresh failed',
                                description: e instanceof Error ? e.message : 'Unable to refresh config',
                                variant: 'destructive',
                              })
                            } finally {
                              setFraudConfigSaving(false)
                            }
                          }}
                        >
                          Refresh config
                        </Button>
                        <Button
                          variant="outline"
                          disabled={fraudConfigSaving}
                          onClick={async () => {
                            try {
                              setFraudConfigSaving(true)
                              const res = await apiEvictCache()
                              toast({ title: 'Cache evicted', description: (res as any)?.message || 'Cache eviction requested.' })
                            } catch (e) {
                              toast({
                                title: 'Cache eviction failed',
                                description: e instanceof Error ? e.message : 'Unable to evict cache',
                                variant: 'destructive',
                              })
                            } finally {
                              setFraudConfigSaving(false)
                            }
                          }}
                        >
                          Evict cache
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>System Settings (API-backed)</CardTitle>
                  <CardDescription>
                    Select a row in the table and use Edit to load it, then change value or description and click Update Setting to save via /api/admin/system-settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <Label>Setting Key</Label>
                      <Input
                        placeholder="e.g. escrow_commission_percentage"
                        value={editingSystemSetting.settingKey}
                        onChange={(e) =>
                          setEditingSystemSetting((prev) => ({
                            ...prev,
                            settingKey: e.target.value,
                          }))
                        }
                        className="font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        disabled={systemLoading || saving || !!editingOriginalKey}
                        title={editingOriginalKey ? 'Key cannot be changed when editing' : undefined}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Value</Label>
                      <Input
                        placeholder="Setting value"
                        value={editingSystemSetting.settingValue}
                        onChange={(e) =>
                          setEditingSystemSetting((prev) => ({
                            ...prev,
                            settingValue: e.target.value,
                          }))
                        }
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        disabled={systemLoading || saving}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <Label>Description (optional)</Label>
                      <Input
                        placeholder="What this setting controls"
                        value={editingSystemSetting.description ?? ''}
                        onChange={(e) =>
                          setEditingSystemSetting((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        disabled={systemLoading || saving}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateSetting}
                      disabled={saving || systemLoading || !!editingOriginalKey}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Create Setting
                    </Button>
                    <Button
                      onClick={handleUpdateSetting}
                      disabled={saving || systemLoading || !editingOriginalKey}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
                      Update Setting
                    </Button>
                    {editingOriginalKey && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingSystemSetting({ settingKey: '', settingValue: '', description: '' })
                          setEditingOriginalKey(null)
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span>Existing Settings</span>
                      <span className="text-[11px] text-slate-400">
                        Total: {visibleSystemSettings.length}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900">
                          <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                            <th className="px-4 py-2 font-medium">Key</th>
                            <th className="px-4 py-2 font-medium">Value</th>
                            <th className="px-4 py-2 font-medium hidden md:table-cell">
                              Description
                            </th>
                            <th className="px-4 py-2 font-medium hidden lg:table-cell">
                              Updated
                            </th>
                            <th className="px-4 py-2 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleSystemSettings.map((setting) => (
                            <tr
                              key={setting.id}
                              className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                            >
                              <td className="px-4 py-2 align-top">
                                <code className="text-xs font-mono text-slate-800 dark:text-slate-100">
                                  {setting.settingKey}
                                </code>
                              </td>
                              <td className="px-4 py-2 align-top">
                                <span className="text-sm text-foreground">
                                  {setting.settingValue}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {setting.description || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top hidden lg:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(setting.updatedAt).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditSetting(setting)}
                                    title="Edit setting"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-red-500/40 text-red-500 hover:bg-red-500/10"
                                    onClick={() =>
                                      setDeleteDialog({ open: true, key: setting.settingKey })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {visibleSystemSettings.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-6 text-center text-sm text-muted-foreground"
                              >
                                No system settings found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, key: deleteDialog.key })}
        title="Delete system setting"
        description={`Are you sure you want to delete "${deleteDialog.key}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteDialog.key) return
          try {
            await apiDeleteSystemSetting(deleteDialog.key)
            setSystemSettings((prev) =>
              prev.filter((s) => s.settingKey !== deleteDialog.key)
            )
            toast({
              title: 'Setting deleted',
              description: `System setting "${deleteDialog.key}" has been deleted.`,
            })
          } catch (error) {
            console.error('Failed to delete system setting:', error)
            toast({
              title: 'Error deleting setting',
              description:
                error instanceof Error ? error.message : 'Unable to delete system setting.',
              variant: 'destructive',
            })
          } finally {
            setDeleteDialog({ open: false, key: null })
          }
        }}
      />
    </div>
  )
}
