'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { apiRequest, encodeSlugPath } from '@/lib/api'
import { useAuth, getInitials } from '@/lib/useAuth'

type Comment = {
  id: number
  user_id: number
  user_name?: string | null
  content_slug: string
  parent_id?: number | null
  body: string
  created_at: string
  score?: number | null
  user_vote?: number | null
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value
  }

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

const COMMENT_TEMPLATE = `# How to approach today's task

Lead: 1-2 sentences summarizing the approach.

## Idea
Explain the key insight in plain language.

## Steps
1. ...
2. ...
3. ...

## Complexity
Time: O(...)
Space: O(...)

## Pitfalls
- Common mistake 1
- Common mistake 2

## Final
State the final answer or conclusion.
`

const COMMENT_PROSE_CLASS =
  'prose-sm md:prose-base max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed'

export function DocEngagement({ contentSlug }: { contentSlug: string }) {
  const pathname = usePathname()
  const slugPath = useMemo(() => encodeSlugPath(contentSlug), [contentSlug])
  const pageviewLogged = useRef<string | null>(null)

  // Use centralized auth hook
  const { user, token: authToken, isAuthenticated } = useAuth()

  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [composerTab, setComposerTab] = useState<'write' | 'preview'>('write')
  const [replyTarget, setReplyTarget] = useState<{
    parentId: number
    replyToName: string
  } | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [votePending, setVotePending] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let active = true
    setCommentsLoading(true)
    setCommentsError(null)

    apiRequest<Comment[]>(`/api/comments/${slugPath}`, { token: authToken })
      .then(data => {
        if (!active) return
        setComments(data)
      })
      .catch(err => {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Unable to load comments'
        setCommentsError(message)
      })
      .finally(() => {
        if (active) {
          setCommentsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [slugPath, authToken])

  useEffect(() => {
    if (!pathname || pageviewLogged.current === pathname) {
      return
    }
    pageviewLogged.current = pathname
    apiRequest('/api/analytics/pageview', {
      method: 'POST',
      body: { path: pathname },
      token: authToken,
    }).catch(() => {
      // Skip analytics errors to avoid blocking UI.
    })
  }, [authToken, pathname])

  const handleSubmitComment = async () => {
    const trimmed = commentDraft.trim()
    if (!trimmed) {
      setCommentsError('Comment cannot be empty')
      return
    }
    if (!authToken || !user?.authenticated) {
      setCommentsError('Sign in to post a comment')
      return
    }

    setCommentSubmitting(true)
    setCommentsError(null)
    try {
      const newComment = await apiRequest<Comment>('/api/comments', {
        method: 'POST',
        token: authToken,
        body: {
          content_slug: contentSlug,
          body: trimmed,
        },
      })
      setComments(prev => [newComment, ...prev])
      setCommentDraft('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to post comment'
      setCommentsError(message)
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleInsertTemplate = () => {
    setCommentsError(null)
    setCommentDraft(current => {
      if (!current.trim()) {
        return COMMENT_TEMPLATE
      }
      return `${current.trimEnd()}\n\n${COMMENT_TEMPLATE}`
    })
  }

  const handleStartReply = (comment: Comment) => {
    if (!isAuthenticated) {
      setReplyError('Sign in to reply')
      return
    }
    const parentId = comment.parent_id ?? comment.id
    setReplyTarget({
      parentId,
      replyToName: comment.user_name || 'Anonymous',
    })
    setReplyDraft('')
    setReplyError(null)
  }

  const handleCancelReply = () => {
    setReplyTarget(null)
    setReplyDraft('')
    setReplyError(null)
  }

  const handleSubmitReply = async () => {
    if (!replyTarget) {
      return
    }
    const trimmed = replyDraft.trim()
    if (!trimmed) {
      setReplyError('Reply cannot be empty')
      return
    }
    if (!authToken || !user?.authenticated) {
      setReplyError('Sign in to reply')
      return
    }

    setReplySubmitting(true)
    setReplyError(null)
    try {
      const newComment = await apiRequest<Comment>('/api/comments', {
        method: 'POST',
        token: authToken,
        body: {
          content_slug: contentSlug,
          body: trimmed,
          parent_id: replyTarget.parentId,
        },
      })
      setComments(prev => [newComment, ...prev])
      setReplyDraft('')
      setReplyTarget(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to post reply'
      setReplyError(message)
    } finally {
      setReplySubmitting(false)
    }
  }

  const handleVote = async (comment: Comment, direction: 1 | -1) => {
    if (!authToken || !user?.authenticated) {
      setCommentsError('Sign in to vote')
      return
    }
    const currentVote = comment.user_vote ?? 0
    const nextVote = currentVote === direction ? 0 : direction

    setVotePending(current => ({ ...current, [comment.id]: true }))
    setCommentsError(null)
    try {
      const response = await apiRequest<{ comment_id: number; score: number; user_vote: number }>(
        `/api/comments/${comment.id}/vote`,
        {
          method: 'POST',
          token: authToken,
          body: { vote: nextVote },
        }
      )
      setComments(prev =>
        prev.map(item =>
          item.id === response.comment_id
            ? { ...item, score: response.score, user_vote: response.user_vote }
            : item
        )
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to vote'
      setCommentsError(message)
    } finally {
      setVotePending(current => ({ ...current, [comment.id]: false }))
    }
  }

  const hasDraft = commentDraft.trim().length > 0
  const commentThreads = useMemo(() => {
    const roots: Comment[] = []
    const repliesByParent = new Map<number, Comment[]>()

    for (const comment of comments) {
      if (comment.parent_id) {
        const list = repliesByParent.get(comment.parent_id) ?? []
        list.push(comment)
        repliesByParent.set(comment.parent_id, list)
      } else {
        roots.push(comment)
      }
    }

    const toTime = (value: string) => {
      const parsed = Date.parse(value)
      return Number.isNaN(parsed) ? 0 : parsed
    }

    roots.sort((a, b) => toTime(b.created_at) - toTime(a.created_at))
    repliesByParent.forEach((list) => {
      list.sort((a, b) => toTime(a.created_at) - toTime(b.created_at))
    })

    return { roots, repliesByParent }
  }, [comments])

  const renderComment = (comment: Comment, isReply: boolean, replyToName?: string) => {
    const author = comment.user_name || 'Anonymous'
    const score = comment.score ?? 0
    const userVote = comment.user_vote ?? 0
    const isVoting = Boolean(votePending[comment.id])
    const helpfulDisabled = !isAuthenticated || isVoting
    const isHelpful = userVote === 1

    return (
      <div key={comment.id} className="group">
        <div className="flex gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted text-xs font-medium text-muted-foreground flex items-center justify-center">
            {getInitials(comment.user_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{author}</span>
              {isReply && replyToName && (
                <span className="text-muted-foreground">
                  replying to <span className="text-foreground/70">@{replyToName}</span>
                </span>
              )}
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-xs">{formatRelativeTime(comment.created_at)}</span>
            </div>
            <div className="mt-1.5">
              <MarkdownRenderer
                content={comment.body}
                className={COMMENT_PROSE_CLASS}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <button
                className={`inline-flex items-center gap-1.5 transition-colors ${
                  isHelpful
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                } ${helpfulDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={helpfulDisabled}
                onClick={() => handleVote(comment, 1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 1 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974 1.749 1.749 0 0 1-1.633 1.201H11.75a.75.75 0 0 0-.75.75v.25a.75.75 0 0 0 .75.75h5.07c.934 0 1.788-.562 2.148-1.425a25.24 25.24 0 0 0 1.532-6.91c.165-1.769-1.278-3.237-3.053-3.237h-2.52c-.383 0-.573-.464-.385-.81.35-.638.585-1.34.693-2.083.064-.44-.003-.895-.165-1.312a.75.75 0 0 0-.699-.479c-.09 0-.18.01-.268.028a.75.75 0 0 0-.567.523A3.502 3.502 0 0 1 10.25 4H6.75a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75H8V3h3Z" />
                </svg>
                {score > 0 ? `Helpful (${score})` : 'Helpful'}
              </button>
              <button
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  !isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => handleStartReply(comment)}
                disabled={!isAuthenticated}
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="mt-12 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Comments</h3>
            <p className="text-sm text-muted-foreground">
              Share your approach or ask questions
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted text-xs font-medium text-muted-foreground flex items-center justify-center">
              {getInitials(user?.name)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button
                className={`px-2 py-1 rounded transition-colors ${
                  composerTab === 'write'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setComposerTab('write')}
              >
                Write
              </button>
              <button
                className={`px-2 py-1 rounded transition-colors ${
                  composerTab === 'preview'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setComposerTab('preview')}
              >
                Preview
              </button>
              <span className="text-muted-foreground/50">|</span>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleInsertTemplate}
              >
                Use template
              </button>
            </div>
          </div>

          {composerTab === 'write' ? (
            <Textarea
              value={commentDraft}
              onChange={event => setCommentDraft(event.target.value)}
              placeholder="Share your solution, ask a question, or explain your reasoning..."
              className="min-h-[120px] text-sm"
            />
          ) : (
            <div className="rounded-md border border-border bg-background p-3 min-h-[120px]">
              {!hasDraft ? (
                <p className="text-sm text-muted-foreground">
                  Nothing to preview yet.
                </p>
              ) : (
                <MarkdownRenderer
                  content={commentDraft}
                  className={COMMENT_PROSE_CLASS}
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              Markdown supported
            </span>
            <div className="flex items-center gap-3">
              {!isAuthenticated && (
                <span className="text-xs text-muted-foreground">
                  Sign in to post
                </span>
              )}
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={commentSubmitting || !isAuthenticated}
              >
                {commentSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>

          {commentsError && (
            <p className="text-sm text-destructive mt-2">{commentsError}</p>
          )}
        </div>
      </div>

      {commentsLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No comments yet. Be the first to share your approach.</p>
      ) : (
        <div className="divide-y divide-border">
          {commentThreads.roots.map(root => {
            const replies = commentThreads.repliesByParent.get(root.id) ?? []
            const rootAuthor = root.user_name || 'Anonymous'
            return (
              <div key={root.id}>
                <div className="py-4">
                  {renderComment(root, false)}
                </div>
                {replies.map(reply => (
                  <div key={reply.id} className="py-4 border-t border-border/50 ml-11">
                    {renderComment(reply, true, rootAuthor)}
                  </div>
                ))}
                {replyTarget && replyTarget.parentId === root.id && (
                  <div className="py-4 border-t border-border/50 ml-11">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-muted text-xs font-medium text-muted-foreground flex items-center justify-center">
                        {getInitials(user?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            Replying to <span className="text-foreground/70">@{replyTarget.replyToName}</span>
                          </span>
                          <button
                            className="text-muted-foreground hover:text-foreground text-xs"
                            onClick={handleCancelReply}
                          >
                            Cancel
                          </button>
                        </div>
                        <Textarea
                          value={replyDraft}
                          onChange={event => setReplyDraft(event.target.value)}
                          placeholder="Write your reply..."
                          className="min-h-[100px] text-sm"
                        />
                        {replyError && (
                          <p className="text-sm text-destructive mt-2">{replyError}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Button
                            size="sm"
                            onClick={handleSubmitReply}
                            disabled={replySubmitting || !isAuthenticated}
                          >
                            {replySubmitting ? 'Posting...' : 'Reply'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
