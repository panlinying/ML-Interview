'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { apiRequest } from '@/lib/api'
import { basePath } from '@/lib/basePath'
import {
  AUTH_TOKEN_EVENT,
  clearStoredToken,
  getStoredToken,
} from '@/lib/auth'

export type UserResponse = {
  authenticated: boolean
  user_id?: number
  email?: string
  name?: string
  image?: string | null
}

type AuthContextType = {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (provider: 'github' | 'google', returnTo?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateProfile: (updates: { name?: string; image?: string | null }) => Promise<UserResponse>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component that manages authentication state.
 *
 * Wrap your app with this provider to share auth state across all components.
 * This prevents duplicate API requests when multiple components need auth state.
 *
 * Usage in layout.tsx:
 * ```tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize token from localStorage on mount
  useEffect(() => {
    const stored = getStoredToken()
    if (stored) {
      setToken(stored)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Listen for token changes from other components/tabs
  useEffect(() => {
    function handleTokenChange(event: Event) {
      const detail = (event as CustomEvent<{ token: string | null }>).detail
      setToken(detail?.token ?? null)
    }

    window.addEventListener(AUTH_TOKEN_EVENT, handleTokenChange)
    return () => window.removeEventListener(AUTH_TOKEN_EVENT, handleTokenChange)
  }, [])

  // Fetch user data when token changes - SINGLE request for entire app
  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const me = await apiRequest<UserResponse>('/api/auth/me', { token })

      if (me.authenticated) {
        setUser(me)
      } else {
        clearStoredToken()
        setToken(null)
        setUser(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load account'

      if (message.includes('expired') || message.includes('401')) {
        clearStoredToken()
        setToken(null)
        setUser(null)
        setError('Session expired. Please sign in again.')
      } else {
        setError(message)
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Start OAuth login flow
  const login = useCallback(async (provider: 'github' | 'google', returnTo?: string) => {
    setError(null)
    try {
      const callbackUrl = new URL(`${basePath}/auth/callback`, window.location.origin)
      if (returnTo) {
        callbackUrl.searchParams.set('returnTo', returnTo)
      }
      const response = await apiRequest<{ url: string }>(
        `/api/auth/${provider}?redirect_to=${encodeURIComponent(callbackUrl.toString())}`
      )
      window.location.href = response.url
    } catch (err) {
      const message = err instanceof Error ? err.message : `Unable to start ${provider} login`
      setError(message)
    }
  }, [])

  const updateProfile = useCallback(
    async (updates: { name?: string; image?: string | null }) => {
      if (!token) {
        throw new Error('Authentication required')
      }
      setError(null)
      try {
        const updated = await apiRequest<UserResponse>('/api/auth/me', {
          method: 'PATCH',
          body: updates,
          token,
        })

        if (updated.authenticated) {
          setUser(updated)
        } else {
          clearStoredToken()
          setToken(null)
          setUser(null)
        }

        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to update profile'

        if (message.includes('expired') || message.includes('401') || message.includes('Authentication required')) {
          clearStoredToken()
          setToken(null)
          setUser(null)
          setError('Session expired. Please sign in again.')
        }
        throw err
      }
    },
    [token]
  )

  // Logout and clear session
  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user?.authenticated),
    error,
    login,
    logout,
    refreshUser,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth()
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Helper function to get initials from a name or email.
 */
export function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || ''
  if (!source) {
    return '?'
  }
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
