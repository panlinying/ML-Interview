'use client'

import { useEffect, useState } from 'react'
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

type ProblemStats = {
  total: number
  solved: number
  attempted: number
  need_review: number
  by_difficulty: Record<string, { total: number; solved: number }>
  by_pattern: Record<string, { total: number; solved: number }>
  total_time_minutes: number
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'text-muted-foreground' },
  attempted: { label: 'Attempted', color: 'text-amber-500' },
  solved: { label: 'Solved', color: 'text-green-500' },
  need_review: { label: 'Need Review', color: 'text-blue-500' },
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-500 bg-green-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  hard: 'text-red-500 bg-red-500/10',
}

const COMMON_PATTERNS = [
  'two-pointers',
  'sliding-window',
  'binary-search',
  'dfs',
  'bfs',
  'dynamic-programming',
  'backtracking',
  'heap',
  'stack',
  'linked-list',
  'tree',
  'graph',
  'greedy',
  'math',
]

export default function ProblemsPage() {
  const { token, isAuthenticated, isLoading: authLoading, login } = useAuth()
  const [problems, setProblems] = useState<Problem[]>([])
  const [stats, setStats] = useState<ProblemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('')
  const [filterPattern, setFilterPattern] = useState<string>('')

  // Add problem form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProblem, setNewProblem] = useState({
    problem_id: '',
    problem_name: '',
    difficulty: 'medium',
    pattern: '',
    status: 'not_started',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Edit problem
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<string>('')

  const fetchData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterDifficulty) params.set('difficulty', filterDifficulty)
      if (filterPattern) params.set('pattern', filterPattern)

      const [problemsData, statsData] = await Promise.all([
        apiRequest<Problem[]>(`/api/problems?${params}`, { token }),
        apiRequest<ProblemStats>('/api/problems/stats', { token }),
      ])
      setProblems(problemsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }
    fetchData()
  }, [isAuthenticated, token, authLoading, filterStatus, filterDifficulty, filterPattern])

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newProblem.problem_id || !newProblem.problem_name) return

    setSubmitting(true)
    try {
      const created = await apiRequest<Problem>('/api/problems', {
        method: 'POST',
        token,
        body: {
          problem_id: newProblem.problem_id,
          problem_name: newProblem.problem_name,
          difficulty: newProblem.difficulty || null,
          pattern: newProblem.pattern || null,
          status: newProblem.status,
          notes: newProblem.notes || null,
        },
      })
      setProblems(prev => [created, ...prev])
      setNewProblem({
        problem_id: '',
        problem_name: '',
        difficulty: 'medium',
        pattern: '',
        status: 'not_started',
        notes: '',
      })
      setShowAddForm(false)
      fetchData() // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add problem')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (problemId: string, status: string) => {
    if (!token) return
    try {
      const updated = await apiRequest<Problem>(`/api/problems/${problemId}`, {
        method: 'PATCH',
        token,
        body: { status },
      })
      setProblems(prev => prev.map(p => (p.problem_id === problemId ? updated : p)))
      setEditingId(null)
      fetchData() // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleDelete = async (problemId: string) => {
    if (!token || !confirm('Delete this problem?')) return
    try {
      await apiRequest(`/api/problems/${problemId}`, {
        method: 'DELETE',
        token,
      })
      setProblems(prev => prev.filter(p => p.problem_id !== problemId))
      fetchData() // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Problem Tracker</h1>
          <p className="text-muted-foreground">
            Sign in to track your LeetCode and coding problem progress.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={() => login('github', '/problems')}>
              Sign in with GitHub
            </Button>
            <Button variant="outline" onClick={() => login('google', '/problems')}>
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
      <div className="max-w-5xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Problem Tracker</h1>
          <p className="text-muted-foreground">Track your LeetCode progress</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
          <Button onClick={() => setShowAddForm(true)}>Add Problem</Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <p className="text-sm text-green-600">Solved</p>
            <p className="text-2xl font-bold text-green-500">{stats.solved}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-600">Attempted</p>
            <p className="text-2xl font-bold text-amber-500">{stats.attempted}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Time Spent</p>
            <p className="text-2xl font-bold text-foreground">
              {Math.floor(stats.total_time_minutes / 60)}h {stats.total_time_minutes % 60}m
            </p>
          </div>
        </div>
      )}

      {/* Difficulty Breakdown */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {['easy', 'medium', 'hard'].map(diff => {
            const data = stats.by_difficulty[diff] || { total: 0, solved: 0 }
            const pct = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0
            return (
              <div key={diff} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium capitalize ${DIFFICULTY_COLORS[diff]?.split(' ')[0]}`}>
                    {diff}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {data.solved}/{data.total}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${diff === 'easy' ? 'bg-green-500' : diff === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="px-3 py-2 rounded-md border border-border bg-background text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 rounded-md border border-border bg-background text-sm"
          value={filterDifficulty}
          onChange={e => setFilterDifficulty(e.target.value)}
        >
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          className="px-3 py-2 rounded-md border border-border bg-background text-sm"
          value={filterPattern}
          onChange={e => setFilterPattern(e.target.value)}
        >
          <option value="">All Patterns</option>
          {COMMON_PATTERNS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {(filterStatus || filterDifficulty || filterPattern) && (
          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setFilterStatus('')
              setFilterDifficulty('')
              setFilterPattern('')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Add Problem Form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Add Problem</h2>
          <form onSubmit={handleAddProblem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Problem ID</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background"
                  placeholder="lc-1 or lc-two-sum"
                  value={newProblem.problem_id}
                  onChange={e => setNewProblem(p => ({ ...p, problem_id: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Problem Name</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background"
                  placeholder="Two Sum"
                  value={newProblem.problem_name}
                  onChange={e => setNewProblem(p => ({ ...p, problem_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Difficulty</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background"
                  value={newProblem.difficulty}
                  onChange={e => setNewProblem(p => ({ ...p, difficulty: e.target.value }))}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Pattern</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background"
                  value={newProblem.pattern}
                  onChange={e => setNewProblem(p => ({ ...p, pattern: e.target.value }))}
                >
                  <option value="">Select pattern</option>
                  {COMMON_PATTERNS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background"
                  value={newProblem.status}
                  onChange={e => setNewProblem(p => ({ ...p, status: e.target.value }))}
                >
                  {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Notes (optional)</label>
              <Textarea
                className="mt-1"
                placeholder="Key insights, approach, etc."
                value={newProblem.notes}
                onChange={e => setNewProblem(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Problem'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Problems List */}
      <div className="rounded-lg border border-border bg-card">
        {problems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No problems tracked yet.</p>
            <Button className="mt-4" onClick={() => setShowAddForm(true)}>
              Add Your First Problem
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {problems.map(problem => (
              <div key={problem.problem_id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{problem.problem_name}</span>
                      <span className="text-xs text-muted-foreground">({problem.problem_id})</span>
                      {problem.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[problem.difficulty] || ''}`}>
                          {problem.difficulty}
                        </span>
                      )}
                      {problem.pattern && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {problem.pattern}
                        </span>
                      )}
                    </div>
                    {problem.notes && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {problem.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === problem.problem_id ? (
                      <>
                        <select
                          className="px-2 py-1 rounded border border-border bg-background text-sm"
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(problem.problem_id, editStatus)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className={`text-sm font-medium ${STATUS_LABELS[problem.status]?.color || ''}`}>
                          {STATUS_LABELS[problem.status]?.label || problem.status}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(problem.problem_id)
                            setEditStatus(problem.status)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(problem.problem_id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
