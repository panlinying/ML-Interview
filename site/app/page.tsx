import Link from 'next/link'
import { docHref, appHref } from '@/lib/basePath'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAllMarkdownFiles } from '@/lib/markdown'

function parseSetNumber(slug: string): number {
  const name = slug.split('/').pop() || ''
  const match = /^Set\s+(\d+)/i.exec(name)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

export default function Home() {
  const files = getAllMarkdownFiles()
  const sets = files
    .filter(file => file.slug.startsWith('10-Sets/') && file.slug !== '10-Sets/Overview')
    .sort((a, b) => parseSetNumber(a.slug) - parseSetNumber(b.slug))

  const firstSet = sets[0]
  const coreModule = files.find(file => file.slug.startsWith('20-ML-Core/Module 01'))
  const systemFramework = files.find(file => file.slug === '30-System-Design/Framework & Systems')

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-12">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Badge variant="outline">Practice-first</Badge>
          <h1 className="text-4xl font-bold text-foreground">
            ML Interview Prep that starts with practice
          </h1>
          <p className="text-lg text-muted-foreground">
            For experienced engineers: run focused sets, keep ML core sharp, and drill system design every week.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={firstSet ? docHref(firstSet.slug) : docHref('10-Sets/Overview')}>
                Start Set 01
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={appHref('/sets')}>Browse Sets</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Start today</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Warm up</span>
              <span>10 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Set practice</span>
              <span>60-90 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Review</span>
              <span>10 min</span>
            </div>
          </div>
          <Button variant="secondary" asChild className="w-full">
            <Link href={docHref('00-Start/Practice Loop')}>Open Practice Loop</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-foreground mb-4">Core tracks</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <Badge variant="secondary">Primary</Badge>
            <h3 className="text-lg font-semibold text-foreground">Coding Sets</h3>
            <p className="text-sm text-muted-foreground">
              4-5 focused sets per week. Patterns first, speed second.
            </p>
            <Link href={appHref('/sets')} className="text-sm text-primary hover:underline">
              Browse all sets
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <Badge variant="outline">ML Core</Badge>
            <h3 className="text-lg font-semibold text-foreground">ML Fundamentals</h3>
            <p className="text-sm text-muted-foreground">
              Refresh the fundamentals and explain tradeoffs crisply.
            </p>
            <Link href={coreModule ? docHref(coreModule.slug) : docHref('20-ML-Core/Overview')} className="text-sm text-primary hover:underline">
              Start Module 01
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <Badge variant="outline">System Design</Badge>
            <h3 className="text-lg font-semibold text-foreground">Design Drills</h3>
            <p className="text-sm text-muted-foreground">
              Structure ambiguous problems with metrics, data, and modeling choices.
            </p>
            <Link href={systemFramework ? docHref(systemFramework.slug) : docHref('30-System-Design/Overview')} className="text-sm text-primary hover:underline">
              Open the framework
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-foreground mb-4">Quick links</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: 'Practice Home', href: docHref('00-Start/Practice Home') },
            { title: 'Core Flow', href: docHref('00-Start/Core Flow') },
            { title: 'ML Core Overview', href: docHref('20-ML-Core/Overview') },
            { title: 'System Design Overview', href: docHref('30-System-Design/Overview') },
          ].map(item => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors group"
            >
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-foreground group-hover:text-primary transition-colors">{item.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
