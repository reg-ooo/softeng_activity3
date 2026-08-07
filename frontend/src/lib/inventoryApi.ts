import axios from 'axios'
import { api } from './api'
import type { InventoryItem } from '../types/inventory'

interface ApiErrorBody {
  error?: unknown
  message?: unknown
}

export async function listInventory(signal?: AbortSignal): Promise<InventoryItem[]> {
  const response = await api.get<InventoryItem[]>('/inventory', { signal })
  return response.data
}

export function getInventoryImageUrl(imagePath: string | null): string | null {
  const trimmedPath = imagePath?.trim()

  if (!trimmedPath) {
    return null
  }

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath
  }

  const apiBase = api.defaults.baseURL ?? '/api'
  const normalizedBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`
  const absoluteApiBase = new URL(normalizedBase, window.location.origin)
  const fileName = trimmedPath.split('/').filter(Boolean).at(-1)

  return fileName
    ? new URL(`../uploads/${encodeURIComponent(fileName)}`, absoluteApiBase).toString()
    : null
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return fallback
  }

  const responseMessage = error.response?.data?.message
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage.trim()
  }

  const responseError = error.response?.data?.error
  if (typeof responseError === 'string' && responseError.trim()) {
    return responseError.trim()
  }

  return fallback
}

export function isApiRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error)
}
