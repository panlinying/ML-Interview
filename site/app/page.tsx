import Link from 'next/link'
import { basePath } from '@/lib/basePath'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          ML Interview Preparation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          A comprehensive 10-week ML engineer interview preparation system
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Link
          href={`${basePath}/docs/00-Reference%2FStart%20Here`}
          className="block p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <h2 className="text-xl font-semibold mb-2">Start Here →</h2>
          <p className="text-blue-100">Begin your interview prep journey</p>
        </Link>

        <Link
          href={`${basePath}/docs/00-Reference%2FExecution%20Playbook%20(Optimized)`}
          className="block p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white hover:from-purple-600 hover:to-purple-700 transition-all"
        >
          <h2 className="text-xl font-semibold mb-2">Execution Playbook →</h2>
          <p className="text-purple-100">IOI methodology & problem-solving framework</p>
        </Link>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Curriculum Overview
          </h2>
          <div className="grid gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white">Part 1: Coding Interview (Weeks 1-4)</h3>
              <p className="text-gray-600 dark:text-gray-400">Arrays, Trees, Graphs, Dynamic Programming - 40+ LeetCode problems</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white">Part 2: ML Fundamentals (Weeks 1-6)</h3>
              <p className="text-gray-600 dark:text-gray-400">Math foundations, Classical ML, Deep Learning, Transformers</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white">Part 3: ML System Design (Weeks 7-10)</h3>
              <p className="text-gray-600 dark:text-gray-400">Design framework, Recommendation, Ranking, Ads systems</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
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
                href={`${basePath}/docs/${encodeURIComponent(item.slug)}`}
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{item.title}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
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
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full font-semibold text-sm">
                  {i + 1}
                </span>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{item.step}</span>
                  <span className="text-gray-600 dark:text-gray-400"> {item.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
