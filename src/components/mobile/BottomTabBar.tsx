'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  twitterHandle?: string | null
  unreadActivities?: number
}

const BRAND = '#14B8A6'
const MUTED = '#9ca3af'

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? BRAND : 'none'} stroke={active ? BRAND : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? BRAND : 'none'}/>
    </svg>
  )
}

function ServicesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? 'rgba(13,201,161,0.15)' : 'none'}/>
      <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? 'rgba(13,201,161,0.15)' : 'none'}/>
      <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? 'rgba(13,201,161,0.15)' : 'none'}/>
      <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? 'rgba(13,201,161,0.15)' : 'none'}/>
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4" fill={active ? 'rgba(13,201,161,0.15)' : 'none'}/>
    </svg>
  )
}

export default function BottomTabBar({ twitterHandle, unreadActivities = 0 }: Props) {
  const pathname = usePathname()

  const profileHref = twitterHandle ? `/u/${twitterHandle}` : '/dashboard'

  const tabs = [
    { href: '/',           label: 'Home',      icon: (a: boolean) => <HomeIcon active={a} />,     match: (p: string) => p === '/' },
    { href: '/talent',     label: 'Discover',  icon: (a: boolean) => <DiscoverIcon active={a} />, match: (p: string) => p.startsWith('/talent') },
    { href: '/gigs',       label: 'Services',  icon: (a: boolean) => <ServicesIcon active={a} />, match: (p: string) => p.startsWith('/gigs') || p.startsWith('/services') },
    { href: '/activities', label: 'Activities',icon: (a: boolean) => <BellIcon active={a} />,     match: (p: string) => p.startsWith('/activities') },
    { href: profileHref,   label: 'Profile',   icon: (a: boolean) => <ProfileIcon active={a} />,  match: (p: string) => p.startsWith('/u/') || p === '/dashboard' },
  ]

  return (
    <nav
      aria-label="Bottom navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: 56,
        background: 'var(--surface)',
        borderTop: '0.5px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '6px 0',
              textDecoration: 'none',
              color: active ? BRAND : MUTED,
              position: 'relative',
              minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
              {tab.icon(active)}
              {tab.href === '/activities' && unreadActivities > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  minWidth: 16,
                  height: 16,
                  padding: '0 3px',
                  borderRadius: 99,
                  background: '#ef4444',
                  color: 'white',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {unreadActivities > 9 ? '9+' : unreadActivities}
                </span>
              )}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: active ? BRAND : MUTED,
            }}>
              {tab.label}
            </span>
            {active && (
              <span style={{
                position: 'absolute',
                bottom: 1,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: BRAND,
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
