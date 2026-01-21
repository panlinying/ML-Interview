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

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value
  }
  return date.toLocaleString()
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

  const renderComment = (comment: Comment, isReply: boolean) => {
    const author = comment.user_name || 'Anonymous'
    const score = comment.score ?? 0
    const userVote = comment.user_vote ?? 0
    const isVoting = Boolean(votePending[comment.id])
    const voteDisabled = !isAuthenticated || isVoting
    const upvoteClass = userVote === 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'
    const downvoteClass = userVote === -1 ? 'text-foreground font-semibold' : 'text-muted-foreground'
    const avatarClass = isReply
      ? 'h-7 w-7 shrink-0 rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground flex items-center justify-center'
      : 'h-9 w-9 shrink-0 rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground flex items-center justify-center'

    return (
      <div key={comment.id} className={isReply ? 'flex gap-3 pl-9' : 'flex gap-3'}>
        <div className={avatarClass}>{getInitials(comment.user_name)}</div>
        <div className="flex-1">
          <article className="rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{author}</span>
              <span>{formatDate(comment.created_at)}</span>
            </div>
            <div className="px-3 py-3">
              <MarkdownRenderer
                content={comment.body}
                className={COMMENT_PROSE_CLASS}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={upvoteClass}
                  disabled={voteDisabled}
                  onClick={() => handleVote(comment, 1)}
                >
                  +1
                </Button>
                <span className="min-w-[20px] text-center">{score}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={downvoteClass}
                  disabled={voteDisabled}
                  onClick={() => handleVote(comment, -1)}
                >
                  -1
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStartReply(comment)}
                disabled={!isAuthenticated}
              >
                Reply
              </Button>
            </div>
          </article>
        </div>
      </div>
    )
  }

  return (
    <section className="mt-12 space-y-6">
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Discussion</h3>
          <p className="text-sm text-muted-foreground">
            Ask questions, share solutions, and explain reasoning.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
            <Button
              variant={composerTab === 'write' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setComposerTab('write')}
            >
              Write
            </Button>
            <Button
              variant={composerTab === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setComposerTab('preview')}
            >
              Preview
            </Button>
            <Button variant="ghost" size="sm" onClick={handleInsertTemplate}>
              Outline
            </Button>
          </div>

          {composerTab === 'write' ? (
            <Textarea
              value={commentDraft}
              onChange={event => setCommentDraft(event.target.value)}
              placeholder="Write your comment... (Markdown supported)"
              className="min-h-[220px]"
            />
          ) : (
            <div className="rounded-md border border-border bg-background p-3">
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

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSubmitComment}
              disabled={commentSubmitting || !isAuthenticated}
            >
              {commentSubmitting ? 'Posting...' : 'Post comment'}
            </Button>
            {!isAuthenticated && (
              <span className="text-xs text-muted-foreground">
                Sign in to post.
              </span>
            )}
          </div>

          {commentsError && (
            <p className="text-sm text-destructive">{commentsError}</p>
          )}
        </div>
      </div>

      {commentsLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-6">
          {commentThreads.roots.map(root => {
            const replies = commentThreads.repliesByParent.get(root.id) ?? []
            return (
              <div key={root.id} className="space-y-3">
                {renderComment(root, false)}
                {replies.map(reply => renderComment(reply, true))}
                {replyTarget && replyTarget.parentId === root.id && (
                  <div className="flex gap-3 pl-9">
                    <div className="h-7 w-7 shrink-0 rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground flex items-center justify-center">
                      {getInitials(user?.name)}
                    </div>
                    <div className="flex-1 rounded-lg border border-border bg-card">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        <span>Replying to {replyTarget.replyToName}</span>
                        <Button variant="ghost" size="sm" onClick={handleCancelReply}>
                          Cancel
                        </Button>
                      </div>
                      <div className="space-y-2 px-3 py-3">
                        <Textarea
                          value={replyDraft}
                          onChange={event => setReplyDraft(event.target.value)}
                          placeholder="Write your reply..."
                          className="min-h-[140px]"
                        />
                        {replyError && (
                          <p className="text-sm text-destructive">{replyError}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleSubmitReply}
                            disabled={replySubmitting || !isAuthenticated}
                          >
                            {replySubmitting ? 'Posting...' : 'Post reply'}
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
