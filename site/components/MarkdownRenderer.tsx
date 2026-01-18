'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import Link from 'next/link'
import { basePath, docHref } from '@/lib/basePath'

interface Props {
  content: string
}

export function MarkdownRenderer({ content }: Props) {
  const docsPrefix = `${basePath}/docs/`

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith(docsPrefix)) {
              return (
                <Link href={href} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {children}
                </Link>
              )
            }
            if (href?.startsWith('http')) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  {children}
                </a>
              )
            }
            return <a href={href}>{children}</a>
          },
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match

            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              )
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full">{children}</table>
            </div>
          ),
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
