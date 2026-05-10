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

function NodyButton() {
  const [showPopup, setShowPopup] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowPopup((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Nody AI Assistant"
        aria-label="Nody AI Assistant"
        style={{
          width: 40, height: 40, borderRadius: 10,
          border: 'none', background: hovered ? 'rgba(0,0,0,0.05)' : 'transparent',
          cursor: 'pointer', padding: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
      >
        <svg viewBox="0 0 40 40" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
          {/* White outer body / frame */}
          <rect x="5" y="10" width="30" height="24" rx="8" ry="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2"/>
          {/* Dark face screen */}
          <rect x="8" y="13" width="24" height="18" rx="5" ry="5" fill="#0f172a"/>
          {/* Left eye — outer glow */}
          <ellipse cx="15" cy="21" rx="4" ry="5" fill="#14B8A6" opacity="0.85"/>
          {/* Left eye — inner bright */}
          <ellipse cx="15" cy="21" rx="2.5" ry="3.5" fill="#a5f3fc"/>
          {/* Right eye — outer glow */}
          <ellipse cx="25" cy="21" rx="4" ry="5" fill="#14B8A6" opacity="0.85"/>
          {/* Right eye — inner bright */}
          <ellipse cx="25" cy="21" rx="2.5" ry="3.5" fill="#a5f3fc"/>
          {/* Smile */}
          <path d="M15.5 28 Q20 31 24.5 28" stroke="#14B8A6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          {/* Crewboard triangle on forehead */}
          <polygon points="20,14 22,17.5 18,17.5" fill="none" stroke="#14B8A6" strokeWidth="1" strokeLinejoin="round"/>
          <circle cx="20" cy="14" r="1" fill="#14B8A6"/>
          <circle cx="18" cy="17.5" r="1" fill="#14B8A6"/>
          <circle cx="22" cy="17.5" r="1" fill="#14B8A6"/>
          {/* Left wing */}
          <path d="M5 21 Q-1 19 0 27 Q2 32 5 30" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"/>
          <path d="M2 29 Q1 32 2.5 34" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
          {/* Right wing */}
          <path d="M35 21 Q41 19 40 27 Q38 32 35 30" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"/>
          <path d="M38 29 Q39 32 37.5 34" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {showPopup && (
        <>
          <div onClick={() => setShowPopup(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
          <div style={{
            position: 'absolute', top: 44, right: -8, zIndex: 999,
            background: 'var(--background, white)', border: '1px solid var(--card-border, #e5e7eb)',
            borderRadius: 16, padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            minWidth: 230, maxWidth: 270,
          }}>
            {/* Arrow */}
            <div style={{
              position: 'absolute', top: -7, right: 20,
              width: 13, height: 13,
              background: 'var(--background, white)',
              border: '1px solid var(--card-border, #e5e7eb)',
              borderRight: 'none', borderBottom: 'none',
              transform: 'rotate(45deg)',
            }} />
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#0f172a', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                <svg viewBox="0 0 40 40" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="8" width="28" height="24" rx="6" fill="#0f172a"/>
                  <ellipse cx="14" cy="19" rx="4" ry="5" fill="#14B8A6" opacity="0.85"/>
                  <ellipse cx="14" cy="19" rx="2.5" ry="3.5" fill="#a5f3fc"/>
                  <ellipse cx="26" cy="19" rx="4" ry="5" fill="#14B8A6" opacity="0.85"/>
                  <ellipse cx="26" cy="19" rx="2.5" ry="3.5" fill="#a5f3fc"/>
                  <path d="M14 27 Q20 30 26 27" stroke="#14B8A6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground, #111827)', margin: 0 }}>Nody</p>
                <p style={{ fontSize: 11, color: '#14B8A6', margin: 0, fontWeight: 600 }}>AI Assistant</p>
              </div>
            </div>
            <p style={{
              fontSize: 13, color: 'var(--foreground, #374151)', margin: 0, lineHeight: 1.55,
              background: 'rgba(20,184,166,0.07)', borderRadius: 10, padding: '10px 12px',
              borderLeft: '3px solid #14B8A6',
            }}>
              Hey! 👋 I&apos;m Nody — Crewboard&apos;s AI assistant. Coming soon to help you find the perfect freelancer and manage your projects! 🚀
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted, #9ca3af)', margin: '8px 0 0', textAlign: 'right' }}>
              Coming soon ✨
            </p>
          </div>
        </>
      )}
    </div>
  )
}

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
  const [liveUnread, setLiveUnread] = useState(unreadCount)
  const pathname = usePathname()

  // Poll for new notifications every 30s when logged in
  useEffect(() => {
    if (!loggedIn) return;
    setLiveUnread(unreadCount); // sync on SSR prop change (navigation)
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications/count", { cache: "no-store" });
        if (res.ok) {
          const { unread } = await res.json();
          if (unread !== liveUnread) setLiveUnread(unread);
        }
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, [loggedIn, unreadCount]);

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

  const totalBadge = totalUnread + liveUnread + activeCount
  const isActive = pathname === '/activities'
  const isMsgs = pathname === '/messages' || pathname.startsWith('/messages/')

  return (
    <>
      {loggedIn && (
        <Link
          href="/activities"
          title="Activities"
          aria-label="Activities"
          className="hidden md:inline-flex items-center justify-center h-9 w-9 transition-colors duration-150 no-underline rounded-lg"
          style={{
            position: 'relative',
            color: (isActive || totalBadge > 0) ? '#f59e0b' : 'var(--text-muted, #6b7280)',
          }}
        >
          <Bell size={17} />
          {totalBadge > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              minWidth: 16, height: 16, padding: '0 3px', borderRadius: 99,
              background: '#f59e0b', color: 'white',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}>
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </Link>
      )}

      {loggedIn && (
        <Link
          href="/messages"
          title="Messages"
          aria-label="Messages"
          className={cn(
            'hidden md:inline-flex items-center justify-center h-9 w-9 transition-colors duration-150 no-underline rounded-lg',
            isMsgs
              ? 'text-[#14B8A6] dark:text-teal-400'
              : 'text-gray-700 dark:text-gray-300 hover:text-[#14B8A6] dark:hover:text-teal-400'
          )}
          style={{ position: 'relative' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-[4px] rounded-full bg-[#14B8A6] text-white text-[9px] font-bold leading-none">
              {totalUnread > 99 ? '99+' : totalUnread}
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

      {loggedIn && <span className="hidden md:block"><NodyButton /></span>}

      {loggedIn && (
        <div className="hidden md:block" style={{ width: 1, height: 20, background: 'var(--card-border, #e5e7eb)', margin: '0 2px' }} />
      )}

      {/* Profile menu: desktop only — bottom tab bar handles Profile on mobile */}
      <span className="hidden md:block">{children}</span>
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
