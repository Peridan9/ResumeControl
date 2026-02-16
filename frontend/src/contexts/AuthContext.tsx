// Auth context: drives from Clerk and exposes backend user (from GET /auth/me)

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { authAPI, setClerkTokenGetter, type User } from '../services/auth'

const MAX_AUTH_ME_RETRIES = 5
const RETRY_DELAYS_MS = [1000, 2000, 3000, 4000, 5000]

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

function is401(err: unknown): boolean {
  return typeof (err as Error & { status?: number })?.status === 'number' && (err as Error & { status?: number }).status === 401
}

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

  // When Clerk is ready and signed in, fetch our backend user from GET /auth/me.
  // - Only fetch when we don't have user yet: avoids refetch storm when effect re-runs
  //   (e.g. UserProfile sub-navigation) and prevents 401s from triggering redirect.
  // - On 401 we retry with backoff until 200; we never clear user on 401 so we never
  //   redirect to dashboard while Clerk is still signing in.
  useEffect(() => {
    if (!clerkLoaded) return

    if (!isSignedIn) {
      setUser(null)
      setLoading(false)
      return
    }

    // Already have user: don't refetch. Keeps one loading and avoids 401s on profile nav.
    if (user !== null) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchWithRetry(): Promise<User | null> {
      for (let attempt = 0; attempt <= MAX_AUTH_ME_RETRIES; attempt++) {
        if (cancelled) return null
        const token = await getToken()
        if (!token) {
          if (attempt < MAX_AUTH_ME_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 5000))
            continue
          }
          return null
        }
        try {
          const u = await authAPI.getCurrentUser()
          return u
        } catch (err) {
          if (cancelled) return null
          if (is401(err) && attempt < MAX_AUTH_ME_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 5000))
            continue
          }
          throw err
        }
      }
      return null
    }

    fetchWithRetry()
      .then((u) => {
        if (cancelled) return
        if (u !== null) setUser(u)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
        // Never set user to null on error here: only clear when !isSignedIn above.
        // That way we don't redirect to dashboard on 401 while Clerk is still ready.
      })

    return () => {
      cancelled = true
    }
  }, [clerkLoaded, isSignedIn, getToken, user])

  const login = useCallback(async () => {
    throw new Error('Use Clerk sign-in at /sign-in')
  }, [])

  const register = useCallback(async () => {
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
    } catch (err) {
      if (!is401(err)) setUser(null)
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
