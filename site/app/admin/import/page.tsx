'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Message = { type: 'error' | 'success' | 'info'; text: string }

type TestCaseDraft = {
  id: number
  input_text: string
  expected_output: string
  is_hidden: boolean
  time_limit_ms: string
  slow_limit_ms: string
}

type ProblemTestCase = {
  id: number
}

function normalizeSlug(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const urlMatch = trimmed.match(/leetcode\.com\/problems\/([^/]+)/i)
  if (urlMatch?.[1]) {
    return urlMatch[1].toLowerCase()
  }
  return trimmed.replace(/^lc-/, '').toLowerCase()
}

function toOptionalInt(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed)) return undefined
  return parsed
}

export default function AdminImportPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()

  const [adminSecret, setAdminSecret] = useState('')
  const [message, setMessage] = useState<Message | null>(null)
  const [saving, setSaving] = useState(false)

  const [slugInput, setSlugInput] = useState('')
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [tags, setTags] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [starterCode, setStarterCode] = useState('')
  const [solutionCode, setSolutionCode] = useState('')
  const [timeComplexity, setTimeComplexity] = useState('')
  const [spaceComplexity, setSpaceComplexity] = useState('')

  const [testCases, setTestCases] = useState<TestCaseDraft[]>([])
  const [nextTestId, setNextTestId] = useState(1)
  const [replaceTests, setReplaceTests] = useState(true)

  const adminHeaders = useMemo((): Record<string, string> => {
    return adminSecret ? { 'X-Admin-Secret': adminSecret } : {}
  }, [adminSecret])

  const normalizedSlug = useMemo(() => normalizeSlug(slugInput), [slugInput])
  const problemId = normalizedSlug ? `lc-${normalizedSlug}` : ''

  const addTestCase = useCallback(() => {
    setTestCases(prev => [
      ...prev,
      {
        id: nextTestId,
        input_text: '',
        expected_output: '',
        is_hidden: false,
        time_limit_ms: '',
        slow_limit_ms: '',
      },
    ])
    setNextTestId(prev => prev + 1)
  }, [nextTestId])

  const updateTestCase = useCallback((id: number, patch: Partial<TestCaseDraft>) => {
    setTestCases(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const removeTestCase = useCallback((id: number) => {
    setTestCases(prev => prev.filter(item => item.id !== id))
  }, [])

  const handleSave = useCallback(async () => {
    if (!adminSecret.trim()) {
      setMessage({ type: 'error', text: 'Admin secret is required.' })
      return
    }
    if (!normalizedSlug) {
      setMessage({ type: 'error', text: 'LeetCode slug is required.' })
      return
    }
    if (!solutionCode.trim()) {
      setMessage({ type: 'error', text: 'Solution code is required.' })
      return
    }

    const preparedTests = testCases.map(test => ({
      input_text: test.input_text,
      expected_output: test.expected_output,
      is_hidden: test.is_hidden,
      time_limit_ms: toOptionalInt(test.time_limit_ms),
      slow_limit_ms: toOptionalInt(test.slow_limit_ms),
    }))

    const invalidTest = preparedTests.find(test => !test.input_text || !test.expected_output)
    if (invalidTest) {
      setMessage({ type: 'error', text: 'Every test case needs input and expected output.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await apiRequest(
        `/api/admin/problem-details/${encodeURIComponent(normalizedSlug)}`,
        {
          method: 'PUT',
          headers: adminHeaders,
          body: {
            title: title || null,
            description_html: descriptionHtml || null,
            difficulty: difficulty || null,
            tags: tags || null,
          },
        }
      )

      await apiRequest(
        `/api/problems/${problemId}/reference`,
        {
          method: 'PUT',
          headers: adminHeaders,
          body: {
            solution_code: solutionCode,
            optimal_time_complexity: timeComplexity || null,
            optimal_space_complexity: spaceComplexity || null,
            language: 'python',
          },
        }
      )

      await apiRequest(
        `/api/admin/problems/${problemId}/starter`,
        {
          method: 'PATCH',
          headers: adminHeaders,
          body: { starter_code: starterCode },
        }
      )

      if (replaceTests) {
        const existing = await apiRequest<ProblemTestCase[]>(
          `/api/problems/${problemId}/tests`,
          { headers: adminHeaders }
        )
        await Promise.all(
          existing.map(test =>
            apiRequest(
              `/api/problems/${problemId}/tests/${test.id}`,
              { method: 'DELETE', headers: adminHeaders }
            )
          )
        )
      }

      if (preparedTests.length > 0) {
        await apiRequest(
          `/api/problems/${problemId}/tests`,
          {
            method: 'POST',
            headers: adminHeaders,
            body: { cases: preparedTests },
          }
        )
      }

      setMessage({ type: 'success', text: 'Problem imported successfully.' })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to import problem'
      setMessage({ type: 'error', text })
    } finally {
      setSaving(false)
    }
  }, [
    adminSecret,
    normalizedSlug,
    problemId,
    adminHeaders,
    title,
    descriptionHtml,
    difficulty,
    tags,
    solutionCode,
    timeComplexity,
    spaceComplexity,
    starterCode,
    testCases,
    replaceTests,
  ])

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
          <h1 className="text-2xl font-bold text-foreground">Admin: Manual Import</h1>
          <p className="text-muted-foreground">Sign in to import problems.</p>
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={() => login('github', '/admin/import')}>Sign in with GitHub</Button>
            <Button variant="outline" onClick={() => login('google', '/admin/import')}>Sign in with Google</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Admin: Manual Import</h1>
        <p className="text-muted-foreground">Create a problem entry by hand and preview it before saving.</p>
      </div>

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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Problem'}
          </Button>
        </div>
        {message && <div className={`text-sm ${messageColor}`}>{message.text}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-4 bg-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Problem Metadata</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">LeetCode Slug</label>
                <Input
                  placeholder="kth-smallest-element-in-a-bst"
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value)}
                />
                {problemId && (
                  <div className="text-xs text-muted-foreground">Problem ID: {problemId}</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input
                  placeholder="Kth Smallest Element in a BST"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
                <Input
                  placeholder="bst, inorder, dfs"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description HTML</label>
              <Textarea
                className="min-h-[240px] font-mono text-sm"
                placeholder="<p>Problem description...</p>"
                value={descriptionHtml}
                onChange={e => setDescriptionHtml(e.target.value)}
              />
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Code</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Starter Code</label>
              <Textarea
                className="min-h-[160px] font-mono text-sm"
                placeholder="# Starter code"
                value={starterCode}
                onChange={e => setStarterCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Solution Code</label>
              <Textarea
                className="min-h-[200px] font-mono text-sm"
                placeholder="# Solution code"
                value={solutionCode}
                onChange={e => setSolutionCode(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Optimal Time Complexity</label>
                <Input
                  placeholder="O(n log n)"
                  value={timeComplexity}
                  onChange={e => setTimeComplexity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Optimal Space Complexity</label>
                <Input
                  placeholder="O(1)"
                  value={spaceComplexity}
                  onChange={e => setSpaceComplexity(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Test Cases</h2>
              <Button variant="outline" onClick={addTestCase}>Add Test Case</Button>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={replaceTests}
                onChange={e => setReplaceTests(e.target.checked)}
              />
              Replace existing tests on save
            </label>
            {testCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No test cases added yet.</p>
            ) : (
              <div className="space-y-4">
                {testCases.map((test, index) => (
                  <div key={test.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Case {index + 1}</span>
                      <Button variant="ghost" onClick={() => removeTestCase(test.id)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Input</label>
                        <Textarea
                          className="min-h-[100px] font-mono text-sm"
                          value={test.input_text}
                          onChange={e => updateTestCase(test.id, { input_text: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Expected Output</label>
                        <Textarea
                          className="min-h-[100px] font-mono text-sm"
                          value={test.expected_output}
                          onChange={e => updateTestCase(test.id, { expected_output: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={test.is_hidden}
                          onChange={e => updateTestCase(test.id, { is_hidden: e.target.checked })}
                        />
                        Hidden
                      </label>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Time Limit (ms)</label>
                        <Input
                          value={test.time_limit_ms}
                          onChange={e => updateTestCase(test.id, { time_limit_ms: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Slow Limit (ms)</label>
                        <Input
                          value={test.slow_limit_ms}
                          onChange={e => updateTestCase(test.id, { slow_limit_ms: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-4 bg-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Preview</h2>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{title || 'Untitled Problem'}</span>
                {difficulty && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {difficulty}
                  </span>
                )}
              </div>
              {tags && (
                <div className="text-xs text-muted-foreground">Tags: {tags}</div>
              )}
            </div>
            <div className="max-h-[320px] overflow-auto rounded border border-border bg-background p-3">
              {descriptionHtml ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Description preview will appear here.</p>
              )}
            </div>
            {starterCode && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Starter Code</h3>
                <pre className="max-h-[200px] overflow-auto rounded border border-border bg-muted/30 p-3 text-xs">
                  {starterCode}
                </pre>
              </div>
            )}
            {solutionCode && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Solution Code</h3>
                <pre className="max-h-[200px] overflow-auto rounded border border-border bg-muted/30 p-3 text-xs">
                  {solutionCode}
                </pre>
              </div>
            )}
            {testCases.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Test Cases</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {testCases.map((test, index) => (
                    <div key={test.id} className="rounded border border-border bg-muted/30 p-2">
                      <div>Case {index + 1} {test.is_hidden ? '(hidden)' : ''}</div>
                      <div className="whitespace-pre-wrap">Input: {test.input_text || '—'}</div>
                      <div className="whitespace-pre-wrap">Expected: {test.expected_output || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
