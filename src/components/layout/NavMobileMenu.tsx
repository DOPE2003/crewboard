'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { ChevronRight, X } from 'lucide-react'
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

const BORDER = '0.5px solid var(--border)'

interface Props {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  loggedIn?: boolean
}

export default function NavMobileMenu({ isOpen, onOpen, onClose, loggedIn = false }: Props) {
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
    setIsDark(document.body.classList.contains('dark'))
  }, [])
  useEffect(() => { if (!isOpen) setExpanded(null) }, [isOpen])

  const toggleDarkMode = () => {
    const nextDark = !isDark
    if (nextDark) {
      document.body.classList.add('dark')
      localStorage.setItem('cb-theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('cb-theme', 'light')
    }
    localStorage.setItem('cb-theme-v', '2')
    setIsDark(nextDark)
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const userName = session?.user?.name ?? null
  const userImage = session?.user?.image ?? null

  const drawer = (
    <div
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 50,
        background: 'var(--background)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 24px',
        overflowY: 'auto',
        transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
        opacity: isOpen ? 1 : 0,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        pointerEvents: isOpen ? 'all' : 'none',
      }}
    >
      {/* X close button */}
      <button
        onClick={onClose}
        aria-label="Close menu"
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--foreground)',
          padding: 0,
        }}
      >
        <X size={20} />
      </button>

      {/* Categories */}
      <div style={{ marginTop: 52, flex: 1 }}>
        {CATEGORIES.map((cat) => {
          const open = expanded === cat.label
          return (
            <div key={cat.label}>
              {/* Category row */}
              <button
                onClick={() => setExpanded(open ? null : cat.label)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  borderBottom: BORDER,
                  background: 'transparent', border: 'none',
                  cursor: 'pointer',
                  fontSize: 17, fontWeight: 400,
                  color: 'var(--foreground)',
                  textAlign: 'left',
                }}
              >
                {cat.label}
                <ChevronRight
                  size={16}
                  style={{
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.18s ease',
                  }}
                />
              </button>

              {/* Subcategories */}
              {open && (
                <div>
                  {cat.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 0 12px 16px',
                        borderBottom: BORDER,
                        fontSize: 14, fontWeight: 400,
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                      }}
                    >
                      {item.label}
                      <ChevronRight
                        size={14}
                        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom section */}
      <div style={{ paddingTop: 8 }}>
        {/* Theme toggle */}
        <div
          onClick={toggleDarkMode}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--foreground)' }}>
            Dark mode
          </span>
          <div style={{
            width: 44, height: 24, borderRadius: 99,
            background: isDark ? '#14B8A6' : '#e5e7eb',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'white', position: 'absolute',
              top: 2, left: isDark ? 22 : 2,
              transition: 'left 0.2s',
            }} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'var(--border)' }} />

        {/* User section */}
        {loggedIn ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0, background: '#e2e8f0',
              }}>
                {userImage
                  ? <img src={userImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#134e4a,#0f172a)' }} />
                }
              </div>
              {userName && (
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)' }}>
                  {userName}
                </span>
              )}
            </div>
            <button
              onClick={() => { signOut({ callbackUrl: '/' }); onClose() }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: 'var(--text-muted)',
                padding: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, padding: '14px 0' }}>
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

        {/* Safe-area bottom spacing */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        className="md:hidden flex items-center justify-center"
        style={{
          minWidth: 44, minHeight: 44,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--foreground)',
        }}
      >
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
