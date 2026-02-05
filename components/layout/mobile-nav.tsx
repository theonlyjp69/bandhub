'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, MessageSquare, FolderOpen, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  bandId?: string
}

export function MobileNav({ bandId }: MobileNavProps) {
  const pathname = usePathname()

  // If we're not in a band context, show main nav
  if (!bandId) {
    return null
  }

  const navItems = [
    { href: `/band/${bandId}`, icon: Home, label: 'Home' },
    { href: `/band/${bandId}/calendar`, icon: Calendar, label: 'Calendar' },
    { href: `/band/${bandId}/chat`, icon: MessageSquare, label: 'Chat' },
    { href: `/band/${bandId}/files`, icon: FolderOpen, label: 'Files' },
    { href: `/band/${bandId}/threads`, icon: MoreHorizontal, label: 'More' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.label === 'More' && (
              pathname.includes('/threads') ||
              pathname.includes('/announcements') ||
              pathname.includes('/members') ||
              pathname.includes('/availability')
            ))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                'min-w-[64px] px-2',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
