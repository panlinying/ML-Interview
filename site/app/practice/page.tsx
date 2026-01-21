'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Problem = {
  id: number
  problem_id: string
  problem_name: string
  difficulty: string | null
  pattern: string | null
  status: string
  notes: string | null
  time_spent_minutes: number
  attempts: number
  last_attempted_at: string | null
  solved_at: string | null
  created_at: string
}

type ProblemDetail = {
  slug: string
  title: string
  description_html: string
  difficulty: string | null
  source: string
  fetched_at: string | null
  updated_at: string | null
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-500 bg-green-500/10 border-green-500/30',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  hard: 'text-red-500 bg-red-500/10 border-red-500/30',
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'solved', label: 'Solved' },
  { value: 'need_review', label: 'Need Review' },
]

const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `# Python solution
class Solution:
    def solve(self, nums):
        # Your code here
        pass
`,
}

function parseLeetCodeSlug(slug: string): { number: string; name: string; fullName: string } {
  const decoded = decodeURIComponent(slug)
  const parts = decoded.split('-')
  const firstIsNumber = /^\d+$/.test(parts[0])
  const number = firstIsNumber ? parts[0] : ''
  const nameParts = firstIsNumber ? parts.slice(1) : parts
  const name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')

  return {
    number,
    name,
    fullName: number ? `${number}. ${name}` : name,
  }
}

function guessDifficulty(name: string): string | null {
  const easyKeywords = ['two sum', 'reverse', 'palindrome', 'valid', 'maximum depth', 'same tree']
  const hardKeywords = ['median', 'merge k', 'edit distance', 'word ladder']
  const lower = name.toLowerCase()
  if (easyKeywords.some(k => lower.includes(k))) return 'easy'
  if (hardKeywords.some(k => lower.includes(k))) return 'hard'
  return 'medium'
}

function PracticeContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('problem') || ''
  const { token, isAuthenticated, isLoading: authLoading, login } = useAuth()

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('not_started')
  const [saving, setSaving] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [problemDetail, setProblemDetail] = useState<ProblemDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const problemInfo = parseLeetCodeSlug(slug)
  const problemId = `lc-${slug}`
  const leetcodeUrl = `https://leetcode.com/problems/${slug}/`
  const headerTitle = problemInfo.fullName || problemDetail?.title || 'Practice Problem'
  const displayDifficulty = problem?.difficulty || problemDetail?.difficulty || null

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  useEffect(() => {
    if (!slug) {
      setProblemDetail(null)
      setDetailLoading(false)
      setDetailError(null)
      return
    }

    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    setProblemDetail(null)

    apiRequest<ProblemDetail>(`/api/problem-details/${encodeURIComponent(slug)}`)
      .then(detail => {
        if (!cancelled) {
          setProblemDetail(detail)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : 'Failed to load description')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  // Load existing problem data
  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    if (authLoading) return
    if (!isAuthenticated || !token) {
      setLoading(false)
      setCode(LANGUAGE_TEMPLATES[language])
      return
    }

    apiRequest<Problem[]>('/api/problems', { token })
      .then(problems => {
        const existing = problems.find(p => p.problem_id === problemId)
        if (existing) {
          setProblem(existing)
          setStatus(existing.status)
          setNotes(existing.notes || '')
          setTimer((existing.time_spent_minutes || 0) * 60)
        }
        setCode(LANGUAGE_TEMPLATES[language])
      })
      .catch(() => {
        setCode(LANGUAGE_TEMPLATES[language])
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, token, authLoading, problemId, slug, language])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    if (!code || Object.values(LANGUAGE_TEMPLATES).some(t => code.trim() === t.trim())) {
      setCode(LANGUAGE_TEMPLATES[newLang])
    }
  }

  const handleSave = useCallback(async () => {
    if (!token || !slug) return
    setSaving(true)

    const timeMinutes = Math.floor(timer / 60)

    try {
      if (problem) {
        const updated = await apiRequest<Problem>(`/api/problems/${problemId}`, {
          method: 'PATCH',
          token,
          body: {
            status,
            notes: `${notes}\n\n---\n\n**Code (${language}):**\n\`\`\`${language}\n${code}\n\`\`\``.trim(),
            time_spent_minutes: timeMinutes,
          },
        })
        setProblem(updated)
      } else {
        const created = await apiRequest<Problem>('/api/problems', {
          method: 'POST',
          token,
          body: {
            problem_id: problemId,
            problem_name: problemInfo.fullName,
            difficulty: guessDifficulty(problemInfo.name),
            pattern: null,
            status,
            notes: `**Code (${language}):**\n\`\`\`${language}\n${code}\n\`\`\``,
            time_spent_minutes: timeMinutes,
          },
        })
        setProblem(created)
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }, [token, problem, problemId, problemInfo.fullName, problemInfo.name, status, notes, code, language, timer, slug])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // No problem selected
  if (!slug) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Practice Page</h1>
          <p className="text-muted-foreground">
            Select a LeetCode problem from the curriculum to start practicing.
          </p>
          <Link href="/problems">
            <Button>View Problem Tracker</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Loading
  if (loading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/problems" className="text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {headerTitle}
              </h1>
              <div className="flex items-center gap-2 text-sm">
                {displayDifficulty && (
                  <span className={`px-2 py-0.5 rounded border text-xs ${DIFFICULTY_COLORS[displayDifficulty] || ''}`}>
                    {displayDifficulty}
                  </span>
                )}
                {problem?.pattern && (
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                    {problem.pattern}
                  </span>
                )}
                <a
                  href={leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <span>View on LeetCode</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <span className="font-mono text-sm">{formatTime(timer)}</span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="text-muted-foreground hover:text-foreground"
              >
                {timerRunning ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            {/* Status */}
            <select
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Save */}
            {isAuthenticated ? (
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save Progress'}
              </Button>
            ) : (
              <Button onClick={() => login('github', `/practice?problem=${slug}`)} size="sm">
                Sign in to Save
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 border-r border-border overflow-auto p-6">
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-li:my-1">
            {detailLoading && (
              <p className="text-muted-foreground">Loading description...</p>
            )}
            {detailError && (
              <p className="text-sm text-red-500">
                Failed to load the description. View it on{' '}
                <a href={leetcodeUrl} target="_blank" rel="noopener noreferrer">
                  LeetCode
                </a>
                .
              </p>
            )}
            {!detailLoading && !detailError && problemDetail && (
              <div
                className="leetcode-content"
                dangerouslySetInnerHTML={{ __html: problemDetail.description_html }}
              />
            )}
            {!detailLoading && !detailError && !problemDetail && (
              <p className="text-muted-foreground">
                Description not available yet. View the full problem description on{' '}
                <a href={leetcodeUrl} target="_blank" rel="noopener noreferrer">
                  LeetCode
                </a>
                .
              </p>
            )}

            <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="text-base font-medium mb-2">Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Read the problem carefully on LeetCode</li>
                <li>Think about edge cases before coding</li>
                <li>Start with a brute force approach, then optimize</li>
                <li>Use the timer to track your practice time</li>
              </ul>
            </div>

            {/* Notes Section */}
            <div className="mt-6">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Notes
              </button>
              {showNotes && (
                <Textarea
                  className="mt-2 min-h-[150px] font-mono text-sm"
                  placeholder="Add your notes, approach, complexity analysis..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              )}
            </div>

            {/* Problem Stats */}
            {problem && (
              <div className="mt-6 p-4 rounded-lg border border-border">
                <h3 className="text-base font-medium mb-3">Your Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Attempts:</span>
                    <span className="ml-2 font-medium">{problem.attempts}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time Spent:</span>
                    <span className="ml-2 font-medium">{problem.time_spent_minutes}m</span>
                  </div>
                  {problem.solved_at && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">First Solved:</span>
                      <span className="ml-2 font-medium text-green-500">
                        {new Date(problem.solved_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Language Selector */}
          <div className="flex-shrink-0 border-b border-border px-4 py-2 bg-muted/30">
            <div className="flex gap-2">
              {Object.keys(LANGUAGE_TEMPLATES).map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    language === lang
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <textarea
              className="w-full h-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm resize-none focus:outline-none"
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              placeholder="Write your solution here..."
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex-shrink-0 border-t border-border px-4 py-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Language: {language}</span>
                <span>•</span>
                <span>{code.split('\n').length} lines</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCode(LANGUAGE_TEMPLATES[language])}
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(code)}
                >
                  Copy Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  )
}
