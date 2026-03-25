'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import NavMobileMenu from './NavMobileMenu'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import type { NavNotif, NavOrder, NavConv } from '@/types/nav'

type Panel = 'menu' | null

interface Props {
  loggedIn: boolean
  conversations: NavConv[]
  totalUnread: number
  notifications: NavNotif[]
  unreadCount: number
  orders: NavOrder[]
  activeCount: number
  hasIncompleteOnboarding: boolean
  userImage?: string | null
  twitterHandle?: string | null
  children: ReactNode
}

export default function NavControlsClient({
  loggedIn,
  totalUnread,
  unreadCount,
  activeCount,
  userImage,
  twitterHandle,
  children,
}: Props) {
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const pathname = usePathname()

  useEffect(() => { setOpenPanel(null) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = openPanel !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [openPanel])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenPanel(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const totalBadge = totalUnread + unreadCount + activeCount
  const isActive = pathname === '/activities'

  return (
    <>
      {loggedIn && (
        <Link
          href="/activities"
          className={cn(
            'hidden md:inline-flex items-center gap-1.5 h-9 px-2 text-[13px] font-medium transition-colors duration-150 no-underline',
            isActive
              ? 'text-[#14B8A6] dark:text-teal-400'
              : 'text-gray-700 dark:text-gray-300 hover:text-[#14B8A6] dark:hover:text-teal-400'
          )}
        >
          <Bell size={16} />
          <span>Activities</span>
          {totalBadge > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full bg-[#14B8A6] text-white text-[10px] font-bold leading-none">
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </Link>
      )}

      {!loggedIn && (
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
          <Link
            href="/login"
            style={{
              fontSize: 13, fontWeight: 600, padding: "7px 18px",
              borderRadius: 99, border: "1px solid #14B8A6",
              color: "#14B8A6", background: "transparent",
              textDecoration: "none", lineHeight: 1,
            }}
          >
            Log in
          </Link>
          <Link
            href="/register"
            style={{
              fontSize: 13, fontWeight: 600, padding: "7px 18px",
              borderRadius: 99, border: "none",
              background: "#14B8A6", color: "#fff",
              textDecoration: "none", lineHeight: 1,
            }}
          >
            Join
          </Link>
        </div>
      )}

      <span className="hidden md:block"><ThemeToggle /></span>

      <span className="hidden md:block">{children}</span>

      {/* ── Mobile-only: Avatar only (bottom tab bar handles bell/nav) ── */}
      {loggedIn && twitterHandle && (
        <Link
          href={`/u/${twitterHandle}`}
          className="flex md:hidden"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}
        >
          <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: 'var(--avatar-bg)', flexShrink: 0 }}>
            {userImage
              ? <img src={userImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#134e4a,#0f172a)' }} />
            }
          </div>
        </Link>
      )}
      {!loggedIn && (
        <Link
          href="/login"
          className="flex md:hidden"
          style={{ fontSize: 13, fontWeight: 600, color: '#14B8A6', textDecoration: 'none', padding: '6px 10px' }}
        >
          Log in
        </Link>
      )}

      <NavMobileMenu
        isOpen={openPanel === 'menu'}
        onOpen={() => setOpenPanel('menu')}
        onClose={() => setOpenPanel(null)}
        loggedIn={loggedIn}
      />
    </>
  )
}
