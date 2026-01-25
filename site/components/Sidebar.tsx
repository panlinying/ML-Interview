'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { basePath, docHref, homeHref, appHref } from '@/lib/basePath'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
}

interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

// Navigation structure
const navigation: NavSection[] = [
  {
    id: 'practice',
    title: 'Practice',
    items: [
      { title: 'Practice Home', href: docHref('00-Start/Practice Home') },
      { title: 'Practice Loop', href: docHref('00-Start/Practice Loop') },
      { title: 'Practice Sets', href: appHref('/sets') },
      { title: 'Problem Tracker', href: appHref('/problems') },
      { title: 'Dashboard', href: appHref('/dashboard') },
      { title: 'Quick Links', href: docHref('00-Start/Quick Links') },
    ],
  },
  {
    id: 'core',
    title: 'Core',
    items: [
      { title: 'ML Core Overview', href: docHref('20-ML-Core/Overview') },
      { title: 'ML Cheat Sheet', href: docHref('20-ML-Core/ML Cheat Sheet') },
      { title: 'System Design Overview', href: docHref('30-System-Design/Overview') },
      { title: 'Framework & Systems', href: docHref('30-System-Design/Framework & Systems') },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    practice: true,
    core: true,
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto-expand section containing current page
  useEffect(() => {
    const normalizedPath = pathname.replace(/\/$/, '') || '/'
    for (const section of navigation) {
      if (section.items.some(item => (item.href.replace(/\/$/, '') || '/') === normalizedPath)) {
        setExpanded(prev => ({ ...prev, [section.id]: true }))
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

  const toggleSection = useCallback((id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
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
                  <p className="text-sm text-muted-foreground">Practice-first prep</p>
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
            <nav className="space-y-2" aria-label="Primary navigation">
              {navigation.map(section => (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                    aria-expanded={expanded[section.id]}
                    aria-controls={`nav-section-${section.id}`}
                  >
                    <span>{section.title}</span>
                    <svg
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        expanded[section.id] ? 'rotate-90' : ''
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {expanded[section.id] && section.items.length > 0 && (
                    <div
                      id={`nav-section-${section.id}`}
                      className="ml-2 pl-3 border-l border-border space-y-1"
                      role="group"
                      aria-label={`${section.title} links`}
                    >
                      {section.items.map(item => {
                        const href = item.href
                        const normalizedHref = href.replace(/\/$/, '') || '/'
                        const normalizedPath = pathname.replace(/\/$/, '') || '/'
                        const isActive = normalizedPath === normalizedHref

                        return (
                          <Link
                            key={item.href}
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
