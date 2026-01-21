'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiRequest, encodeSlugPath } from '@/lib/api'
import { AUTH_TOKEN_EVENT, clearStoredToken, getStoredToken, setStoredToken } from '@/lib/auth'
import { basePath } from '@/lib/basePath'

type UserResponse = {
  authenticated: boolean
  user_id?: number
  email?: string
  name?: string
}

type Comment = {
  id: number
  user_id: number
  user_name?: string | null
  content_slug: string
  body: string
  created_at: string
}

type Progress = {
  completed: boolean
  notes?: string | null
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value
  }
  return date.toLocaleString()
}

export function DocEngagement({ contentSlug }: { contentSlug: string }) {
  const pathname = usePathname()
  const slugPath = useMemo(() => encodeSlugPath(contentSlug), [contentSlug])
  const pageviewLogged = useRef<string | null>(null)

  const [authToken, setAuthTokenState] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [tokenInput, setTokenInput] = useState('')

  const [progress, setProgress] = useState<Progress>({ completed: false, notes: '' })
  const [progressStatus, setProgressStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle')
  const [progressError, setProgressError] = useState<string | null>(null)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

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

  useEffect(() => {
    let active = true
    setCommentsLoading(true)
    setCommentsError(null)

    apiRequest<Comment[]>(`/api/comments/${slugPath}`)
      .then(data => {
        if (!active) return
        setComments(data)
      })
      .catch(err => {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Unable to load comments'
        setCommentsError(message)
      })
      .finally(() => {
        if (active) {
          setCommentsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [slugPath])

  useEffect(() => {
    let active = true
    if (!authToken || !user?.authenticated) {
      setProgress({ completed: false, notes: '' })
      setProgressStatus('idle')
      setProgressError(null)
      return
    }

    setProgressStatus('loading')
    setProgressError(null)
    apiRequest<Progress>(`/api/progress/${slugPath}`, {
      token: authToken,
    })
      .then(data => {
        if (!active) return
        setProgress({
          completed: Boolean(data.completed),
          notes: data.notes || '',
        })
        setProgressStatus('idle')
      })
      .catch(err => {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Unable to load progress'
        setProgressError(message)
        setProgressStatus('error')
      })

    return () => {
      active = false
    }
  }, [authToken, slugPath, user?.authenticated])

  useEffect(() => {
    if (!pathname || pageviewLogged.current === pathname) {
      return
    }
    pageviewLogged.current = pathname
    apiRequest('/api/analytics/pageview', {
      method: 'POST',
      body: { path: pathname },
      token: authToken,
    }).catch(() => {
      // Skip analytics errors to avoid blocking UI.
    })
  }, [authToken, pathname])

  const handleSaveToken = () => {
    const trimmed = tokenInput.trim()
    if (!trimmed) {
      setAuthError('Enter a token to continue')
      return
    }
    setStoredToken(trimmed)
    setAuthTokenState(trimmed)
    setTokenInput('')
  }

  const handleLogout = () => {
    clearStoredToken()
    setAuthTokenState(null)
    setUser(null)
    setAuthError(null)
  }

  const handleGithubLogin = async () => {
    setAuthError(null)
    try {
      const callbackUrl = new URL(`${basePath}/auth/callback`, window.location.origin)
      if (pathname) {
        callbackUrl.searchParams.set('returnTo', pathname)
      }
      const login = await apiRequest<{ url: string }>(
        `/api/auth/github?redirect_to=${encodeURIComponent(callbackUrl.toString())}`
      )
      window.location.href = login.url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start GitHub login'
      setAuthError(message)
    }
  }

  const handleGoogleLogin = async () => {
    setAuthError(null)
    try {
      const callbackUrl = new URL(`${basePath}/auth/callback`, window.location.origin)
      if (pathname) {
        callbackUrl.searchParams.set('returnTo', pathname)
      }
      const login = await apiRequest<{ url: string }>(
        `/api/auth/google?redirect_to=${encodeURIComponent(callbackUrl.toString())}`
      )
      window.location.href = login.url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start Google login'
      setAuthError(message)
    }
  }

  const handleSaveProgress = async () => {
    if (!authToken || !user?.authenticated) {
      setProgressError('Sign in to save progress')
      return
    }

    setProgressStatus('saving')
    setProgressError(null)
    try {
      await apiRequest('/api/progress', {
        method: 'POST',
        token: authToken,
        body: {
          content_slug: contentSlug,
          completed: progress.completed,
          notes: progress.notes?.trim() ? progress.notes : null,
        },
      })
      setProgressStatus('idle')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save progress'
      setProgressError(message)
      setProgressStatus('error')
    }
  }

  const handleSubmitComment = async () => {
    const trimmed = commentDraft.trim()
    if (!trimmed) {
      setCommentsError('Comment cannot be empty')
      return
    }
    if (!authToken || !user?.authenticated) {
      setCommentsError('Sign in to post a comment')
      return
    }

    setCommentSubmitting(true)
    setCommentsError(null)
    try {
      const newComment = await apiRequest<Comment>('/api/comments', {
        method: 'POST',
        token: authToken,
        body: {
          content_slug: contentSlug,
          body: trimmed,
        },
      })
      setComments(prev => [newComment, ...prev])
      setCommentDraft('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to post comment'
      setCommentsError(message)
    } finally {
      setCommentSubmitting(false)
    }
  }

  const isAuthenticated = Boolean(user?.authenticated)

  return (
    <section className="mt-12 space-y-8">
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Account</h3>
          <p className="text-sm text-muted-foreground">
            Sign in to track progress and join the discussion.
          </p>
        </div>

        {authLoading ? (
          <p className="text-sm text-muted-foreground">Checking session...</p>
        ) : isAuthenticated ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
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
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGithubLogin}>Continue with GitHub</Button>
              <Button variant="outline" onClick={handleGoogleLogin}>
                Continue with Google
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                If you already have a JWT, paste it here to continue.
              </p>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={tokenInput}
                  onChange={event => setTokenInput(event.target.value)}
                  placeholder="Paste access token"
                  className="max-w-md"
                />
                <Button variant="outline" onClick={handleSaveToken}>
                  Save token
                </Button>
              </div>
            </div>
          </div>
        )}

        {authError && (
          <p className="text-sm text-destructive">{authError}</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Progress</h3>
          <p className="text-sm text-muted-foreground">
            Track completion and jot down quick notes for this page.
          </p>
        </div>

        {!isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            Sign in to save progress for this page.
          </p>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={progress.completed}
                onChange={event =>
                  setProgress(current => ({
                    ...current,
                    completed: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-border"
              />
              Mark as complete
            </label>
            <Textarea
              value={progress.notes || ''}
              onChange={event =>
                setProgress(current => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Optional notes or reminders..."
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleSaveProgress}
                disabled={progressStatus === 'saving' || progressStatus === 'loading'}
              >
                {progressStatus === 'saving' ? 'Saving...' : 'Save progress'}
              </Button>
              {progressStatus === 'loading' && (
                <span className="text-xs text-muted-foreground">Loading progress...</span>
              )}
            </div>
          </div>
        )}

        {progressError && (
          <p className="text-sm text-destructive">{progressError}</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Discussion</h3>
          <p className="text-sm text-muted-foreground">
            Share insights, questions, or helpful resources for this topic.
          </p>
        </div>

        <div className="space-y-3">
          <Textarea
            value={commentDraft}
            onChange={event => setCommentDraft(event.target.value)}
            placeholder="Add a comment..."
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleSubmitComment} disabled={commentSubmitting}>
              {commentSubmitting ? 'Posting...' : 'Post comment'}
            </Button>
            {!isAuthenticated && (
              <span className="text-xs text-muted-foreground">
                Sign in to post.
              </span>
            )}
          </div>
        </div>

        {commentsError && (
          <p className="text-sm text-destructive">{commentsError}</p>
        )}

        {commentsLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => (
              <div
                key={comment.id}
                className="rounded-md border border-border bg-background p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{comment.user_name || 'Anonymous'}</span>
                  <span>{formatDate(comment.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
