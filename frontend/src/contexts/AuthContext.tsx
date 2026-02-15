// Auth context: drives from Clerk and exposes backend user (from GET /auth/me)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { authAPI, setClerkTokenGetter, type User } from '../services/auth'

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: clerkLoaded, isSignedIn, getToken, signOut } = useClerkAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = user !== null

  // Register Clerk token getter so fetchAPI can attach Bearer token
  useEffect(() => {
    setClerkTokenGetter(async () => {
      try {
        return await getToken()
      } catch {
        return null
      }
    })
  }, [getToken])

  // When Clerk is ready and signed in, fetch our backend user from GET /auth/me
  useEffect(() => {
    if (!clerkLoaded) return

    if (!isSignedIn) {
      setUser(null)
      setLoading(false)
      return
    }

    let cancelled = false
    authAPI
      .getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [clerkLoaded, isSignedIn])

  const login = useCallback(async (_email: string, _password: string) => {
    throw new Error('Use Clerk sign-in at /sign-in')
  }, [])

  const register = useCallback(async (_email: string, _password: string, _name?: string) => {
    throw new Error('Use Clerk sign-up at /sign-up')
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
  }, [signOut])

  const refresh = useCallback(async () => {
    if (!isSignedIn) return
    try {
      const u = await authAPI.getCurrentUser()
      setUser(u)
    } catch {
      setUser(null)
    }
  }, [isSignedIn])

  const updateUser = useCallback(async (name: string) => {
    const updated = await authAPI.updateUser({ name })
    setUser(updated)
  }, [])

  const value: AuthContextType = {
    user,
    loading: !clerkLoaded || loading,
    isAuthenticated,
    login,
    register,
    logout,
    refresh,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
