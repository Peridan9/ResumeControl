// Shared fetch utility with token management and automatic refresh

import { tokenStorage, authAPI } from './auth'

const API_BASE_URL = '/api'

// Token refresh state management
interface RefreshState {
  promise: Promise<string | null>
  subscribers: Array<{
    resolve: (token: string | null) => void
    reject: (error: Error) => void
  }>
}

let refreshState: RefreshState | null = null

// Function to refresh token and return new access token
// Uses a queue system to handle concurrent refresh requests
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, queue this request
  if (refreshState) {
    return new Promise<string | null>((resolve, reject) => {
      refreshState!.subscribers.push({ resolve, reject })
    })
  }

  // Start new refresh operation
  const state: RefreshState = {
    promise: (async () => {
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
      }
    })(),
    subscribers: [],
  }

  refreshState = state

  // Wait for refresh to complete
  try {
    const newToken = await state.promise
    
    // Notify all queued requests
    state.subscribers.forEach(({ resolve }) => resolve(newToken))
    
    return newToken
  } catch (error) {
    // Notify all queued requests of failure
    const err = error instanceof Error ? error : new Error('Token refresh failed')
    state.subscribers.forEach(({ reject }) => reject(err))
    throw err
  } finally {
    // Clear refresh state
    refreshState = null
  }
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

  // Helper function to make the actual fetch request
  const makeRequest = async (token: string | null): Promise<Response> => {
    // Build headers with authorization if token exists and should add auth header
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> | undefined),
    }

    if (token && shouldAddAuthHeader) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: headers as HeadersInit,
    })
  }

  // Get initial access token
  let accessToken = tokenStorage.getAccessToken()

  // Make initial request
  let response = await makeRequest(accessToken)

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && shouldRetryOn401 && accessToken) {
    try {
      // Attempt to refresh token (this will queue if already refreshing)
      const newAccessToken = await refreshAccessToken()
      
      if (newAccessToken) {
        // Retry original request with new token
        response = await makeRequest(newAccessToken)
        
        // If still 401 after refresh, token is invalid
        if (response.status === 401) {
          tokenStorage.clearTokens()
          throw new Error('Authentication failed. Please login again.')
        }
      } else {
        // Refresh failed, throw error
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      // Refresh failed, clear tokens and throw error
      tokenStorage.clearTokens()
      if (error instanceof Error) {
        throw error
      }
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

