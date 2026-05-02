'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

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

export default function NavCategoriesDropdown() {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 56, left: 0 })
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  // Only render portal after mount
  useEffect(() => { setMounted(true) }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Update panel position when opening
  useEffect(() => {
    if (!open) return
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setPanelPos({ top: rect.bottom + 6, left: rect.left })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const desktopStyle: React.CSSProperties = {
    position: 'fixed',
    top: panelPos.top,
    left: panelPos.left,
    zIndex: 9999,
    width: 520,
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
          'bg-transparent border-0 cursor-pointer transition-colors duration-150',
          open
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
        )}
      >
        Categories
        <ChevronDown size={13} className={cn('transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {mounted && open && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div
            style={desktopStyle}
            className={cn(
              'rounded-2xl overflow-hidden p-4',
              'bg-white dark:bg-dark-card',
              'border border-gray-100 dark:border-dark-border',
              'shadow-[0_16px_48px_rgba(0,0,0,0.12)]',
              'grid grid-cols-4 gap-3'
            )}
          >
            {CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {cat.label}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {cat.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'px-2 py-1.5 rounded-lg text-sm font-medium no-underline',
                        'text-gray-700 dark:text-gray-300',
                        'hover:bg-gray-50 dark:hover:bg-dark-hover',
                        'transition-colors duration-100 whitespace-nowrap block'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
