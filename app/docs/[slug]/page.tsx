import { getAllMarkdownFiles, getMarkdownBySlug } from '@/lib/markdown'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const basePath = '/ML-Interview'

export async function generateStaticParams() {
  const files = getAllMarkdownFiles()
  return files.map(file => ({
    slug: encodeURIComponent(file.slug),
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug)
  const file = getMarkdownBySlug(slug)

  if (!file) {
    return { title: 'Not Found' }
  }

  return {
    title: `${file.title} | ML Interview Prep`,
    description: file.content.slice(0, 160),
  }
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug)
  const file = getMarkdownBySlug(slug)

  if (!file) {
    notFound()
  }

  // Get breadcrumb parts
  const parts = file.slug.split('/')
  const breadcrumbs = parts.map((part, i) => ({
    name: part,
    path: parts.slice(0, i + 1).join('/'),
  }))

  return (
    <article className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href={basePath} className="hover:text-gray-700 dark:hover:text-gray-200">
          Home
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-2">
            <span>/</span>
            {i === breadcrumbs.length - 1 ? (
              <span className="text-gray-700 dark:text-gray-200">{crumb.name}</span>
            ) : (
              <Link
                href={`${basePath}/docs/${encodeURIComponent(crumb.path)}`}
                className="hover:text-gray-700 dark:hover:text-gray-200"
              >
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Content */}
      <MarkdownRenderer content={file.content} />

      {/* Footer navigation */}
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          href={basePath}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </article>
  )
}
