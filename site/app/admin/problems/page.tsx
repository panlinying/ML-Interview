'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type AdminProblemItem = {
  problem_id: string
  slug: string
  title: string | null
  difficulty: string | null
  has_description: boolean
  has_solution: boolean
  has_starter_code: boolean
  test_case_count: number
  optimal_time_complexity: string | null
  optimal_space_complexity: string | null
}

type ProblemReference = {
  id: number
  problem_id: string
  language: string
  solution_code: string
  optimal_time_complexity: string | null
  optimal_space_complexity: string | null
  created_at: string
  updated_at: string | null
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

type ProblemTestCase = {
  id: number
  problem_id: string
  input_text: string
  expected_output: string
  is_hidden: boolean
  time_limit_ms: number
  slow_limit_ms: number
  created_at: string
  updated_at: string | null
}

type EditableTestCase = {
  id: number
  input_text: string
  expected_output: string
  is_hidden: boolean
  time_limit_ms: string
  slow_limit_ms: string
}

type StarterCodeResponse = {
  problem_id: string
  starter_code: string | null
  optimal_time_complexity: string | null
  optimal_space_complexity: string | null
}

type ReferenceRunResponse = {
  output: string
  time_ms: number
  stderr?: string | null
}

type Message = { type: 'error' | 'success' | 'info'; text: string }

function toOptionalInt(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed)) return undefined
  return parsed
}

