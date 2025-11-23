// Authentication service for user registration, login, and token management

const API_BASE_URL = '/api'

// User type matching backend response
export interface User {
  id: number
  email: string
  name: string
}

// Auth response types
export interface RegisterResponse {
  user: User
  access_token: string
  refresh_token: string
  message: string
}

export interface LoginResponse {
  user: User
  access_token: string
  refresh_token: string
  message: string
}

export interface RefreshResponse {
  access_token: string
  message: string
}

// Request types
export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LogoutRequest {
  refresh_token: string
}

export interface UpdateUserRequest {
  name: string
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
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

// Token management functions
export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// Auth API functions
export const authAPI = {
  /**
   * Register a new user account
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await fetchAPI<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // Store tokens on successful registration
    if (response.access_token && response.refresh_token) {
      tokenStorage.setTokens(response.access_token, response.refresh_token)
    }
    
    return response
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await fetchAPI<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // Store tokens on successful login
    if (response.access_token && response.refresh_token) {
      tokenStorage.setTokens(response.access_token, response.refresh_token)
    }
    
    return response
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await fetchAPI<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    
    // Update access token in storage
    if (response.access_token) {
      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        tokenStorage.setTokens(response.access_token, refreshToken)
      }
    }
    
    return response
  },

  /**
   * Logout and revoke refresh token
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await fetchAPI<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    } catch (error) {
      // Even if logout fails, clear tokens locally
      console.error('Logout error:', error)
    } finally {
      // Always clear tokens from storage
      tokenStorage.clearTokens()
    }
  },

  /**
   * Get current authenticated user information
   */
  getCurrentUser: async (): Promise<User> => {
    const accessToken = tokenStorage.getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }

    return fetchAPI<User>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  },

  /**
   * Update current user information
   */
  updateUser: async (data: UpdateUserRequest): Promise<User> => {
    const accessToken = tokenStorage.getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }

    return fetchAPI<User>('/auth/me', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    })
  },
}

