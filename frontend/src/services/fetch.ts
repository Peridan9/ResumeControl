// Shared fetch utility with token management and automatic refresh

import { tokenStorage, authAPI } from './auth'

const API_BASE_URL = '/api'

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// Function to refresh token and return new access token
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await authAPI.refreshToken(refreshToken)
      return response.access_token
    } catch (error) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens()
      // Redirect to login will be handled by ProtectedRoute
      throw error
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

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

// Generic fetch wrapper with error handling and automatic token refresh
export async function fetchAPI<T>(
  endpoint: string,
  options?: FetchAPIOptions
): Promise<T> {
  const shouldRetryOn401 = options?.retryOn401 !== undefined ? options.retryOn401 : true
  const shouldAddAuthHeader = options?.addAuthHeader !== undefined ? options.addAuthHeader : true

  // Get access token
  let accessToken = tokenStorage.getAccessToken()

  // Build headers with authorization if token exists and should add auth header
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  if (accessToken && shouldAddAuthHeader) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Make request
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && shouldRetryOn401 && accessToken) {
    try {
      // Attempt to refresh token
      const newAccessToken = await refreshAccessToken()
      
      if (newAccessToken) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newAccessToken}`
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        })
      } else {
        // Refresh failed, throw error
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      // Refresh failed, clear tokens and throw error
      tokenStorage.clearTokens()
      throw new Error('Authentication failed. Please login again.')
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred',
      details: response.statusText,
    }))
    throw new Error(error.error || error.details || 'Request failed')
  }

  return response.json()
}

