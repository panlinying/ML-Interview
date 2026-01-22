'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
  const [problemId, setProblemId] = useState('')
  const [message, setMessage] = useState<Message | null>(null)

  const [referenceCode, setReferenceCode] = useState('')
  const [timeComplexity, setTimeComplexity] = useState('')
  const [spaceComplexity, setSpaceComplexity] = useState('')
  const [referenceLoading, setReferenceLoading] = useState(false)
  const [referenceSaving, setReferenceSaving] = useState(false)

  const [testsLoading, setTestsLoading] = useState(false)
  const [testCases, setTestCases] = useState<EditableTestCase[]>([])
  const [savingTestId, setSavingTestId] = useState<number | null>(null)
  const [deletingTestId, setDeletingTestId] = useState<number | null>(null)
  const [generatingTestId, setGeneratingTestId] = useState<number | null>(null)

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

  const ensureAdminInputs = useCallback(() => {
    if (!adminSecret.trim()) {
      setMessage({ type: 'error', text: 'Admin secret is required.' })
      return false
    }
    if (!problemId.trim()) {
      setMessage({ type: 'error', text: 'Problem ID is required.' })
      return false
    }
    return true
  }, [adminSecret, problemId])

  const loadReference = useCallback(async () => {
    if (!ensureAdminInputs()) return
    setReferenceLoading(true)
    setMessage(null)
    try {
      const ref = await apiRequest<ProblemReference>(`/api/problems/${problemId}/reference`, {
        headers: adminHeaders,
      })
      setReferenceCode(ref.solution_code || '')
      setTimeComplexity(ref.optimal_time_complexity || '')
      setSpaceComplexity(ref.optimal_space_complexity || '')
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to load reference solution'
      if (text.toLowerCase().includes('not found')) {
        setReferenceCode('')
        setTimeComplexity('')
        setSpaceComplexity('')
        setMessage({ type: 'info', text: 'No reference solution found yet.' })
      } else {
        setMessage({ type: 'error', text })
      }
    } finally {
      setReferenceLoading(false)
    }
  }, [adminHeaders, ensureAdminInputs, problemId])

  const loadTests = useCallback(async () => {
    if (!ensureAdminInputs()) return
    setTestsLoading(true)
    setMessage(null)
    try {
      const tests = await apiRequest<ProblemTestCase[]>(`/api/problems/${problemId}/tests`, {
        headers: adminHeaders,
      })
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
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to load test cases'
      setMessage({ type: 'error', text })
    } finally {
      setTestsLoading(false)
    }
  }, [adminHeaders, ensureAdminInputs, problemId])

  const loadAll = useCallback(async () => {
    await Promise.all([loadReference(), loadTests()])
  }, [loadReference, loadTests])

  const saveReference = useCallback(async () => {
    if (!ensureAdminInputs()) return
    if (!referenceCode.trim()) {
      setMessage({ type: 'error', text: 'Reference solution code is required.' })
      return
    }
    setReferenceSaving(true)
    setMessage(null)
    try {
      await apiRequest<ProblemReference>(`/api/problems/${problemId}/reference`, {
        method: 'PUT',
        headers: adminHeaders,
        body: {
          solution_code: referenceCode,
          optimal_time_complexity: timeComplexity || null,
          optimal_space_complexity: spaceComplexity || null,
          language: 'python',
        },
      })
      setMessage({ type: 'success', text: 'Reference solution saved.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to save reference solution'
      setMessage({ type: 'error', text })
    } finally {
      setReferenceSaving(false)
    }
  }, [adminHeaders, ensureAdminInputs, problemId, referenceCode, timeComplexity, spaceComplexity])

  const updateTestCase = useCallback(async (test: EditableTestCase) => {
    if (!ensureAdminInputs()) return
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
        `/api/problems/${problemId}/tests/${test.id}`,
        {
          method: 'PATCH',
          headers: adminHeaders,
          body: payload,
        }
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
  }, [adminHeaders, ensureAdminInputs, problemId])

  const deleteTestCase = useCallback(async (testId: number) => {
    if (!ensureAdminInputs()) return
    if (!confirm('Delete this test case?')) return
    setDeletingTestId(testId)
    setMessage(null)
    try {
      await apiRequest(`/api/problems/${problemId}/tests/${testId}`, {
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
  }, [adminHeaders, ensureAdminInputs, problemId])

  const generateOutput = useCallback(async (inputText: string, onOutput: (value: string) => void) => {
    if (!ensureAdminInputs()) return
    if (!referenceCode.trim()) {
      setMessage({ type: 'error', text: 'Add a reference solution first.' })
      return
    }
    setMessage(null)
    try {
      const result = await apiRequest<ReferenceRunResponse>(
        `/api/problems/${problemId}/reference/run`,
        {
          method: 'POST',
          headers: adminHeaders,
          body: { input_text: inputText },
        }
      )
      onOutput(result.output ?? '')
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to generate output'
      setMessage({ type: 'error', text })
    }
  }, [adminHeaders, ensureAdminInputs, problemId, referenceCode])

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
    if (!ensureAdminInputs()) return
    if (!newInput.trim()) {
      setMessage({ type: 'error', text: 'Input is required.' })
      return
    }
    setNewCreating(true)
    setMessage(null)
    try {
      const response = await apiRequest<ProblemTestCase[]>(`/api/problems/${problemId}/tests`, {
        method: 'POST',
        headers: adminHeaders,
        body: {
          cases: [
            {
              input_text: newInput,
              expected_output: newExpected,
              is_hidden: newHidden,
              time_limit_ms: toOptionalInt(newTimeLimit),
              slow_limit_ms: toOptionalInt(newSlowLimit),
            },
          ],
        },
      })
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
  }, [adminHeaders, ensureAdminInputs, problemId, newInput, newExpected, newHidden, newTimeLimit, newSlowLimit])

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
          <h1 className="text-2xl font-bold text-foreground">Admin: Problem Setup</h1>
          <p className="text-muted-foreground">
            Sign in to manage reference solutions and test cases.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={() => login('github', '/admin/problems')}>
              Sign in with GitHub
            </Button>
            <Button variant="outline" onClick={() => login('google', '/admin/problems')}>
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Admin: Problem Setup</h1>
        <p className="text-muted-foreground">
          Manage reference solutions, complexity targets, and test cases.
        </p>
      </div>

      <div className="border border-border rounded-lg p-6 bg-card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Problem ID</label>
            <Input
              placeholder="lc-two-sum"
              value={problemId}
              onChange={e => setProblemId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Admin Secret</label>
            <Input
              type="password"
              placeholder="X-Admin-Secret"
              value={adminSecret}
              onChange={e => setAdminSecret(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadAll} disabled={referenceLoading || testsLoading}>
            {referenceLoading || testsLoading ? 'Loading...' : 'Load'}
          </Button>
          <Button variant="outline" onClick={loadReference} disabled={referenceLoading}>
            Load Reference
          </Button>
          <Button variant="outline" onClick={loadTests} disabled={testsLoading}>
            Load Tests
          </Button>
        </div>
        {message && <div className={`text-sm ${messageColor}`}>{message.text}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Reference Solution</h2>
            <Button onClick={saveReference} disabled={referenceSaving}>
              {referenceSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Optimal Time</label>
              <Input
                placeholder="O(n)"
                value={timeComplexity}
                onChange={e => setTimeComplexity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Optimal Space</label>
              <Input
                placeholder="O(1)"
                value={spaceComplexity}
                onChange={e => setSpaceComplexity(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Python Solution (stdin/stdout)</label>
            <Textarea
              className="min-h-[260px] font-mono text-sm"
              value={referenceCode}
              onChange={e => setReferenceCode(e.target.value)}
              placeholder="Write the reference solution here..."
            />
          </div>
        </div>

        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Add Test Case</h2>
          <p className="text-xs text-muted-foreground">
            Input format: JSON array of args (e.g., <code>[[2,7,11,15],9]</code>) or design format
            <code>[[&quot;LRUCache&quot;,&quot;put&quot;,&quot;get&quot;],[[2],[1,1],[1]]]</code>. Expected output should be JSON.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Input</label>
            <Textarea
              className="min-h-[120px] font-mono text-sm"
              value={newInput}
              onChange={e => setNewInput(e.target.value)}
              placeholder="stdin input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Expected Output</label>
            <Textarea
              className="min-h-[120px] font-mono text-sm"
              value={newExpected}
              onChange={e => setNewExpected(e.target.value)}
              placeholder="stdout output"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Time Limit (ms)</label>
              <Input
                value={newTimeLimit}
                onChange={e => setNewTimeLimit(e.target.value)}
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Slow Limit (ms)</label>
              <Input
                value={newSlowLimit}
                onChange={e => setNewSlowLimit(e.target.value)}
                placeholder="4000"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={newHidden}
              onChange={e => setNewHidden(e.target.checked)}
              className="rounded border-border"
            />
            Hidden test case
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleGenerateNew} disabled={newGenerating}>
              {newGenerating ? 'Generating...' : 'Generate Output'}
            </Button>
            <Button onClick={addTestCase} disabled={newCreating}>
              {newCreating ? 'Adding...' : 'Add Test Case'}
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Existing Test Cases</h2>
          <span className="text-sm text-muted-foreground">{testCases.length} total</span>
        </div>
        {testsLoading ? (
          <div className="text-sm text-muted-foreground">Loading test cases...</div>
        ) : testCases.length === 0 ? (
          <div className="text-sm text-muted-foreground">No test cases yet.</div>
        ) : (
          <div className="space-y-4">
            {testCases.map(test => (
              <div key={test.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">Test #{test.id}</div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
                      className="rounded border-border"
                    />
                    Hidden
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Input</label>
                  <Textarea
                    className="min-h-[100px] font-mono text-xs"
                    value={test.input_text}
                    onChange={e =>
                      setTestCases(prev =>
                        prev.map(item =>
                          item.id === test.id ? { ...item, input_text: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Expected Output</label>
                  <Textarea
                    className="min-h-[100px] font-mono text-xs"
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
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Time Limit (ms)</label>
                    <Input
                      value={test.time_limit_ms}
                      onChange={e =>
                        setTestCases(prev =>
                          prev.map(item =>
                            item.id === test.id ? { ...item, time_limit_ms: e.target.value } : item
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Slow Limit (ms)</label>
                    <Input
                      value={test.slow_limit_ms}
                      onChange={e =>
                        setTestCases(prev =>
                          prev.map(item =>
                            item.id === test.id ? { ...item, slow_limit_ms: e.target.value } : item
                          )
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateExisting(test.id)}
                    disabled={generatingTestId === test.id}
                  >
                    {generatingTestId === test.id ? 'Generating...' : 'Generate Output'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateTestCase(test)}
                    disabled={savingTestId === test.id}
                  >
                    {savingTestId === test.id ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTestCase(test.id)}
                    disabled={deletingTestId === test.id}
                  >
                    {deletingTestId === test.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
