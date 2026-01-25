'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Fuse from 'fuse.js'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { basePath, docHref } from '@/lib/basePath'

interface SearchItem {
  kind: 'page' | 'section'
  title: string
  slug: string
  category: string
  body?: string
  anchor?: string
  pageTitle?: string
}

interface SearchIndex {
  version: number
  generatedAt: string
  items: SearchItem[]
}

let cachedItems: SearchItem[] | null = null
let cachedFuse: Fuse<SearchItem> | null = null
let inFlight: Promise<{ items: SearchItem[]; fuse: Fuse<SearchItem> }> | null = null

const buildFuse = (items: SearchItem[]) =>
  new Fuse(items, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'pageTitle', weight: 1.5 },
      { name: 'body', weight: 0.5 },
      { name: 'category', weight: 0.3 },
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
  })

async function loadSearchIndex(): Promise<{ items: SearchItem[]; fuse: Fuse<SearchItem> }> {
  if (cachedItems && cachedFuse) {
    return { items: cachedItems, fuse: cachedFuse }
  }

  if (inFlight) {
    return inFlight
  }

  inFlight = (async () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.sessionStorage.getItem('search-index')
        if (cached) {
          const parsed = JSON.parse(cached) as SearchIndex
          if (parsed?.items?.length) {
            cachedItems = parsed.items
            cachedFuse = buildFuse(parsed.items)
            return { items: cachedItems, fuse: cachedFuse }
          }
        }
      } catch {
        // Ignore cache parsing errors.
      }
    }

    const res = await fetch(`${basePath}/search-index.json`, { cache: 'force-cache' })
    if (!res.ok) {
      throw new Error(`Failed to load search index (${res.status})`)
    }
    const data: SearchIndex = await res.json()
    cachedItems = data.items
    cachedFuse = buildFuse(data.items)

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('search-index', JSON.stringify(data))
      } catch {
        // Ignore storage write errors.
      }
    }

    return { items: cachedItems, fuse: cachedFuse }
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([])
  const [fuse, setFuse] = useState<Fuse<SearchItem> | null>(null)
  const [results, setResults] = useState<SearchItem[]>([])
  const router = useRouter()

  // Load search index on mount
  useEffect(() => {
    let cancelled = false
    loadSearchIndex()
      .then(({ items, fuse }) => {
        if (cancelled) {
          return
        }
        setSearchIndex(items)
        setFuse(fuse)
      })
      .catch((error) => {
        console.error('Failed to load search index:', error)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search when query changes
  useEffect(() => {
    if (!fuse || !query.trim()) {
      setResults([])
      return
    }

    const searchResults = fuse.search(query)
    // Prioritize pages over sections, limit results
    const pages = searchResults
      .filter(r => r.item.kind === 'page')
      .slice(0, 5)
      .map(r => r.item)
    const sections = searchResults
      .filter(r => r.item.kind === 'section')
      .slice(0, 5)
      .map(r => r.item)

    setResults([...pages, ...sections])
  }, [query, fuse])

  const handleSelect = useCallback((item: SearchItem) => {
    setOpen(false)
    setQuery('')

    const href = item.anchor
      ? `${docHref(item.slug)}#${item.anchor}`
      : docHref(item.slug)
    router.push(href)
  }, [router])

  // Show popular pages when no query
  const popularPages = searchIndex
    .filter(item => item.kind === 'page')
    .filter(item =>
      item.slug.includes('Practice Home') ||
      item.slug.includes('Practice Loop') ||
      item.slug.includes('Framework') ||
      item.slug.includes('Set 01')
    )
    .slice(0, 5)

  const pages = results.filter(r => r.kind === 'page')
  const sections = results.filter(r => r.kind === 'section')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-muted rounded-lg hover:bg-accent transition-colors w-full max-w-xs"
        aria-label="Search documentation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex ml-auto px-2 py-0.5 text-xs bg-background rounded border border-border">
          <span className="text-xs">Cmd</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search documentation..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {query.trim() === '' && popularPages.length > 0 && (
            <CommandGroup heading="Popular">
              {popularPages.map((item) => (
                <CommandItem
                  key={item.slug}
                  value={item.title}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{item.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {pages.length > 0 && (
            <CommandGroup heading="Pages">
              {pages.map((item) => (
                <CommandItem
                  key={item.slug}
                  value={`${item.title} ${item.category}`}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{item.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {sections.length > 0 && (
            <CommandGroup heading="Sections">
              {sections.map((item, index) => (
                <CommandItem
                  key={`${item.slug}-${item.anchor}-${index}`}
                  value={`${item.title} ${item.pageTitle} ${item.category}`}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.pageTitle}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
