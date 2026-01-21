'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import Link from 'next/link'
import { badgeVariants } from '@/components/ui/badge'
import { basePath, docHref } from '@/lib/basePath'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: Props) {
  const docsPrefix = `${basePath}/docs/`

  return (
    <div className={cn('prose prose-neutral dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith(docsPrefix)) {
              return (
                <Link href={href} className="text-primary hover:underline">
                  {children}
                </Link>
              )
            }
            // Intercept LeetCode problem links and redirect to practice page
            const leetcodeMatch = href?.match(/leetcode\.com\/problems\/([^/]+)/)
            if (leetcodeMatch) {
              const problemSlug = leetcodeMatch[1]
              return (
                <Link
                  href={`/practice?problem=${problemSlug}`}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {children}
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              )
            }
            if (href?.startsWith('http')) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {children}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            }
            return <a href={href}>{children}</a>
          },
          code: ({ className, children, node, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            const raw = String(children).trim()

            if (isInline) {
              if (raw.startsWith('tag:')) {
                const label = raw.slice(4).trim()
                if (label) {
                  return (
                    <span className={cn(badgeVariants({ variant: 'outline' }), 'text-xs font-medium')}>
                      {label}
                    </span>
                  )
                }
              }
              return (
                <code
                  className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <code className={cn(className, "font-mono")} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto border border-border">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">
              {children}
            </td>
          ),
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded border-border"
                  aria-label={checked ? "Completed" : "Not completed"}
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
              {children}
            </blockquote>
          ),
          h1: ({ children, id }) => (
            <h1 id={id} className="text-3xl font-bold text-foreground mt-8 mb-4 scroll-mt-20">
              {children}
            </h1>
          ),
          h2: ({ children, id }) => (
            <h2 id={id} className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-20 border-b border-border pb-2">
              {children}
            </h2>
          ),
          h3: ({ children, id }) => (
            <h3 id={id} className="text-xl font-semibold text-foreground mt-6 mb-3 scroll-mt-20">
              {children}
            </h3>
          ),
          h4: ({ children, id }) => (
            <h4 id={id} className="text-lg font-semibold text-foreground mt-4 mb-2 scroll-mt-20">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-foreground leading-7 my-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-4 space-y-2 text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-4 space-y-2 text-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground">
              {children}
            </li>
          ),
          hr: () => (
            <hr className="my-8 border-border" />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
