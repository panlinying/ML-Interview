import Link from 'next/link'
import { homeHref } from '@/lib/basePath'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-8">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild>
          <Link href={homeHref}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </Button>

        <Button variant="outline" asChild>
          <Link href="https://github.com/panlinying/ML-Interview/issues" target="_blank" rel="noopener noreferrer">
            Report Issue
          </Link>
        </Button>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Cmd</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">K</kbd> to search
      </p>
    </div>
  )
}
