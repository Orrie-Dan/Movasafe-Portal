'use client'

import { API_CONFIG } from '@/lib/config/api'
import { getToken } from '@/lib/auth'

export interface SystemSettingDTO {
  settingKey: string
  settingValue: string
  description?: string
}

export interface SystemSettingResponse {
  id: string
  settingKey: string
  settingValue: string
  description?: string | null
  createdAt: string
  updatedAt: string
  version: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string | null
}

const BASE_URL = API_CONFIG.TRANSACTION.baseUrl
const SETTINGS_PATH = '/api/admin/system-settings'

const getAuthHeaders = (): HeadersInit => {
  const token = getToken()
  if (!token) {
    throw new Error('No authentication token found')
  }
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function handleResponse<T>(resp: Response): Promise<T> {
  const text = await resp.text()
  if (!resp.ok) {
    let message = `Request failed with status ${resp.status}`
    try {
      const parsed = JSON.parse(text)
      message = parsed.message || parsed.error || message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }

  if (!text) {
    // some delete endpoints may not return a body
    return undefined as unknown as T
  }

  const parsed: ApiResponse<T> = JSON.parse(text)
  return parsed.data
}

export async function apiListSystemSettings(): Promise<SystemSettingResponse[]> {
  const resp = await fetch(`${BASE_URL}${SETTINGS_PATH}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse<SystemSettingResponse[]>(resp)
}

export async function apiGetSystemSetting(
  key: string
): Promise<SystemSettingResponse | null> {
  const resp = await fetch(`${BASE_URL}${SETTINGS_PATH}/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (resp.status === 400 || resp.status === 404) {
    // key not found
    return null
  }

  return handleResponse<SystemSettingResponse>(resp)
}

export async function apiCreateSystemSetting(
  dto: SystemSettingDTO
): Promise<SystemSettingResponse> {
  const resp = await fetch(`${BASE_URL}${SETTINGS_PATH}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  return handleResponse<SystemSettingResponse>(resp)
}

export async function apiUpdateSystemSetting(
  key: string,
  dto: SystemSettingDTO
): Promise<SystemSettingResponse> {
  const resp = await fetch(`${BASE_URL}${SETTINGS_PATH}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  return handleResponse<SystemSettingResponse>(resp)
}

export async function apiDeleteSystemSetting(key: string): Promise<void> {
  const resp = await fetch(`${BASE_URL}${SETTINGS_PATH}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  await handleResponse<unknown>(resp)
}

