'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { docHref, homeHref } from '@/lib/basePath'

interface NavItem {
  title: string
  slug: string
  category: string
  children?: NavItem[]
}

// This will be populated at build time
const navigation: NavItem[] = [
  {
    title: 'Reference',
    slug: '00-Reference',
    category: '00-Reference',
    children: [
      { title: 'Start Here', slug: '00-Reference/Start Here', category: '00-Reference' },
      { title: 'Calendar Map', slug: '00-Reference/Calendar Map', category: '00-Reference' },
      { title: 'Execution Playbook', slug: '00-Reference/Execution Playbook (Optimized)', category: '00-Reference' },
      { title: 'Quick Reference Links', slug: '00-Reference/Quick Reference Links', category: '00-Reference' },
    ],
  },
  {
    title: 'Weekly Plans',
    slug: '10-Weeks',
    category: '10-Weeks',
    children: Array.from({ length: 10 }, (_, i) => ({
      title: `Week ${i + 1}`,
      slug: `10-Weeks/Week ${i + 1}`,
      category: '10-Weeks',
    })),
  },
  {
    title: 'ML Fundamentals',
    slug: '30-ML-Fundamentals',
    category: '30-ML-Fundamentals',
    children: [
      { title: 'Week 1-2: Math + Classical ML', slug: '30-ML-Fundamentals/Week 1-2 Math Foundations + Classical ML', category: '30-ML-Fundamentals' },
      { title: 'Week 3-4: Deep Learning', slug: '30-ML-Fundamentals/Week 3-4 Deep Learning Foundations', category: '30-ML-Fundamentals' },
      { title: 'Week 5-6: CNNs, RNNs, Transformers', slug: '30-ML-Fundamentals/Week 5-6 CNNs, RNNs, Transformers', category: '30-ML-Fundamentals' },
      { title: 'PyTorch Practice', slug: '30-ML-Fundamentals/PyTorch Practice', category: '30-ML-Fundamentals' },
    ],
  },
  {
    title: 'System Design',
    slug: '40-ML-System-Design',
    category: '40-ML-System-Design',
    children: [
      { title: 'Framework & Systems', slug: '40-ML-System-Design/ML System Design - Framework & Systems', category: '40-ML-System-Design' },
      { title: 'Recommendation System', slug: '40-ML-System-Design/Systems/Recommendation System', category: '40-ML-System-Design' },
      { title: 'Feed Ranking', slug: '40-ML-System-Design/Systems/Feed Ranking', category: '40-ML-System-Design' },
      { title: 'Ads Click Prediction', slug: '40-ML-System-Design/Systems/Ads Click Prediction', category: '40-ML-System-Design' },
      { title: 'Search Ranking', slug: '40-ML-System-Design/Systems/Search Ranking', category: '40-ML-System-Design' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    '00-Reference': true,
    '10-Weeks': false,
    '30-ML-Fundamentals': true,
    '40-ML-System-Design': true,
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSection = (slug: string) => {
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }))
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-100 dark:bg-gray-800"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-50 transform transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <Link href={homeHref} className="block mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              ML Interview Prep
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">10-Week Curriculum</p>
          </Link>

          <nav className="space-y-1">
            {navigation.map(section => (
              <div key={section.slug}>
                <button
                  onClick={() => toggleSection(section.slug)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {section.title}
                  <svg
                    className={`w-4 h-4 transition-transform ${expanded[section.slug] ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {expanded[section.slug] && section.children && (
                  <div className="ml-3 mt-1 space-y-1">
                    {section.children.map(item => {
                      const href = docHref(item.slug)
                      const isActive = pathname === href

                      return (
                        <Link
                          key={item.slug}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {item.title}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
