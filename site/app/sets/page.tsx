import Link from 'next/link'
import { getAllMarkdownFiles } from '@/lib/markdown'
import { docHref } from '@/lib/basePath'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type SetMeta = {
  number: number
  title: string
  slug: string
  topic: string
}

function parseSetMeta(slug: string, title: string): SetMeta {
  const name = slug.split('/').pop() || ''
  const match = /^Set\s+(\d+)\s*-\s*(.*)$/i.exec(name) || /^Set\s+(\d+)\s*-\s*(.*)$/i.exec(title)
  if (match) {
    return {
      number: Number(match[1]),
      topic: match[2],
      title,
      slug,
    }
  }
  return { number: Number.MAX_SAFE_INTEGER, topic: title, title, slug }
}

export default function SetsPage() {
  const files = getAllMarkdownFiles()
  const sets = files
    .filter(file => file.slug.startsWith('10-Sets/') && file.slug !== '10-Sets/Overview')
    .map(file => parseSetMeta(file.slug, file.title))
    .sort((a, b) => a.number - b.number)

  const firstSet = sets[0]

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="outline">Practice Sets</Badge>
          <h1 className="text-3xl font-bold text-foreground mt-3">All sets</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Work through the sets in order. Each one focuses on a pattern cluster and 3-6 problems.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={firstSet ? docHref(firstSet.slug) : docHref('10-Sets/Overview')}>
              Start Set 01
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={docHref('00-Start/Practice Loop')}>Practice Loop</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sets.map(set => (
          <Link
            key={set.slug}
            href={docHref(set.slug)}
            className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Set {set.number.toString().padStart(2, '0')}</div>
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {set.topic}
                </h2>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Focused practice set for {set.topic}.
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
