import { getAllMarkdownFiles, getMarkdownBySlug, resolveWikiLink } from '@/lib/markdown'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { docHref, homeHref } from '@/lib/basePath'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateStaticParams() {
  const files = getAllMarkdownFiles()
  return files.map(file => ({
    slug: file.slug.split('/'),
  }))
}

export async function generateMetadata({ params }: { params: { slug: string[] } }) {
  const slug = params.slug.map(s => decodeURIComponent(s)).join('/')
  const file = getMarkdownBySlug(slug)

  if (!file) {
    return { title: 'Not Found' }
  }

  return {
    title: `${file.title} | ML Interview Prep`,
    description: file.content.slice(0, 160),
  }
}

export default function DocPage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug.map(s => decodeURIComponent(s)).join('/')
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

  // Pre-process wiki links to resolve them to full slugs
  const processedContent = file.content.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (match, link, text) => {
      const displayText = text || link
      const resolvedSlug = resolveWikiLink(link)
      if (resolvedSlug) {
        return `[${displayText}](${docHref(resolvedSlug)})`
      }
      // If not found, return the original text without a link
      return displayText
    }
  )

  return (
    <article className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href={homeHref} className="hover:text-gray-700 dark:hover:text-gray-200">
          Home
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-2">
            <span>/</span>
            {/* Only the last breadcrumb is shown, intermediate paths are not clickable */}
            <span className={i === breadcrumbs.length - 1 ? "text-gray-700 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}>
              {crumb.name}
            </span>
          </span>
        ))}
      </nav>

      {/* Content */}
      <MarkdownRenderer content={processedContent} />

      {/* Footer navigation */}
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          href={homeHref}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </article>
  )
}
