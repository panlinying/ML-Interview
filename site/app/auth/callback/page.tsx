import { Suspense } from 'react'
import { AuthCallbackClient } from './AuthCallbackClient'

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={(
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Signing you in...</h1>
          <p className="text-sm text-muted-foreground">
            Preparing your session.
          </p>
        </div>
      )}
    >
      <AuthCallbackClient />
    </Suspense>
  )
}
