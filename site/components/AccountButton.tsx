'use client'

import { useEffect, useState, type FormEvent } from 'react'
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
import { Input } from '@/components/ui/input'
import { useAuth, getInitials } from '@/lib/useAuth'

export function AccountButton() {
  const pathname = usePathname()
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    error: authError,
    login,
    logout,
    updateProfile,
  } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [avatarInput, setAvatarInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [profileNotice, setProfileNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setDisplayName('')
      setAvatarInput('')
      setProfileNotice(null)
      return
    }

    setDisplayName(user?.name ?? '')
    setAvatarInput(user?.image ?? '')
  }, [isAuthenticated, user?.name, user?.image])

  const handleLogout = () => {
    logout()
  }

  const startOAuth = async (provider: 'github' | 'google') => {
    await login(provider, pathname || undefined)
  }

  const initials = getInitials(user?.name, user?.email)
  const avatarUrl = user?.image?.trim()
  const currentName = (user?.name ?? '').trim()
  const currentAvatar = (user?.image ?? '').trim()
  const nextName = displayName.trim()
  const nextAvatar = avatarInput.trim()
  const hasChanges =
    isAuthenticated && (nextName !== currentName || nextAvatar !== currentAvatar)
  const canSave = hasChanges && nextName.length > 0 && !isSaving

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAuthenticated) {
      return
    }
    if (!nextName) {
      setProfileNotice({ type: 'error', message: 'Display name is required.' })
      return
    }

    const updates: { name?: string; image?: string | null } = {}
    if (nextName !== currentName) {
      updates.name = nextName
    }
    if (nextAvatar !== currentAvatar) {
      updates.image = nextAvatar ? nextAvatar : null
    }
    if (Object.keys(updates).length === 0) {
      return
    }

    setIsSaving(true)
    setProfileNotice(null)
    try {
      await updateProfile(updates)
      setProfileNotice({ type: 'success', message: 'Profile updated.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update profile.'
      setProfileNotice({ type: 'error', message })
    } finally {
      setIsSaving(false)
    }
  }

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
                width={32}
                height={32}
                referrerPolicy="no-referrer"
                loading="lazy"
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
            {isAuthenticated
              ? 'Manage your account and session.'
              : 'Sign in to save progress and join discussions.'}
          </DialogDescription>
        </DialogHeader>

        {authLoading ? (
          <p className="text-sm text-muted-foreground">Checking session...</p>
        ) : isAuthenticated ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground">
                Signed in as <span className="font-medium">{user?.name || user?.email}</span>
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
            <form className="space-y-3" onSubmit={handleProfileSave}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="account-name">
                  Display name
                </label>
                <Input
                  id="account-name"
                  name="account-name"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value)
                    setProfileNotice(null)
                  }}
                  autoComplete="name"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="account-avatar">
                  Avatar URL
                </label>
                <Input
                  id="account-avatar"
                  name="account-avatar"
                  type="url"
                  value={avatarInput}
                  onChange={(event) => {
                    setAvatarInput(event.target.value)
                    setProfileNotice(null)
                  }}
                  autoComplete="url"
                  placeholder="https://example.com/avatar.png"
                />
                <p className="text-xs text-muted-foreground">
                  Use a https URL. Leave blank to remove your avatar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!canSave}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
              {profileNotice && (
                <p
                  className={
                    profileNotice.type === 'error'
                      ? 'text-sm text-destructive'
                      : 'text-sm text-emerald-600'
                  }
                >
                  {profileNotice.message}
                </p>
              )}
            </form>
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