export default function AdminProblemsPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()

  const [adminSecret, setAdminSecret] = useState('')
  const [message, setMessage] = useState<Message | null>(null)

  // Problem list
  const [problems, setProblems] = useState<AdminProblemItem[]>([])
  const [problemsLoading, setProblemsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Selected problem
  const [selectedProblem, setSelectedProblem] = useState<AdminProblemItem | null>(null)

  // Problem detail fields
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailSaving, setDetailSaving] = useState(false)

  // Reference solution fields
  const [referenceCode, setReferenceCode] = useState('')
  const [starterCode, setStarterCode] = useState('')
  const [timeComplexity, setTimeComplexity] = useState('')
  const [spaceComplexity, setSpaceComplexity] = useState('')
  const [referenceLoading, setReferenceLoading] = useState(false)
  const [referenceSaving, setReferenceSaving] = useState(false)
  const [starterSaving, setStarterSaving] = useState(false)

  // Test cases
  const [testsLoading, setTestsLoading] = useState(false)
  const [testCases, setTestCases] = useState<EditableTestCase[]>([])
  const [savingTestId, setSavingTestId] = useState<number | null>(null)
  const [deletingTestId, setDeletingTestId] = useState<number | null>(null)
  const [generatingTestId, setGeneratingTestId] = useState<number | null>(null)

  // New test case
  const [newInput, setNewInput] = useState('')
  const [newExpected, setNewExpected] = useState('')
  const [newHidden, setNewHidden] = useState(false)
  const [newTimeLimit, setNewTimeLimit] = useState('')
  const [newSlowLimit, setNewSlowLimit] = useState('')
  const [newGenerating, setNewGenerating] = useState(false)
  const [newCreating, setNewCreating] = useState(false)

  const adminHeaders = useMemo((): Record<string, string> => {
    return adminSecret ? { 'X-Admin-Secret': adminSecret } : {}
  }, [adminSecret])

  // Load problem list
  const loadProblems = useCallback(async () => {
    if (!adminSecret.trim()) {
      setMessage({ type: 'error', text: 'Admin secret is required.' })
      return
    }
    setProblemsLoading(true)
    setMessage(null)
    try {
      const response = await apiRequest<{ problems: AdminProblemItem[]; total: number }>(
        '/api/admin/problems',
        { headers: adminHeaders }
      )
      setProblems(response.problems)
      setMessage({ type: 'success', text: `Loaded ${response.total} problems` })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to load problems'
      setMessage({ type: 'error', text })
    } finally {
      setProblemsLoading(false)
    }
  }, [adminSecret, adminHeaders])

  // Load selected problem details
  const loadProblemDetails = useCallback(async (problem: AdminProblemItem) => {
    setSelectedProblem(problem)
    setDetailLoading(true)
    setReferenceLoading(true)
    setTestsLoading(true)
    setMessage(null)

    // Load problem detail (description)
    try {
      const detail = await apiRequest<ProblemDetail>(
        `/api/problem-details/${problem.slug}`,
        { headers: adminHeaders }
      )
      setTitle(detail.title || '')
      setDifficulty(detail.difficulty || '')
      setDescriptionHtml(detail.description_html || '')
    } catch {
      setTitle(problem.title || '')
      setDifficulty(problem.difficulty || '')
      setDescriptionHtml('')
    } finally {
      setDetailLoading(false)
    }

    // Load reference solution
    try {
      const ref = await apiRequest<ProblemReference>(
        `/api/problems/${problem.problem_id}/reference`,
        { headers: adminHeaders }
      )
      setReferenceCode(ref.solution_code || '')
      setTimeComplexity(ref.optimal_time_complexity || '')
      setSpaceComplexity(ref.optimal_space_complexity || '')
    } catch {
      setReferenceCode('')
      setTimeComplexity('')
      setSpaceComplexity('')
    }

    // Load starter code
    try {
      const starter = await apiRequest<StarterCodeResponse>(
        `/api/problems/${problem.problem_id}/starter`
      )
      setStarterCode(starter.starter_code || '')
    } catch {
      setStarterCode('')
    } finally {
      setReferenceLoading(false)
    }

    // Load test cases
    try {
      const tests = await apiRequest<ProblemTestCase[]>(
        `/api/problems/${problem.problem_id}/tests`,
        { headers: adminHeaders }
      )
      setTestCases(
        tests.map(test => ({
          id: test.id,
          input_text: test.input_text,
          expected_output: test.expected_output,
          is_hidden: test.is_hidden,
          time_limit_ms: String(test.time_limit_ms ?? ''),
          slow_limit_ms: String(test.slow_limit_ms ?? ''),
        }))
      )
    } catch {
      setTestCases([])
    } finally {
      setTestsLoading(false)
    }
  }, [adminHeaders])

  // Save problem detail
  const saveDetail = useCallback(async () => {
    if (!selectedProblem) return
    setDetailSaving(true)
    setMessage(null)
    try {
      await apiRequest<ProblemDetail>(
        `/api/admin/problem-details/${selectedProblem.slug}`,
        {
          method: 'PUT',
          headers: adminHeaders,
          body: {
            title: title || null,
            description_html: descriptionHtml || null,
            difficulty: difficulty || null,
          },
        }
      )
      setMessage({ type: 'success', text: 'Problem details saved.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to save details'
      setMessage({ type: 'error', text })
    } finally {
      setDetailSaving(false)
    }
  }, [selectedProblem, adminHeaders, title, descriptionHtml, difficulty])

  // Save reference solution
  const saveReference = useCallback(async () => {
    if (!selectedProblem) return
    if (!referenceCode.trim()) {
      setMessage({ type: 'error', text: 'Reference solution code is required.' })
      return
    }
    setReferenceSaving(true)
    setMessage(null)
    try {
      await apiRequest<ProblemReference>(
        `/api/problems/${selectedProblem.problem_id}/reference`,
        {
          method: 'PUT',
          headers: adminHeaders,
          body: {
            solution_code: referenceCode,
            optimal_time_complexity: timeComplexity || null,
            optimal_space_complexity: spaceComplexity || null,
            language: 'python',
          },
        }
      )
      setMessage({ type: 'success', text: 'Reference solution saved.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to save reference solution'
      setMessage({ type: 'error', text })
    } finally {
      setReferenceSaving(false)
    }
  }, [selectedProblem, adminHeaders, referenceCode, timeComplexity, spaceComplexity])

  // Save starter code
  const saveStarterCode = useCallback(async () => {
    if (!selectedProblem) return
    setStarterSaving(true)
    setMessage(null)
    try {
      await apiRequest<StarterCodeResponse>(
        `/api/admin/problems/${selectedProblem.problem_id}/starter`,
        {
          method: 'PATCH',
          headers: adminHeaders,
          body: { starter_code: starterCode },
        }
      )
      setMessage({ type: 'success', text: 'Starter code saved.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to save starter code'
      setMessage({ type: 'error', text })
    } finally {
      setStarterSaving(false)
    }
  }, [selectedProblem, adminHeaders, starterCode])

  // Test case operations
  const updateTestCase = useCallback(async (test: EditableTestCase) => {
    if (!selectedProblem) return
    setSavingTestId(test.id)
    setMessage(null)
    try {
      const payload = {
        input_text: test.input_text,
        expected_output: test.expected_output,
        is_hidden: test.is_hidden,
        time_limit_ms: toOptionalInt(test.time_limit_ms),
        slow_limit_ms: toOptionalInt(test.slow_limit_ms),
      }
      const updated = await apiRequest<ProblemTestCase>(
        `/api/problems/${selectedProblem.problem_id}/tests/${test.id}`,
        { method: 'PATCH', headers: adminHeaders, body: payload }
      )
      setTestCases(prev =>
        prev.map(item =>
          item.id === updated.id
            ? {
                id: updated.id,
                input_text: updated.input_text,
                expected_output: updated.expected_output,
                is_hidden: updated.is_hidden,
                time_limit_ms: String(updated.time_limit_ms ?? ''),
                slow_limit_ms: String(updated.slow_limit_ms ?? ''),
              }
            : item
        )
      )
      setMessage({ type: 'success', text: 'Test case updated.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to update test case'
      setMessage({ type: 'error', text })
    } finally {
      setSavingTestId(null)
    }
  }, [selectedProblem, adminHeaders])

  const deleteTestCase = useCallback(async (testId: number) => {
    if (!selectedProblem) return
    if (!confirm('Delete this test case?')) return
    setDeletingTestId(testId)
    setMessage(null)
    try {
      await apiRequest(`/api/problems/${selectedProblem.problem_id}/tests/${testId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      })
      setTestCases(prev => prev.filter(item => item.id !== testId))
      setMessage({ type: 'success', text: 'Test case deleted.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to delete test case'
      setMessage({ type: 'error', text })
    } finally {
      setDeletingTestId(null)
    }
  }, [selectedProblem, adminHeaders])

  const generateOutput = useCallback(async (inputText: string, onOutput: (value: string) => void) => {
    if (!selectedProblem) return
    if (!referenceCode.trim()) {
      setMessage({ type: 'error', text: 'Add a reference solution first.' })
      return
    }
    setMessage(null)
    try {
      const result = await apiRequest<ReferenceRunResponse>(
        `/api/problems/${selectedProblem.problem_id}/reference/run`,
        { method: 'POST', headers: adminHeaders, body: { input_text: inputText } }
      )
      onOutput(result.output ?? '')
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to generate output'
      setMessage({ type: 'error', text })
    }
  }, [selectedProblem, adminHeaders, referenceCode])

  const handleGenerateNew = useCallback(async () => {
    setNewGenerating(true)
    await generateOutput(newInput, setNewExpected)
    setNewGenerating(false)
  }, [generateOutput, newInput])

  const handleGenerateExisting = useCallback(async (testId: number) => {
    const target = testCases.find(item => item.id === testId)
    if (!target) return
    setGeneratingTestId(testId)
    await generateOutput(target.input_text, output => {
      setTestCases(prev =>
        prev.map(item => (item.id === testId ? { ...item, expected_output: output } : item))
      )
    })
    setGeneratingTestId(null)
  }, [generateOutput, testCases])

  const addTestCase = useCallback(async () => {
    if (!selectedProblem) return
    if (!newInput.trim()) {
      setMessage({ type: 'error', text: 'Input is required.' })
      return
    }
    setNewCreating(true)
    setMessage(null)
    try {
      const response = await apiRequest<ProblemTestCase[]>(
        `/api/problems/${selectedProblem.problem_id}/tests`,
        {
          method: 'POST',
          headers: adminHeaders,
          body: {
            cases: [{
              input_text: newInput,
              expected_output: newExpected,
              is_hidden: newHidden,
              time_limit_ms: toOptionalInt(newTimeLimit),
              slow_limit_ms: toOptionalInt(newSlowLimit),
            }],
          },
        }
      )
      const created = response[0]
      if (created) {
        setTestCases(prev => [
          ...prev,
          {
            id: created.id,
            input_text: created.input_text,
            expected_output: created.expected_output,
            is_hidden: created.is_hidden,
            time_limit_ms: String(created.time_limit_ms ?? ''),
            slow_limit_ms: String(created.slow_limit_ms ?? ''),
          },
        ])
      }
      setNewInput('')
      setNewExpected('')
      setNewHidden(false)
      setNewTimeLimit('')
      setNewSlowLimit('')
      setMessage({ type: 'success', text: 'Test case created.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to create test case'
      setMessage({ type: 'error', text })
    } finally {
      setNewCreating(false)
    }
  }, [selectedProblem, adminHeaders, newInput, newExpected, newHidden, newTimeLimit, newSlowLimit])

  // Filter problems by search query
  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems
    const query = searchQuery.toLowerCase()
    return problems.filter(
      p =>
        p.problem_id.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        (p.title && p.title.toLowerCase().includes(query))
    )
  }, [problems, searchQuery])

  const messageColor =
    message?.type === 'error'
      ? 'text-red-500'
      : message?.type === 'success'
        ? 'text-green-600'
        : 'text-muted-foreground'

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Admin: Problem Editor</h1>
          <p className="text-muted-foreground">Sign in to manage problems.</p>
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={() => login('github', '/admin/problems')}>Sign in with GitHub</Button>
            <Button variant="outline" onClick={() => login('google', '/admin/problems')}>Sign in with Google</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Admin: Problem Editor</h1>
        <p className="text-muted-foreground">Edit descriptions, solutions, starter code, and test cases.</p>
      </div>

      {/* Admin Secret & Load */}
      <div className="border border-border rounded-lg p-4 bg-card space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-foreground">Admin Secret</label>
            <Input
              type="password"
              placeholder="X-Admin-Secret"
              value={adminSecret}
              onChange={e => setAdminSecret(e.target.value)}
            />
          </div>
          <Button onClick={loadProblems} disabled={problemsLoading}>
            {problemsLoading ? 'Loading...' : 'Load Problems'}
          </Button>
        </div>
        {message && <div className={`text-sm ${messageColor}`}>{message.text}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Problem List */}
        <div className="border border-border rounded-lg p-4 bg-card space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Input
              placeholder="Search problems..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredProblems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No problems loaded. Enter admin secret and click Load.</p>
            ) : (
              filteredProblems.map(problem => (
                <div
                  key={problem.problem_id}
                  onClick={() => loadProblemDetails(problem)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProblem?.problem_id === problem.problem_id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">{problem.title || problem.slug}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      problem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      problem.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {problem.difficulty || '?'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                    <span className={problem.has_description ? 'text-green-600' : 'text-red-500'}>
                      {problem.has_description ? '✓' : '✗'} desc
                    </span>
                    <span className={problem.has_solution ? 'text-green-600' : 'text-red-500'}>
                      {problem.has_solution ? '✓' : '✗'} sol
                    </span>
                    <span className={problem.has_starter_code ? 'text-green-600' : 'text-red-500'}>
                      {problem.has_starter_code ? '✓' : '✗'} starter
                    </span>
                    <span>{problem.test_case_count} tests</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Problem Editor */}
        {selectedProblem ? (
          <div className="space-y-6">
            <div className="text-lg font-semibold text-foreground">
              Editing: {selectedProblem.problem_id}
            </div>

            {/* Description Section */}
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Problem Description</h2>
                <Button onClick={saveDetail} disabled={detailSaving || detailLoading}>
                  {detailSaving ? 'Saving...' : 'Save Description'}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Problem Title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Difficulty</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                  >
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description (HTML)</label>
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  value={descriptionHtml}
                  onChange={e => setDescriptionHtml(e.target.value)}
                  placeholder="<p>Problem description HTML...</p>"
                />
              </div>
            </div>

            {/* Starter Code Section */}
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Starter Code</h2>
                <Button onClick={saveStarterCode} disabled={starterSaving || referenceLoading}>
                  {starterSaving ? 'Saving...' : 'Save Starter Code'}
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Initial code shown to users</label>
                <Textarea
                  className="min-h-[150px] font-mono text-sm"
                  value={starterCode}
                  onChange={e => setStarterCode(e.target.value)}
                  placeholder="class Solution:&#10;    def solve(self, ...):"
                />
              </div>
            </div>

            {/* Reference Solution Section */}
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Reference Solution</h2>
                <Button onClick={saveReference} disabled={referenceSaving || referenceLoading}>
                  {referenceSaving ? 'Saving...' : 'Save Solution'}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Time Complexity</label>
                  <Input value={timeComplexity} onChange={e => setTimeComplexity(e.target.value)} placeholder="O(n)" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Space Complexity</label>
                  <Input value={spaceComplexity} onChange={e => setSpaceComplexity(e.target.value)} placeholder="O(1)" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Python Solution</label>
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  value={referenceCode}
                  onChange={e => setReferenceCode(e.target.value)}
                  placeholder="class Solution:&#10;    ..."
                />
              </div>
            </div>

            {/* Test Cases Section */}
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Test Cases ({testCases.length})</h2>

              {/* Add New Test Case */}
              <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-foreground">Add New Test Case</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Input (JSON)</label>
                    <Textarea
                      className="min-h-[80px] font-mono text-xs"
                      value={newInput}
                      onChange={e => setNewInput(e.target.value)}
                      placeholder='[[1,2,3], 4]'
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Expected Output</label>
                    <Textarea
                      className="min-h-[80px] font-mono text-xs"
                      value={newExpected}
                      onChange={e => setNewExpected(e.target.value)}
                      placeholder='[0, 1]'
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={newHidden} onChange={e => setNewHidden(e.target.checked)} />
                    Hidden
                  </label>
                  <Input className="w-24" value={newTimeLimit} onChange={e => setNewTimeLimit(e.target.value)} placeholder="Time ms" />
                  <Input className="w-24" value={newSlowLimit} onChange={e => setNewSlowLimit(e.target.value)} placeholder="Slow ms" />
                  <Button size="sm" variant="outline" onClick={handleGenerateNew} disabled={newGenerating}>
                    {newGenerating ? 'Generating...' : 'Generate Output'}
                  </Button>
                  <Button size="sm" onClick={addTestCase} disabled={newCreating}>
                    {newCreating ? 'Adding...' : 'Add Test'}
                  </Button>
                </div>
              </div>

              {/* Existing Test Cases */}
              {testsLoading ? (
                <div className="text-sm text-muted-foreground">Loading test cases...</div>
              ) : testCases.length === 0 ? (
                <div className="text-sm text-muted-foreground">No test cases yet.</div>
              ) : (
                <div className="space-y-3">
                  {testCases.map(test => (
                    <div key={test.id} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Test #{test.id}</span>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={test.is_hidden}
                            onChange={e =>
                              setTestCases(prev =>
                                prev.map(item =>
                                  item.id === test.id ? { ...item, is_hidden: e.target.checked } : item
                                )
                              )
                            }
                          />
                          Hidden
                        </label>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <Textarea
                          className="min-h-[60px] font-mono text-xs"
                          value={test.input_text}
                          onChange={e =>
                            setTestCases(prev =>
                              prev.map(item =>
                                item.id === test.id ? { ...item, input_text: e.target.value } : item
                              )
                            )
                          }
                        />
                        <Textarea
                          className="min-h-[60px] font-mono text-xs"
                          value={test.expected_output}
                          onChange={e =>
                            setTestCases(prev =>
                              prev.map(item =>
                                item.id === test.id ? { ...item, expected_output: e.target.value } : item
                              )
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleGenerateExisting(test.id)} disabled={generatingTestId === test.id}>
                          {generatingTestId === test.id ? 'Gen...' : 'Generate'}
                        </Button>
                        <Button size="sm" onClick={() => updateTestCase(test)} disabled={savingTestId === test.id}>
                          {savingTestId === test.id ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteTestCase(test.id)} disabled={deletingTestId === test.id}>
                          {deletingTestId === test.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-8 bg-card flex items-center justify-center">
            <p className="text-muted-foreground">Select a problem from the list to edit</p>
          </div>
        )}
      </div>
    </div>
  )
}
