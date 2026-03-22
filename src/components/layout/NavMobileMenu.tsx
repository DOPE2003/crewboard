'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { ChevronRight, X } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

const NAV_LINKS = [
  { label: 'Home',            href: '/' },
  { label: 'Browse Profiles', href: '/talent' },
  { label: 'Services',        href: '/gigs' },
  { label: 'Showcase',        href: '/showcase', dot: true },
  { label: 'Activities',      href: '/activities' },
]

const CATEGORIES = [
  {
    label: 'Creative',
    items: [
      { label: 'Video & Animation', href: '/talent?role=Video+%26+Animation' },
      { label: 'Artist',            href: '/talent?role=Artist' },
    ],
  },
  {
    label: 'Design',
    items: [
      { label: 'Web3 Designer',    href: '/talent?role=Web3+Web+Designer' },
      { label: 'Graphic & Design', href: '/talent?role=Graphic+%26+Design' },
      { label: 'Content Creator',  href: '/talent?role=Content+Creator' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Social Marketing',  href: '/talent?role=Social+Marketing' },
      { label: 'KOL Manager',       href: '/talent?role=KOL+Manager' },
      { label: 'Exchange Listings', href: '/talent?role=Exchange+Listings+Manager' },
    ],
  },
  {
    label: 'Tech',
    items: [
      { label: 'Coding & Tech', href: '/talent?role=Coding+%26+Tech' },
      { label: 'AI Engineer',   href: '/talent?role=AI+Engineer' },
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
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const userName = session?.user?.name ?? null
  const userImage = session?.user?.image ?? null

  const drawer = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1999,
          background: 'rgba(0,0,0,0.35)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Full-screen overlay */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 2000,
          background: 'var(--color-background-primary, #fff)',
          display: 'flex', flexDirection: 'column',
          padding: '20px 24px',
          overflowY: 'auto',
          transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 0.2s ease, opacity 0.2s ease',
          pointerEvents: isOpen ? 'all' : 'none',
        }}
      >
        {/* X close button — top right */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          style={{
            position: 'absolute', top: 20, right: 20,
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-primary, #0f172a)',
            padding: 0,
          }}
        >
          <X size={20} />
        </button>

        {/* Nav links */}
        <nav style={{ marginTop: 52 }}>
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 0',
                  borderBottom: '0.5px solid var(--color-border, rgba(0,0,0,0.08))',
                  fontSize: 18, fontWeight: 400,
                  color: active ? '#14B8A6' : 'var(--color-text-primary, #0f172a)',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
              >
                {item.label}
                {item.dot && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#14B8A6', flexShrink: 0, marginTop: 1 }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Browse by category */}
        <div style={{ marginTop: 28 }}>
          <span style={{
            display: 'block',
            fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--color-text-muted, #94a3b8)',
            marginBottom: 8,
          }}>
            Browse by category
          </span>

          {CATEGORIES.map((cat) => (
            <div key={cat.label} style={{ marginBottom: 4 }}>
              {/* Category label */}
              <div style={{
                fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--color-text-muted, #94a3b8)',
                padding: '8px 0 4px',
              }}>
                {cat.label}
              </div>
              {/* Sub-items */}
              {cat.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 0',
                    borderBottom: '0.5px solid var(--color-border, rgba(0,0,0,0.06))',
                    fontSize: 15, fontWeight: 400,
                    color: 'var(--color-text-primary, #0f172a)',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                  <ChevronRight size={15} style={{ color: 'var(--color-text-muted, #94a3b8)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          {/* Theme toggle row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 16,
          }}>
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-text-primary, #0f172a)' }}>
              Dark mode
            </span>
            <ThemeToggle />
          </div>

          {/* Divider */}
          <div style={{ height: '0.5px', background: 'var(--color-border, rgba(0,0,0,0.08))', marginBottom: 16 }} />

          {/* User section */}
          {loggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e2e8f0' }}>
                  {userImage
                    ? <img src={userImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#134e4a,#0f172a)' }} />
                  }
                </div>
                {userName && (
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary, #0f172a)' }}>
                    {userName}
                  </span>
                )}
              </div>
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); onClose() }}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  color: 'var(--color-text-muted, #94a3b8)',
                  padding: '6px 0',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted, #94a3b8)' }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/login"
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 44, borderRadius: 99,
                  border: '1px solid #14B8A6', color: '#14B8A6',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  background: 'transparent',
                }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 44, borderRadius: 99,
                  background: '#14B8A6', color: '#fff',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  border: 'none',
                }}
              >
                Join
              </Link>
            </div>
          )}

          {/* Safe area spacing */}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        className="md:hidden"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 44, minHeight: 44,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-primary, #0f172a)',
        }}
      >
        {/* Hamburger icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {mounted && createPortal(drawer, document.body)}
    </>
  )
}
