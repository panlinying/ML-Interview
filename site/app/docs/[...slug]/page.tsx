import { getAllMarkdownFiles, getMarkdownBySlug, resolveWikiLink } from '@/lib/markdown'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { DocEngagement } from '@/components/DocEngagement'
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
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href={homeHref} className="hover:text-foreground transition-colors">
          Home
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {crumb.name}
            </span>
          </span>
        ))}
      </nav>

      {/* Content */}
      <MarkdownRenderer content={processedContent} currentSlug={file.slug} />

      <DocEngagement contentSlug={file.slug} />

      {/* Footer navigation */}
      <div className="mt-12 pt-6 border-t border-border">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </article>
  )
}
