'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { docHref } from '@/lib/basePath'

interface SearchResult {
  title: string
  slug: string
  excerpt: string
}

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Simple search (client-side)
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    // This is a simple search - in production, you'd use Fuse.js or a search index
    const searchTerms = query.toLowerCase().split(' ')
    const allPages = [
      { title: 'Start Here', slug: '00-Reference/Start Here', excerpt: 'Getting started guide' },
      { title: 'Execution Playbook', slug: '00-Reference/Execution Playbook (Optimized)', excerpt: 'IOI methodology and problem-solving framework' },
      { title: 'Calendar Map', slug: '00-Reference/Calendar Map', excerpt: '10-week schedule overview' },
      { title: 'Week 1-2: Math Foundations', slug: '30-ML-Fundamentals/Week 1-2 Math Foundations + Classical ML', excerpt: 'Linear algebra, probability, classical ML' },
      { title: 'Week 3-4: Deep Learning', slug: '30-ML-Fundamentals/Week 3-4 Deep Learning Foundations', excerpt: 'Neural networks, backprop, optimization' },
      { title: 'ML System Design Framework', slug: '40-ML-System-Design/ML System Design - Framework & Systems', excerpt: 'CLARIFY, METRICS, DATA, MODEL, SERVING' },
    ]

    const filtered = allPages.filter(page =>
      searchTerms.every(term =>
        page.title.toLowerCase().includes(term) ||
        page.excerpt.toLowerCase().includes(term)
      )
    )

    setResults(filtered.slice(0, 5))
  }, [query])

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1 lg:pl-0 pl-12">
          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full max-w-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="hidden sm:inline-flex ml-auto px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* GitHub link */}
          <a
            href="https://github.com/panlinying/ML-Interview"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
          <div
            ref={searchRef}
            className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search documentation..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent outline-none text-gray-900 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="px-2 py-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 rounded"
              >
                ESC
              </button>
            </div>

            {results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {results.map(result => (
                  <Link
                    key={result.slug}
                    href={docHref(result.slug)}
                    onClick={() => {
                      setSearchOpen(false)
                      setQuery('')
                    }}
                    className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{result.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{result.excerpt}</div>
                  </Link>
                ))}
              </div>
            )}

            {query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No results found for &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
