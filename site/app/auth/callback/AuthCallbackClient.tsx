'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { setStoredToken } from '@/lib/auth'

export function AuthCallbackClient() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = params.get('token')
    const returnTo = params.get('returnTo')

    if (!token) {
      setError('Missing token. Please retry login.')
      return
    }

    setStoredToken(token)

    const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : '/'
    router.replace(safeReturnTo)
  }, [params, router])

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Signing you in...</h1>
      {error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Redirecting to your content.
        </p>
      )}
    </div>
  )
}
