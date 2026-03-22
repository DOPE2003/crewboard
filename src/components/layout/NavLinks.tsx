'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Home', href: '/', isNew: false },
  { label: 'Showcase', href: '/showcase', isNew: true },
  { label: 'Talent', href: '/talent', isNew: false },
  { label: 'Gigs', href: '/gigs', isNew: false },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150',
              'whitespace-nowrap',
              active
                ? 'text-teal-400'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {item.isNew ? (
              <span className="relative">
                {item.label}
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              </span>
            ) : item.label}
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-teal-400 rounded-full" />
            )}
          </Link>
        )
      })}
    </>
  )
}
