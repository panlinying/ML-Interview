'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { basePath, docHref, homeHref } from '@/lib/basePath'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  slug: string
  category: string
  children?: NavItem[]
}

// Navigation structure
const navigation: NavItem[] = [
  {
    title: 'Reference',
    slug: '00-Reference',
    category: '00-Reference',
    children: [
      { title: 'Start Here', slug: '00-Reference/Start Here', category: '00-Reference' },
      { title: 'Learning Path', slug: '00-Reference/Learning Path', category: '00-Reference' },
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

  // Auto-expand section containing current page
  useEffect(() => {
    for (const section of navigation) {
      if (section.children?.some(item => pathname.includes(encodeURIComponent(item.slug.split('/').pop() || '')))) {
        setExpanded(prev => ({ ...prev, [section.slug]: true }))
        break
      }
    }
  }, [pathname])

  // Close mobile menu on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const toggleSection = useCallback((slug: string) => {
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }))
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50"
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="sidebar-nav"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <Link href={homeHref} className="block" onClick={closeMobileMenu}>
              <div className="flex items-center gap-3">
                <img
                  src={`${basePath}/logo.svg`}
                  alt="ML Interview Prep logo"
                  className="h-11 w-11"
                  loading="lazy"
                />
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    ML Interview Prep
                  </h1>
                  <p className="text-sm text-muted-foreground">10-Week Curriculum</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="lg:hidden absolute top-4 right-4"
            aria-label="Close navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-2" aria-label="Documentation sections">
              {navigation.map(section => (
                <div key={section.slug} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.slug)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                    aria-expanded={expanded[section.slug]}
                    aria-controls={`nav-section-${section.slug}`}
                  >
                    <span>{section.title}</span>
                    <svg
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        expanded[section.slug] ? 'rotate-90' : ''
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expanded[section.slug] && section.children && (
                    <div
                      id={`nav-section-${section.slug}`}
                      className="ml-2 pl-3 border-l border-border space-y-1"
                      role="group"
                      aria-label={`${section.title} pages`}
                    >
                      {section.children.map(item => {
                        const href = docHref(item.slug)
                        const isActive = pathname === href || pathname === `${href}/`

                        return (
                          <Link
                            key={item.slug}
                            href={href}
                            onClick={closeMobileMenu}
                            className={cn(
                              "block px-3 py-1.5 text-sm rounded-md transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              isActive
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                            aria-current={isActive ? 'page' : undefined}
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
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Cmd</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">K</kbd> to search
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
