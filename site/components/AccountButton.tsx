'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { apiRequest } from '@/lib/api'
import { basePath } from '@/lib/basePath'
import {
  AUTH_TOKEN_EVENT,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '@/lib/auth'

type UserResponse = {
  authenticated: boolean
  user_id?: number
  email?: string
  name?: string
  image?: string | null
}

function getInitials(name?: string, email?: string) {
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

export function AccountButton() {
  const pathname = usePathname()
  const [authToken, setAuthTokenState] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<UserResponse | null>(null)

  useEffect(() => {
    const stored = getStoredToken()
    if (stored) {
      setAuthTokenState(stored)
    } else {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    function handleTokenChange(event: Event) {
      const detail = (event as CustomEvent<{ token: string | null }>).detail
      setAuthTokenState(detail?.token ?? null)
    }

    window.addEventListener(AUTH_TOKEN_EVENT, handleTokenChange)
    return () => window.removeEventListener(AUTH_TOKEN_EVENT, handleTokenChange)
  }, [])

  useEffect(() => {
    let active = true

    async function loadUser() {
      setAuthError(null)
      if (!authToken) {
        setUser(null)
        setAuthLoading(false)
        return
      }

      setAuthLoading(true)
      try {
        const me = await apiRequest<UserResponse>('/api/auth/me', {
          token: authToken,
        })
        if (!active) return

        if (me.authenticated) {
          setUser(me)
        } else {
          clearStoredToken()
          setAuthTokenState(null)
          setUser(null)
        }
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Unable to load account'
        setAuthError(message)
        setUser(null)
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [authToken])


  const handleLogout = () => {
    clearStoredToken()
    setAuthTokenState(null)
    setUser(null)
    setAuthError(null)
  }

  const startOAuth = async (provider: 'github' | 'google') => {
    setAuthError(null)
    try {
      const callbackUrl = new URL(`${basePath}/auth/callback`, window.location.origin)
      if (pathname) {
        callbackUrl.searchParams.set('returnTo', pathname)
      }
      const login = await apiRequest<{ url: string }>(
        `/api/auth/${provider}?redirect_to=${encodeURIComponent(callbackUrl.toString())}`
      )
      window.location.href = login.url
    } catch (err) {
      const message = err instanceof Error ? err.message : `Unable to start ${provider} login`
      setAuthError(message)
    }
  }

  const isAuthenticated = Boolean(user?.authenticated)
  const initials = getInitials(user?.name, user?.email)
  const avatarUrl = user?.image?.trim()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account">
          {isAuthenticated ? (
            avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || user?.email || 'User avatar'}
                className="h-8 w-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </span>
            )
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm text-muted-foreground">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A9 9 0 1119.8 6.12M15 11a3 3 0 11-6 0 3 3 0 016 0zm-6 8h6"
                />
              </svg>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Sign in to save progress and join discussions.
          </DialogDescription>
        </DialogHeader>

        {authLoading ? (
          <p className="text-sm text-muted-foreground">Checking session...</p>
        ) : isAuthenticated ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-foreground">
                Signed in as <span className="font-medium">{user?.name || user?.email}</span>
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {process.env.NEXT_PUBLIC_API_URL ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => startOAuth('github')}>Continue with GitHub</Button>
                <Button variant="outline" onClick={() => startOAuth('google')}>
                  Continue with Google
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                <p>Authentication is only available in development mode.</p>
                <p className="mt-2">This is a static site - enjoy the content! 📚</p>
              </div>
            )}
          </div>
        )}

        {authError && (
          <p className="text-sm text-destructive">{authError}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
