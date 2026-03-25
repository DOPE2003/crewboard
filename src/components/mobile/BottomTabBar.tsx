'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  twitterHandle?: string | null
  unreadActivities?: number
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#14B8A6' : 'none'} stroke={active ? '#14B8A6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#14B8A6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? '#14B8A6' : 'none'}/>
    </svg>
  )
}

function ServicesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#14B8A6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? 'rgba(20,184,166,0.15)' : 'none'}/>
      <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? 'rgba(20,184,166,0.15)' : 'none'}/>
      <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? 'rgba(20,184,166,0.15)' : 'none'}/>
      <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? 'rgba(20,184,166,0.15)' : 'none'}/>
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#14B8A6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#14B8A6' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4" fill={active ? 'rgba(20,184,166,0.15)' : 'none'}/>
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
    <nav className="btab-bar md:hidden" aria-label="Bottom navigation">
      {tabs.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link key={tab.href} href={tab.href} className={`btab-item${active ? ' btab-item--active' : ''}`}>
            <span className="btab-icon">
              {tab.icon(active)}
              {tab.href === '/activities' && unreadActivities > 0 && (
                <span className="btab-badge">
                  {unreadActivities > 9 ? '9+' : unreadActivities}
                </span>
              )}
            </span>
            <span className="btab-label">{tab.label}</span>
            {active && <span className="btab-dot" />}
          </Link>
        )
      })}
    </nav>
  )
}
