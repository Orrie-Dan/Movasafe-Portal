// System configuration API functions

import { getToken } from './auth'
import type {
  SystemConfig,
  ConfigCategory,
  ConfigHistory,
  UpdateConfigRequest,
  FeatureFlag,
  UpdateFeatureFlagRequest,
  EmailConfig,
  SecurityConfig,
  IntegrationConfig,
} from '@/lib/types/config'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// General configuration
export async function apiGetConfigs(category?: string): Promise<{ configs: SystemConfig[]; categories: ConfigCategory[] }> {
  const queryParams = category ? `?category=${category}` : ''
  return apiRequest<{ configs: SystemConfig[]; categories: ConfigCategory[] }>(`/admin/config${queryParams}`)
}

export async function apiGetConfig(configKey: string): Promise<{ config: SystemConfig }> {
  return apiRequest<{ config: SystemConfig }>(`/admin/config/${configKey}`)
}

export async function apiUpdateConfig(configKey: string, data: UpdateConfigRequest): Promise<{ config: SystemConfig }> {
  return apiRequest<{ config: SystemConfig }>(`/admin/config/${configKey}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiGetConfigHistory(configKey: string, params?: { limit?: number }): Promise<{ history: ConfigHistory[] }> {
  const queryParams = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString()}` : ''
  return apiRequest<{ history: ConfigHistory[] }>(`/admin/config/${configKey}/history${queryParams}`)
}

export async function apiRollbackConfig(configKey: string, version: number): Promise<{ config: SystemConfig }> {
  return apiRequest<{ config: SystemConfig }>(`/admin/config/${configKey}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ version }),
  })
}

// Feature flags
export async function apiGetFeatureFlags(): Promise<{ flags: FeatureFlag[] }> {
  return apiRequest<{ flags: FeatureFlag[] }>('/admin/config/feature-flags')
}

export async function apiGetFeatureFlag(flagKey: string): Promise<{ flag: FeatureFlag }> {
  return apiRequest<{ flag: FeatureFlag }>(`/admin/config/feature-flags/${flagKey}`)
}

export async function apiUpdateFeatureFlag(flagKey: string, data: UpdateFeatureFlagRequest): Promise<{ flag: FeatureFlag }> {
  return apiRequest<{ flag: FeatureFlag }>(`/admin/config/feature-flags/${flagKey}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Email configuration
export async function apiGetEmailConfig(): Promise<{ config: EmailConfig }> {
  return apiRequest<{ config: EmailConfig }>('/admin/config/email')
}

export async function apiUpdateEmailConfig(data: EmailConfig): Promise<{ config: EmailConfig }> {
  return apiRequest<{ config: EmailConfig }>('/admin/config/email', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiTestEmailConfig(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/admin/config/email/test', {
    method: 'POST',
  })
}

// Security configuration
export async function apiGetSecurityConfig(): Promise<{ config: SecurityConfig }> {
  return apiRequest<{ config: SecurityConfig }>('/admin/config/security')
}

export async function apiUpdateSecurityConfig(data: SecurityConfig): Promise<{ config: SecurityConfig }> {
  return apiRequest<{ config: SecurityConfig }>('/admin/config/security', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Integrations
export async function apiGetIntegrations(): Promise<{ integrations: IntegrationConfig[] }> {
  return apiRequest<{ integrations: IntegrationConfig[] }>('/admin/config/integrations')
}

export async function apiGetIntegration(integrationId: string): Promise<{ integration: IntegrationConfig }> {
  return apiRequest<{ integration: IntegrationConfig }>(`/admin/config/integrations/${integrationId}`)
}

export async function apiUpdateIntegration(integrationId: string, data: Partial<IntegrationConfig>): Promise<{ integration: IntegrationConfig }> {
  return apiRequest<{ integration: IntegrationConfig }>(`/admin/config/integrations/${integrationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiTestIntegration(integrationId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/config/integrations/${integrationId}/test`, {
    method: 'POST',
  })
}

