// Shared fetch utility – uses Clerk session token for API auth

import { getClerkToken } from './auth'

const API_BASE_URL = '/api'

// Options for fetchAPI
export interface FetchAPIOptions extends RequestInit {
  /**
   * Whether to automatically retry on 401 with token refresh
   * @default true
   */
  retryOn401?: boolean
  /**
   * Whether to automatically add Authorization header if token exists
   * @default true
   */
  addAuthHeader?: boolean
}

// Generic fetch wrapper – adds Clerk session token as Bearer when available
export async function fetchAPI<T>(
  endpoint: string,
  options?: FetchAPIOptions
): Promise<T> {
  const shouldAddAuthHeader = options?.addAuthHeader !== undefined ? options.addAuthHeader : true

  const token = await getClerkToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  }
  if (token && shouldAddAuthHeader) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headers as HeadersInit,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred',
      details: response.statusText,
    }))
    throw new Error(error.error || error.details || 'Request failed')
  }

  return response.json()
}

