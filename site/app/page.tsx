import Link from 'next/link'
import { docHref } from '@/lib/basePath'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          ML Interview Preparation
        </h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive 10-week ML engineer interview preparation system
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Link
          href={docHref('00-Reference/Start Here')}
          className="group block p-6 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-primary-foreground hover:shadow-lg transition-all duration-200"
        >
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            Start Here
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </h2>
          <p className="text-primary-foreground/80">Begin your interview prep journey</p>
        </Link>

        <Link
          href={docHref('00-Reference/Execution Playbook (Optimized)')}
          className="group block p-6 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl border border-border hover:shadow-lg transition-all duration-200"
        >
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-foreground">
            Execution Playbook
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </h2>
          <p className="text-muted-foreground">IOI methodology & problem-solving framework</p>
        </Link>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Curriculum Overview
          </h2>
          <div className="grid gap-4">
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Weeks 1-4</Badge>
                <h3 className="font-semibold text-foreground">Part 1: Coding Interview</h3>
              </div>
              <p className="text-muted-foreground">Arrays, Trees, Graphs, Dynamic Programming - 40+ LeetCode problems</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Weeks 1-6</Badge>
                <h3 className="font-semibold text-foreground">Part 2: ML Fundamentals</h3>
              </div>
              <p className="text-muted-foreground">Math foundations, Classical ML, Deep Learning, Transformers</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Weeks 7-10</Badge>
                <h3 className="font-semibold text-foreground">Part 3: ML System Design</h3>
              </div>
              <p className="text-muted-foreground">Design framework, Recommendation, Ranking, Ads systems</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Quick Links
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: 'Calendar Map', slug: '00-Reference/Calendar Map' },
              { title: 'Week 1', slug: '10-Weeks/Week 1' },
              { title: 'ML Math Foundations', slug: '30-ML-Fundamentals/Week 1-2 Math Foundations + Classical ML' },
              { title: 'System Design Framework', slug: '40-ML-System-Design/ML System Design - Framework & Systems' },
            ].map(item => (
              <Link
                key={item.slug}
                href={docHref(item.slug)}
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

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            The 5-Step Learning Loop
          </h2>
          <ol className="space-y-3">
            {[
              { step: 'Watch', desc: 'pattern video (15-20 min)' },
              { step: 'Solve', desc: 'template problem with hints (30 min)' },
              { step: 'Practice', desc: '2-3 similar problems (1 hour)' },
              { step: 'Challenge', desc: 'harder variation without hints (45 min)' },
              { step: 'Review', desc: 'next day from memory (15 min)' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full font-semibold text-sm">
                  {i + 1}
                </span>
                <div>
                  <span className="font-semibold text-foreground">{item.step}</span>
                  <span className="text-muted-foreground"> {item.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-background rounded border border-border">Cmd</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-background rounded border border-border">K</kbd> to search the entire curriculum
          </p>
        </section>
      </div>
    </div>
  )
}
