// System configuration types

export interface SystemConfig {
  id: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  category: string
  description?: string
  isPublic: boolean
  isEncrypted: boolean
  environment?: string
  version: number
  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface ConfigCategory {
  name: string
  displayName: string
  description?: string
  configs: SystemConfig[]
}

export interface UpdateConfigRequest {
  value: any
  environment?: string
}

export interface ConfigHistory {
  id: string
  configId: string
  key: string
  oldValue: any
  newValue: any
  changedBy: string
  changedAt: string
  reason?: string
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  enabled: boolean
  environments: Record<string, boolean>
  createdAt: string
  updatedAt: string
}

export interface UpdateFeatureFlagRequest {
  enabled?: boolean
  environments?: Record<string, boolean>
}

export interface EmailConfig {
  smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  from: {
    name: string
    email: string
  }
  templates: {
    verification?: string
    passwordReset?: string
    welcome?: string
  }
}

export interface SecurityConfig {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    maxAge: number
    historyCount: number
  }
  session: {
    timeout: number
    maxConcurrentSessions: number
  }
  mfa: {
    required: boolean
    methods: string[]
  }
  lockout: {
    maxAttempts: number
    lockoutDuration: number
  }
}

export interface IntegrationConfig {
  id: string
  name: string
  type: string
  enabled: boolean
  config: Record<string, any>
  credentials?: Record<string, any>
  createdAt: string
  updatedAt: string
}

