// Authentication Context for managing user authentication state

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, tokenStorage, type User } from '../services/auth'

// Auth context type
interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateUser: (name: string) => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Check if user is authenticated
  const isAuthenticated = user !== null

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have tokens
        const accessToken = tokenStorage.getAccessToken()
        const refreshToken = tokenStorage.getRefreshToken()

        if (accessToken && refreshToken) {
          // Try to get current user
          try {
            const currentUser = await authAPI.getCurrentUser()
            setUser(currentUser)
          } catch (error) {
            // If getting user fails, try to refresh token
            try {
              await authAPI.refreshToken(refreshToken)
              // Retry getting user after refresh
              const currentUser = await authAPI.getCurrentUser()
              setUser(currentUser)
            } catch (refreshError) {
              // Refresh failed, clear tokens
              tokenStorage.clearTokens()
              setUser(null)
            }
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        tokenStorage.clearTokens()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      setUser(response.user)
    } catch (error) {
      // Re-throw error so component can handle it
      throw error
    }
  }, [])

  // Register function
  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await authAPI.register({ email, password, name })
      setUser(response.user)
    } catch (error) {
      // Re-throw error so component can handle it
      throw error
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        await authAPI.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear state and tokens
      tokenStorage.clearTokens()
      setUser(null)
    }
  }, [])

  // Refresh token function
  const refresh = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      await authAPI.refreshToken(refreshToken)
      
      // Get updated user info
      const currentUser = await authAPI.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      // Refresh failed, clear tokens and user
      tokenStorage.clearTokens()
      setUser(null)
      throw error
    }
  }, [])

  // Update user function
  const updateUser = useCallback(async (name: string) => {
    try {
      const updatedUser = await authAPI.updateUser({ name })
      setUser(updatedUser)
    } catch (error) {
      // Re-throw error so component can handle it
      throw error
    }
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refresh,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// useAuth hook for consuming auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

