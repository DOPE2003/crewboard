'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

import {
  Menu, X, ChevronDown, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ui/ThemeToggle'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Showcase', href: '/showcase', isNew: true },
  { label: 'Talent', href: '/talent' },
  { label: 'Gigs', href: '/gigs' },
  { label: 'Projects', href: '/projects' },
]

const CATEGORIES = [
  {
    label: 'Creative',
    color: '#f59e0b',
    items: [
      { label: 'Video & Animation', href: '/talent?role=Video+%26+Animation' },
      { label: 'Artist', href: '/talent?role=Artist' },
    ],
  },
  {
    label: 'Design',
    color: '#8b5cf6',
    items: [
      { label: 'Web3 Designer', href: '/talent?role=Web3+Web+Designer' },
      { label: 'Graphic & Design', href: '/talent?role=Graphic+%26+Design' },
      { label: 'Content Creator', href: '/talent?role=Content+Creator' },
    ],
  },
  {
    label: 'Marketing',
    color: '#14b8a6',
    items: [
      { label: 'Social Marketing', href: '/talent?role=Social+Marketing' },
      { label: 'KOL Manager', href: '/talent?role=KOL+Manager' },
      { label: 'Exchange Listings', href: '/talent?role=Exchange+Listings+Manager' },
    ],
  },
  {
    label: 'Tech',
    color: '#3b82f6',
    items: [
      { label: 'Coding & Tech', href: '/talent?role=Coding+%26+Tech' },
      { label: 'AI Engineer', href: '/talent?role=AI+Engineer' },
    ],
  },
]

interface Props {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  loggedIn?: boolean
}

export default function NavMobileMenu({ isOpen, onOpen, onClose, loggedIn = false }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (!isOpen) setExpanded(null) }, [isOpen])

  function toggleAccordion(label: string) {
    setExpanded((prev) => (prev === label ? null : label))
  }

  const drawer = isOpen ? (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[199] bg-black/40"
      />

      {/* Drawer — slides down from top */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-[200]',
        'bg-white dark:bg-dark-card',
        'shadow-[0_8px_40px_rgba(0,0,0,0.18)]',
        'overflow-y-auto max-h-[88vh]',
        'flex flex-col'
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border">
          <span className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main nav links */}
        <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2 px-3 py-3 rounded-xl text-base font-semibold no-underline transition-colors min-h-[48px]',
                  active
                    ? 'text-teal-400 bg-teal-400/8'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover'
                )}
              >
                {item.label}
                {item.isNew && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Category accordions */}
        <div className="flex-1">
          <div className="px-5 pt-3 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Browse by Category
            </span>
          </div>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.label}
              className={cn(i < CATEGORIES.length - 1 && 'border-b border-gray-50 dark:border-dark-border/50')}
            >
              <button
                onClick={() => toggleAccordion(cat.label)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-transparent border-0 cursor-pointer min-h-[52px] text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">
                    {cat.label}
                  </span>
                </div>
                <ChevronDown
                  size={15}
                  className={cn(
                    'text-gray-400 transition-transform duration-200 flex-shrink-0',
                    expanded === cat.label && 'rotate-180'
                  )}
                />
              </button>

              {expanded === cat.label && (
                <div className="bg-gray-50/50 dark:bg-dark-hover/30 pb-1">
                  {cat.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-2 pl-10 pr-5 py-3.5 min-h-[48px] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white no-underline border-b border-gray-50 dark:border-dark-border/30 last:border-0 transition-colors"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: cat.color }}
                      />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom: theme + logout */}
        <div className="border-t border-gray-100 dark:border-dark-border mt-auto">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 dark:border-dark-border/50">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>
          {loggedIn && (
            <div className="px-3 py-2">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2.5 w-full px-3 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
          {!loggedIn && (
            <div className="p-3 flex gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex-1 flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-teal-400 border border-teal-400 no-underline hover:bg-teal-400/8 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex-1 flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-white bg-teal-400 hover:bg-teal-600 no-underline transition-colors"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  ) : null

  return (
    <>
      {/* Hamburger button — always visible on mobile */}
      <button
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        className="md:hidden flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors border-0 bg-transparent cursor-pointer"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Portal — always renders into body */}
      {mounted && createPortal(drawer, document.body)}
    </>
  )
}
