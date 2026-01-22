'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

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

type JudgeSummary = {
  total: number
  passed: number
  slow: number
  failed: number
}

type JudgeCaseResult = {
  id: number
  status: string
  time_ms: number
  reason: string | null
  input_text?: string | null
  expected_output?: string | null
  actual_output?: string | null
  stderr?: string | null
  is_hidden: boolean
}

type JudgeResult = {
  status: string
  summary: JudgeSummary
  results: JudgeCaseResult[]
}

type ProblemComplexity = {
  problem_id: string
  optimal_time_complexity: string | null
  optimal_space_complexity: string | null
}

type ProblemSolution = {
  problem_id: string
  solution_code: string
  optimal_time_complexity: string | null
  optimal_space_complexity: string | null
  user_solved: boolean
}

type ProblemStarterCode = {
  problem_id: string
  starter_code: string | null
  optimal_time_complexity: string | null
  optimal_space_complexity: string | null
}

type CodeSource = 'empty' | 'template' | 'starter' | 'notes' | 'storage'

type EditorSettings = {
  theme: string
  tabSize: number
  insertSpaces: boolean
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

const PYTHON_TEMPLATE = `# Python solution
class Solution:
    def solve(self, nums):
        # Your code here
        pass
`

const JUDGE_STATUS_STYLES: Record<string, string> = {
  pass: 'text-green-600',
  pass_slow: 'text-amber-600',
  fail: 'text-red-600',
  slow: 'text-amber-600',
}

const CODE_SOURCE_PRIORITY: Record<CodeSource, number> = {
  empty: 0,
  template: 1,
  starter: 2,
  notes: 3,
  storage: 4,
}

const EDITOR_SETTINGS_KEY = 'practice:editor-settings'

const THEME_OPTIONS = [
  { value: 'vs-dark', label: 'VS Dark' },
  { value: 'vs-light', label: 'VS Light' },
  { value: 'hc-black', label: 'High Contrast' },
]

const INDENT_OPTIONS = [
  { value: 'spaces-2', label: '2 spaces', tabSize: 2, insertSpaces: true },
  { value: 'spaces-4', label: '4 spaces', tabSize: 4, insertSpaces: true },
  { value: 'spaces-8', label: '8 spaces', tabSize: 8, insertSpaces: true },
  { value: 'tabs-2', label: 'Tabs (width 2)', tabSize: 2, insertSpaces: false },
  { value: 'tabs-4', label: 'Tabs (width 4)', tabSize: 4, insertSpaces: false },
  { value: 'tabs-8', label: 'Tabs (width 8)', tabSize: 8, insertSpaces: false },
]

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

function extractCodeFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null
  const regex = /```(?:python)?\r?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  let lastMatch: string | null = null
  while ((match = regex.exec(notes)) !== null) {
    lastMatch = match[1]
  }
  return lastMatch ? lastMatch.replace(/\s+$/, '') : null
}

function getIndentOptionValue(tabSize: number, insertSpaces: boolean): string {
  const key = `${insertSpaces ? 'spaces' : 'tabs'}-${tabSize}`
  return INDENT_OPTIONS.some(option => option.value === key) ? key : 'spaces-4'
}

function PracticeContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('problem') || ''
  const { token, isAuthenticated, isLoading: authLoading, login } = useAuth()

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [isCodeReady, setIsCodeReady] = useState(false)
  const [, setCodeSource] = useState<CodeSource>('empty')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('not_started')
  const [saving, setSaving] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [problemDetail, setProblemDetail] = useState<ProblemDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null)
  const [judgeLoading, setJudgeLoading] = useState(false)
  const [judgeError, setJudgeError] = useState<string | null>(null)
  const [judgeMode, setJudgeMode] = useState<'run' | 'submit' | null>(null)
  const [complexity, setComplexity] = useState<ProblemComplexity | null>(null)
  const [starterCode, setStarterCode] = useState<string | null>(null)
  const [solution, setSolution] = useState<ProblemSolution | null>(null)
  const [solutionLoading, setSolutionLoading] = useState(false)
  const [solutionError, setSolutionError] = useState<string | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [settingsHydrated, setSettingsHydrated] = useState(false)
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [tabSize, setTabSize] = useState(4)
  const [insertSpaces, setInsertSpaces] = useState(true)

  const codeSourceRef = useRef<CodeSource>('empty')

  const problemInfo = parseLeetCodeSlug(slug)
  const problemId = `lc-${slug}`
  const leetcodeUrl = `https://leetcode.com/problems/${slug}/`
  const headerTitle = problemInfo.fullName || problemDetail?.title || 'Practice Problem'
  const displayDifficulty = problem?.difficulty || problemDetail?.difficulty || null
  const codeStorageKey = slug ? `practice:code:${problemId}` : null
  const indentValue = getIndentOptionValue(tabSize, insertSpaces)

  const applyCode = useCallback((nextCode: string, nextSource: CodeSource) => {
    const currentSource = codeSourceRef.current
    if (CODE_SOURCE_PRIORITY[nextSource] <= CODE_SOURCE_PRIORITY[currentSource]) return
    codeSourceRef.current = nextSource
    setCodeSource(nextSource)
    setCode(nextCode)
    setIsCodeReady(true)
  }, [])
  const handleIndentChange = useCallback((value: string) => {
    const selected = INDENT_OPTIONS.find(option => option.value === value)
    if (!selected) return
    setTabSize(selected.tabSize)
    setInsertSpaces(selected.insertSpaces)
  }, [])
  const handleReset = useCallback(() => {
    const nextCode = starterCode || PYTHON_TEMPLATE
    const nextSource: CodeSource = starterCode ? 'starter' : 'template'
    codeSourceRef.current = nextSource
    setCodeSource(nextSource)
    setCode(nextCode)
    setIsCodeReady(true)
  }, [starterCode])

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

  useEffect(() => {
    codeSourceRef.current = 'empty'
    setCodeSource('empty')
    setCode('')
    setIsCodeReady(false)
  }, [slug])

  useEffect(() => {
    if (!codeStorageKey) return
    const stored = localStorage.getItem(codeStorageKey)
    if (stored !== null) {
      applyCode(stored, 'storage')
    }
  }, [codeStorageKey, applyCode])

  useEffect(() => {
    if (!codeStorageKey || !isCodeReady) return
    localStorage.setItem(codeStorageKey, code)
  }, [codeStorageKey, code, isCodeReady])

  useEffect(() => {
    const storedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY)
    if (!storedSettings) {
      setSettingsHydrated(true)
      return
    }
    try {
      const parsed = JSON.parse(storedSettings) as Partial<EditorSettings>
      if (parsed.theme && THEME_OPTIONS.some(option => option.value === parsed.theme)) {
        setEditorTheme(parsed.theme)
      }
      if (typeof parsed.tabSize === 'number' && [2, 4, 8].includes(parsed.tabSize)) {
        setTabSize(parsed.tabSize)
      }
      if (typeof parsed.insertSpaces === 'boolean') {
        setInsertSpaces(parsed.insertSpaces)
      }
    } catch {
      setSettingsHydrated(true)
      return
    }
    setSettingsHydrated(true)
  }, [])

  useEffect(() => {
    if (!settingsHydrated) return
    const payload: EditorSettings = {
      theme: editorTheme,
      tabSize,
      insertSpaces,
    }
    localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(payload))
  }, [editorTheme, tabSize, insertSpaces, settingsHydrated])

  // Load starter code and complexity info
  useEffect(() => {
    if (!slug) return

    apiRequest<ProblemStarterCode>(`/api/problems/${problemId}/starter`)
      .then(data => {
        setStarterCode(data.starter_code)
        setComplexity({
          problem_id: data.problem_id,
          optimal_time_complexity: data.optimal_time_complexity,
          optimal_space_complexity: data.optimal_space_complexity,
        })
      })
      .catch(() => {
        setStarterCode(null)
        setComplexity(null)
      })
  }, [slug, problemId])

  // Update code when starter code loads
  useEffect(() => {
    if (starterCode) {
      applyCode(starterCode, 'starter')
    }
  }, [starterCode, applyCode])

  // Load existing problem data
  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    if (authLoading) return
    if (!isAuthenticated || !token) {
      setLoading(false)
      applyCode(PYTHON_TEMPLATE, 'template')
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
          const extractedCode = extractCodeFromNotes(existing.notes)
          if (extractedCode) {
            applyCode(extractedCode, 'notes')
          }
        }
        applyCode(PYTHON_TEMPLATE, 'template')
      })
      .catch(() => {
        applyCode(PYTHON_TEMPLATE, 'template')
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, token, authLoading, problemId, slug, applyCode])

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
            notes: `${notes}\n\n---\n\n**Code (Python):**\n\`\`\`python\n${code}\n\`\`\``.trim(),
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
            notes: `**Code (Python):**\n\`\`\`python\n${code}\n\`\`\``,
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
  }, [token, problem, problemId, problemInfo.fullName, problemInfo.name, status, notes, code, timer, slug])

  const handleJudge = useCallback(async (mode: 'run' | 'submit') => {
    if (!token || !slug) return
    setJudgeLoading(true)
    setJudgeMode(mode)
    setJudgeError(null)
    setJudgeResult(null)

    try {
      const result = await apiRequest<JudgeResult>(`/api/problems/${problemId}/${mode}`, {
        method: 'POST',
        token,
        body: {
          code,
          language: 'python',
        },
      })
      setJudgeResult(result)
    } catch (err) {
      setJudgeError(err instanceof Error ? err.message : 'Failed to run tests')
    } finally {
      setJudgeLoading(false)
      setJudgeMode(null)
    }
  }, [token, slug, problemId, code])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleViewSolution = useCallback(async () => {
    if (!token || !slug) return
    if (solution) {
      setShowSolution(true)
      return
    }

    setSolutionLoading(true)
    setSolutionError(null)

    try {
      const result = await apiRequest<ProblemSolution>(`/api/problems/${problemId}/solution`, {
        token,
      })
      setSolution(result)
      setShowSolution(true)
    } catch (err) {
      setSolutionError(err instanceof Error ? err.message : 'Failed to load solution')
    } finally {
      setSolutionLoading(false)
    }
  }, [token, slug, problemId, solution])

  // Check if user has attempted (can view solution)
  const hasAttempted = problem && problem.status !== 'not_started'

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

            {/* Optimal Complexity */}
            {complexity && (
              <div className="mt-6 p-4 rounded-lg border border-border bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <h3 className="text-base font-medium mb-3">Optimal Complexity</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <span className="ml-2 font-mono font-medium text-blue-500">
                      {complexity.optimal_time_complexity || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Space:</span>
                    <span className="ml-2 font-mono font-medium text-purple-500">
                      {complexity.optimal_space_complexity || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* View Solution Button */}
            {isAuthenticated && (
              <div className="mt-6">
                {hasAttempted ? (
                  <Button
                    variant="outline"
                    onClick={handleViewSolution}
                    disabled={solutionLoading}
                    className="w-full"
                  >
                    {solutionLoading ? 'Loading...' : showSolution ? 'Hide Solution' : 'View Solution'}
                  </Button>
                ) : (
                  <div className="p-3 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground text-center">
                    Submit at least one attempt to unlock the solution
                  </div>
                )}
                {solutionError && (
                  <p className="mt-2 text-sm text-red-500">{solutionError}</p>
                )}
              </div>
            )}

            {/* Solution Display */}
            {showSolution && solution && (
              <div className="mt-4 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium text-green-600">Reference Solution</h3>
                  <button
                    onClick={() => setShowSolution(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <pre className="p-3 rounded bg-[#1e1e1e] text-[#d4d4d4] text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                  {solution.solution_code}
                </pre>
                {solution.user_solved && (
                  <p className="mt-3 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    You solved this problem!
                  </p>
                )}
              </div>
            )}

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
          {/* Language Label */}
          <div className="flex-shrink-0 border-b border-border px-4 py-2 bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground">
                  Python
                </span>
                <span className="text-xs text-muted-foreground">
                  Write your solution using Python 3
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label className="text-muted-foreground" htmlFor="editor-theme">
                  Theme
                </label>
                <select
                  id="editor-theme"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  value={editorTheme}
                  onChange={e => setEditorTheme(e.target.value)}
                >
                  {THEME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <label className="text-muted-foreground" htmlFor="editor-indent">
                  Indent
                </label>
                <select
                  id="editor-indent"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  value={indentValue}
                  onChange={e => handleIndentChange(e.target.value)}
                >
                  {INDENT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              width="100%"
              defaultLanguage="python"
              theme={editorTheme}
              value={code}
              onChange={value => setCode(value ?? '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                tabSize,
                insertSpaces,
                detectIndentation: false,
                automaticLayout: true,
              }}
              loading={<div className="p-4 text-sm text-muted-foreground">Loading editor...</div>}
            />
          </div>

          {/* Judge Results */}
          {(judgeLoading || judgeError || judgeResult) && (
            <div className="border-t border-border bg-muted/20 px-4 py-3 text-sm">
              {judgeLoading && (
                <div className="text-muted-foreground">Running tests...</div>
              )}
              {judgeError && (
                <div className="text-red-500">{judgeError}</div>
              )}
              {judgeResult && (
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`font-medium ${JUDGE_STATUS_STYLES[judgeResult.status] || 'text-foreground'}`}>
                      {judgeResult.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-muted-foreground">
                      {judgeResult.summary.passed}/{judgeResult.summary.total} passed
                      {judgeResult.summary.slow > 0 ? ` • ${judgeResult.summary.slow} slow` : ''}
                      {judgeResult.summary.failed > 0 ? ` • ${judgeResult.summary.failed} failed` : ''}
                    </div>
                  </div>
                  <div className="mt-3 space-y-3 max-h-48 overflow-auto">
                    {judgeResult.results.map((result, index) => (
                      <div key={result.id} className="border border-border rounded-lg p-3 bg-background/40">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold ${JUDGE_STATUS_STYLES[result.status] || 'text-foreground'}`}>
                            {result.is_hidden ? 'Hidden case' : 'Case'} {index + 1}: {result.status.toUpperCase()}
                          </span>
                          <span className="text-muted-foreground">{result.time_ms} ms</span>
                        </div>
                        {result.reason && (
                          <div className="text-xs text-muted-foreground mt-1">Reason: {result.reason}</div>
                        )}
                        {result.input_text !== undefined && result.input_text !== null && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground">Input</div>
                            <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/60 p-2 text-xs text-foreground">
                              {result.input_text}
                            </pre>
                          </div>
                        )}
                        {result.expected_output !== undefined && result.expected_output !== null && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground">Expected</div>
                            <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/60 p-2 text-xs text-foreground">
                              {result.expected_output}
                            </pre>
                          </div>
                        )}
                        {result.actual_output !== undefined && result.actual_output !== null && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground">Actual</div>
                            <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/60 p-2 text-xs text-foreground">
                              {result.actual_output}
                            </pre>
                          </div>
                        )}
                        {result.stderr && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground">stderr</div>
                            <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/60 p-2 text-xs text-foreground">
                              {result.stderr}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex-shrink-0 border-t border-border px-4 py-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Python</span>
                <span>•</span>
                <span>{code.split('\n').length} lines</span>
              </div>
              <div className="flex gap-2">
                {isAuthenticated ? (
                  <>
                    <Button
                      size="sm"
                      disabled={judgeLoading}
                      onClick={() => handleJudge('run')}
                    >
                      {judgeLoading && judgeMode === 'run' ? 'Running...' : 'Run'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={judgeLoading}
                      onClick={() => handleJudge('submit')}
                    >
                      {judgeLoading && judgeMode === 'submit' ? 'Submitting...' : 'Submit'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => login('github', `/practice?problem=${slug}`)} size="sm">
                    Sign in to Run
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
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
