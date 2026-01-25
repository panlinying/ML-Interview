'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { cn } from '@/lib/utils'
import { basePath } from '@/lib/basePath'

const PRACTICE_ROUTE = /^\/practice(\/|$)/

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const normalizedPathname =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || '/'
      : pathname
  const hideSidebar = PRACTICE_ROUTE.test(normalizedPathname)
  const hideHeader = PRACTICE_ROUTE.test(normalizedPathname)

  return (
    <div className="flex min-h-screen bg-background">
      {!hideSidebar && <Sidebar />}
      <div className={cn('flex-1 flex flex-col', !hideSidebar && 'lg:ml-72')}>
        {!hideHeader && <Header />}
        <main className={cn('flex-1', !hideHeader && 'px-4 sm:px-6 lg:px-8 py-6')}>
          {children}
        </main>
      </div>
    </div>
  )
}
