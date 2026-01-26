'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Zap
} from 'lucide-react'

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

export default function SettingsPage() {
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    escrowCommission: '5.0',
    centralAccountId: '',
  })

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

  // Handlers
  const handleSaveGeneral = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({
      title: 'Settings Saved',
      description: 'General settings have been updated successfully.',
    })
    setSaving(false)
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
    <div className="p-6 lg:p-8 space-y-6 bg-background min-h-screen">
      <PageHeader
        title="System Settings"
        description="Configure system-wide settings, security policies, and integrations"
      />

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-100 dark:bg-slate-900">
              <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="integrations" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Plug className="h-4 w-4 mr-2" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Flag className="h-4 w-4 mr-2" />
                Features
              </TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic system settings and defaults</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="escrowCommission">Escrow Commission Percentage</Label>
                        <p className="text-xs text-muted-foreground">Default commission rate charged on escrow transactions</p>
                        <Input
                          id="escrowCommission"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={generalSettings.escrowCommission}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, escrowCommission: e.target.value })}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          placeholder="5.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="centralAccountId">Central Account ID</Label>
                        <p className="text-xs text-muted-foreground">Wallet ID where commission payments are deposited</p>
                        <Input
                          id="centralAccountId"
                          type="text"
                          value={generalSettings.centralAccountId}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, centralAccountId: e.target.value })}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-sm"
                          placeholder="Enter wallet ID"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleSaveGeneral} 
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings Tab */}
            <TabsContent value="security" className="mt-6 space-y-6">
              {/* Password Policy */}
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-400" />
                    Password Policy
                  </CardTitle>
                  <CardDescription>Configure password requirements for user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="minLength">Minimum Password Length</Label>
                        <Input
                          id="minLength"
                          type="number"
                          min="6"
                          max="32"
                          value={securitySettings.passwordMinLength}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryDays">Password Expiry (Days)</Label>
                        <Input
                          id="expiryDays"
                          type="number"
                          min="0"
                          max="365"
                          value={securitySettings.passwordExpiryDays}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiryDays: parseInt(e.target.value) })}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        />
                        <p className="text-xs text-muted-foreground">Set to 0 for no expiry</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div>
                          <Label>Require Uppercase</Label>
                          <p className="text-xs text-muted-foreground">At least one uppercase letter</p>
                        </div>
                        <Switch
                          checked={securitySettings.passwordRequireUppercase}
                          onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireUppercase: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div>
                          <Label>Require Numbers</Label>
                          <p className="text-xs text-muted-foreground">At least one numeric digit</p>
                        </div>
                        <Switch
                          checked={securitySettings.passwordRequireNumbers}
                          onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireNumbers: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div>
                          <Label>Require Special</Label>
                          <p className="text-xs text-muted-foreground">At least one special character</p>
                        </div>
                        <Switch
                          checked={securitySettings.passwordRequireSpecial}
                          onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireSpecial: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-blue-400" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>Configure MFA requirements for admin and user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div>
                        <Label>Enable 2FA</Label>
                        <p className="text-xs text-muted-foreground">Allow users to enable two-factor authentication</p>
                      </div>
                      <Switch
                        checked={securitySettings.mfaEnabled}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, mfaEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div>
                        <Label>Require 2FA for Admins</Label>
                        <p className="text-xs text-muted-foreground">Enforce 2FA for all admin accounts</p>
                      </div>
                      <Switch
                        checked={securitySettings.mfaRequired}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, mfaRequired: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session & Lockout Settings */}
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Session & Lockout Settings
                  </CardTitle>
                  <CardDescription>Configure session timeout and account lockout policies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="1440"
                        value={securitySettings.sessionTimeoutMinutes}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockoutDuration">Lockout Duration (Minutes)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        min="5"
                        max="60"
                        value={securitySettings.lockoutDurationMinutes}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDurationMinutes: parseInt(e.target.value) })}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveSecurity} 
                    disabled={saving}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings Tab */}
            <TabsContent value="email" className="mt-6 space-y-6">
              {/* SMTP Configuration */}
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-400" />
                    SMTP Configuration
                  </CardTitle>
                  <CardDescription>Configure your email server for sending notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          type="text"
                          value={emailSettings.smtpHost}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={emailSettings.smtpPort}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          placeholder="587"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpUsername">SMTP Username</Label>
                        <Input
                          id="smtpUsername"
                          type="text"
                          value={emailSettings.smtpUsername}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          placeholder="your-username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Password</Label>
                        <div className="relative">
                          <Input
                            id="smtpPassword"
                            type={showSmtpPassword ? 'text' : 'password'}
                            value={emailSettings.smtpPassword}
                            onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 pr-10"
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          >
                            {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div>
                        <Label>Use TLS/SSL</Label>
                        <p className="text-xs text-muted-foreground">Enable secure connection to SMTP server</p>
                      </div>
                      <Switch
                        checked={emailSettings.smtpSecure}
                        onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, smtpSecure: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Identity */}
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-400" />
                    Email Identity
                  </CardTitle>
                  <CardDescription>Configure the sender information for outgoing emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email Address</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        placeholder="noreply@movasafe.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        type="text"
                        value={emailSettings.fromName}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        placeholder="Movasafe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyToEmail">Reply-To Email</Label>
                      <Input
                        id="replyToEmail"
                        type="email"
                        value={emailSettings.replyToEmail}
                        onChange={(e) => setEmailSettings({ ...emailSettings, replyToEmail: e.target.value })}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        placeholder="support@movasafe.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button 
                      onClick={handleSaveEmail} 
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save Email Settings
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={testingEmail}
                    >
                      {testingEmail ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Send Test Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plug className="h-5 w-5 text-blue-400" />
                    Third-party Integrations
                  </CardTitle>
                  <CardDescription>Manage connections to external services and APIs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map((integration) => {
                      const Icon = integration.icon
                      return (
                        <div
                          key={integration.id}
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{integration.name}</h4>
                                <p className="text-xs text-muted-foreground">{integration.description}</p>
                              </div>
                            </div>
                            {getStatusBadge(integration.status)}
                          </div>
                          {integration.apiKey && (
                            <div className="mb-3 p-2 rounded bg-slate-100 dark:bg-slate-900 flex items-center justify-between">
                              <span className="text-xs font-mono text-muted-foreground">{integration.apiKey}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  toast({ title: 'Copied', description: 'API key copied to clipboard' })
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {integration.lastSync && (
                            <p className="text-xs text-muted-foreground mb-3">
                              Last sync: {new Date(integration.lastSync).toLocaleString()}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleIntegration(integration.id)}
                              className="flex-1"
                            >
                              {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feature Flags Tab */}
            <TabsContent value="features" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-blue-400" />
                    Feature Flags
                  </CardTitle>
                  <CardDescription>Enable or disable system features across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Core Features */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-400" />
                        Core Features
                      </h3>
                      <div className="space-y-3">
                        {featureFlags.filter(f => f.category === 'core').map((flag) => (
                          <div
                            key={flag.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">{flag.name}</h4>
                                  {getCategoryBadge(flag.category)}
                                </div>
                                <p className="text-sm text-muted-foreground">{flag.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={flag.enabled}
                              onCheckedChange={() => handleToggleFeature(flag.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Beta Features */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-purple-400" />
                        Beta Features
                      </h3>
                      <div className="space-y-3">
                        {featureFlags.filter(f => f.category === 'beta').map((flag) => (
                          <div
                            key={flag.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-l-purple-500"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">{flag.name}</h4>
                                  {getCategoryBadge(flag.category)}
                                </div>
                                <p className="text-sm text-muted-foreground">{flag.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={flag.enabled}
                              onCheckedChange={() => handleToggleFeature(flag.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Experimental Features */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        Experimental Features
                        <Badge variant="outline" className="text-orange-400 border-orange-500/30">Use with caution</Badge>
                      </h3>
                      <div className="space-y-3">
                        {featureFlags.filter(f => f.category === 'experimental').map((flag) => (
                          <div
                            key={flag.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-l-orange-500"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">{flag.name}</h4>
                                  {getCategoryBadge(flag.category)}
                                </div>
                                <p className="text-sm text-muted-foreground">{flag.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={flag.enabled}
                              onCheckedChange={() => handleToggleFeature(flag.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
