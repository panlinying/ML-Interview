'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { apiRequest } from '@/lib/api'
import { docHref } from '@/lib/basePath'
import { Button } from '@/components/ui/button'

type DashboardData = {
  current_streak: number
  longest_streak: number
  completion_percentage: number
  total_completed: number
  total_content: number
  total_comments: number
  recent_activity: {
    type: string
    content_slug: string
    completed: boolean
    updated_at: string | null
  }[]
  streak_active_today: boolean
}

type ReviewItem = {
  content_slug: string
  completed: boolean
  review_count: number
  last_reviewed_at: string | null
  next_review_at: string | null
  days_overdue: number
}

function formatRelativeTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getSlugTitle(slug: string): string {
  const parts = slug.split('/')
  return parts[parts.length - 1] || slug
}

export default function DashboardPage() {
  const { user, token, isAuthenticated, isLoading: authLoading, login } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewingSlug, setReviewingSlug] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      apiRequest<DashboardData>('/api/dashboard', { token }),
      apiRequest<ReviewItem[]>('/api/reviews/due', { token })
    ])
      .then(([dashboardData, reviewsData]) => {
        setData(dashboardData)
        setReviews(reviewsData)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, token, authLoading])

  const handleCompleteReview = async (contentSlug: string) => {
    if (!token) return
    setReviewingSlug(contentSlug)
    try {
      await apiRequest('/api/reviews/complete', {
        method: 'POST',
        token,
        body: { content_slug: contentSlug }
      })
      setReviews(prev => prev.filter(r => r.content_slug !== contentSlug))
    } catch {
      // Silently fail
    } finally {
      setReviewingSlug(null)
    }
  }

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Sign in to track your progress and maintain your study streak.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={() => login('github', '/dashboard')}>
              Sign in with GitHub
            </Button>
            <Button variant="outline" onClick={() => login('google', '/dashboard')}>
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading
  if (loading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const progressPercent = Math.min(data.completion_percentage, 100)

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground">
            Track your progress and keep your streak alive
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-3xl font-bold text-foreground">
                {data.current_streak}
                <span className="text-lg font-normal text-muted-foreground ml-1">days</span>
              </p>
            </div>
            <div className={`text-4xl ${data.streak_active_today ? '' : 'grayscale opacity-50'}`}>
              🔥
            </div>
          </div>
          {!data.streak_active_today && data.current_streak > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              Study today to keep your streak!
            </p>
          )}
          {data.longest_streak > data.current_streak && (
            <p className="text-xs text-muted-foreground mt-2">
              Best: {data.longest_streak} days
            </p>
          )}
        </div>

        {/* Progress Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-3xl font-bold text-foreground">
              {data.completion_percentage.toFixed(0)}
              <span className="text-lg font-normal text-muted-foreground">%</span>
            </p>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.total_completed} of {data.total_content} pages completed
            </p>
          </div>
        </div>

        {/* Activity Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div>
            <p className="text-sm text-muted-foreground">Contributions</p>
            <p className="text-3xl font-bold text-foreground">
              {data.total_comments}
              <span className="text-lg font-normal text-muted-foreground ml-1">comments</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Sharing helps you learn better
          </p>
        </div>
      </div>

      {/* Progress Bar Visual */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Journey</h2>
        <div className="relative">
          {/* Week markers */}
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} className={i === 0 ? '' : 'text-center'}>
                {i === 0 ? 'Start' : i === 10 ? 'Goal' : `W${i}`}
              </span>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 relative"
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent > 5 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-primary-foreground">
                  {progressPercent.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Reminders (Spaced Repetition) */}
      {reviews.length > 0 && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/5">
          <div className="px-6 py-4 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-foreground">Due for Review</h2>
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Spaced repetition helps you remember what you learned
            </p>
          </div>
          <div className="divide-y divide-amber-500/20">
            {reviews.slice(0, 5).map((review) => (
              <div
                key={review.content_slug}
                className="flex items-center justify-between px-6 py-3"
              >
                <Link
                  href={docHref(review.content_slug)}
                  className="flex-1 hover:text-primary transition-colors"
                >
                  <span className="text-sm text-foreground">
                    {getSlugTitle(review.content_slug)}
                  </span>
                  {review.days_overdue > 0 && (
                    <span className="text-xs text-amber-600 ml-2">
                      {review.days_overdue}d overdue
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Review #{(review.review_count || 0) + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteReview(review.content_slug)}
                    disabled={reviewingSlug === review.content_slug}
                  >
                    {reviewingSlug === review.content_slug ? 'Saving...' : 'Mark Reviewed'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        </div>
        {data.recent_activity.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>No activity yet. Start learning to track your progress!</p>
            <Link href={docHref('00-Reference/Start Here')}>
              <Button className="mt-4">Start Learning</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.recent_activity.slice(0, 5).map((activity, idx) => (
              <Link
                key={idx}
                href={docHref(activity.content_slug)}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={activity.completed ? 'text-green-500' : 'text-muted-foreground'}>
                    {activity.completed ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-foreground">
                    {getSlugTitle(activity.content_slug)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.updated_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={docHref('00-Reference/Calendar Map')}
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
        >
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              View Calendar
            </h3>
            <p className="text-sm text-muted-foreground">10-week study plan</p>
          </div>
        </Link>

        <Link
          href="/problems"
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
        >
          <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              Problem Tracker
            </h3>
            <p className="text-sm text-muted-foreground">Track LeetCode progress</p>
          </div>
        </Link>

        <Link
          href={docHref('10-Weeks/Week 1')}
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
        >
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              Continue Learning
            </h3>
            <p className="text-sm text-muted-foreground">Pick up where you left off</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
