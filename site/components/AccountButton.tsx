'use client'

import Image from 'next/image'
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
  } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const startOAuth = async (provider: 'github' | 'google') => {
    await login(provider, pathname || undefined)
  }

  const initials = getInitials(user?.name, user?.email)
  const avatarUrl = user?.image?.trim()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account">
          {isAuthenticated ? (
            avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user?.name || user?.email || 'User avatar'}
                className="h-8 w-8 rounded-full object-cover"
                width={32}
                height={32}
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
            {isAuthenticated
              ? 'Manage your account and session.'
              : 'Sign in to save progress and join discussions.'}
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
