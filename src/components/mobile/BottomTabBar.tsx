'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProfileModal from './ProfileModal'
import { useMode } from '@/components/ModeProvider'

interface Props {
  twitterHandle?: string | null
  unreadActivities?: number
  image?: string | null
  name?: string | null
  userTitle?: string | null
  availability?: string | null
}

const BRAND = '#14B8A6'
const MUTED = '#9ca3af'
const YELLOW = '#f59e0b'

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

function MessagesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? BRAND : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={active ? 'rgba(20,184,166,0.15)' : 'none'}/>
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? YELLOW : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function BottomTabBar({
  twitterHandle,
  unreadActivities = 0,
  image = null,
  name = null,
  userTitle = null,
  availability = null,
}: Props) {
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const { mode } = useMode()

  const isProfileActive = pathname.startsWith('/u/') || pathname === '/dashboard'

  const discoverHref  = mode === 'hiring' ? '/talent' : '/jobs'
  const discoverLabel = mode === 'hiring' ? 'Find Talent' : 'Find Work'
  const discoverMatch = (p: string) => mode === 'hiring' ? p.startsWith('/talent') : p.startsWith('/jobs')

  const tabsLeft = [
    { href: '/',             label: 'Home',         icon: (a: boolean) => <HomeIcon active={a} />,     match: (p: string) => p === '/',              activeColor: BRAND  },
    { href: discoverHref,    label: discoverLabel,  icon: (a: boolean) => <DiscoverIcon active={a} />, match: discoverMatch,                          activeColor: BRAND  },
    { href: '/messages',     label: 'Messages',     icon: (a: boolean) => <MessagesIcon active={a} />, match: (p: string) => p.startsWith('/messages'), activeColor: BRAND  },
    { href: '/activities',   label: 'Activities',   icon: (a: boolean) => <BellIcon active={a} />,     match: (p: string) => p.startsWith('/activities'), activeColor: YELLOW },
  ]

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        style={{
          position: 'fixed',
          bottom: '0px',
          top: 'auto',
          left: '0px',
          right: '0px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '56px',
          backgroundColor: 'var(--nav-bg, #ffffff)',
          borderTop: '1px solid var(--nav-border, #e5e7eb)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {tabsLeft.map((tab) => {
          const active = tab.match(pathname)
          const color = active ? tab.activeColor : MUTED
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
                gap: 3,
                padding: '6px 0',
                textDecoration: 'none',
                color,
                position: 'relative',
                minHeight: 44,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Icon pill — filled background when active */}
              <span style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 28, borderRadius: 10,
                background: active ? `${tab.activeColor}18` : 'transparent',
                transition: 'background 0.2s',
              }}>
                {tab.icon(active)}
                {tab.href === '/activities' && unreadActivities > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    minWidth: 16, height: 16, padding: '0 3px', borderRadius: 99,
                    background: '#ef4444', color: 'white',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}>
                    {unreadActivities > 9 ? '9+' : unreadActivities}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: '0.03em', lineHeight: 1, color }}>
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* Profile tab — opens bottom sheet modal */}
        <button
          onClick={() => setProfileOpen(true)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            padding: '6px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isProfileActive ? BRAND : MUTED,
            position: 'relative',
            minHeight: 44,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 28, borderRadius: 10,
            background: isProfileActive ? `${BRAND}18` : 'transparent',
            transition: 'background 0.2s',
          }}>
            <ProfileIcon active={isProfileActive} />
          </span>
          <span style={{ fontSize: 10, fontWeight: isProfileActive ? 700 : 400, letterSpacing: '0.03em', lineHeight: 1 }}>
            Profile
          </span>
        </button>
      </nav>

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        image={image}
        name={name}
        twitterHandle={twitterHandle ?? null}
        userTitle={userTitle}
        availability={availability}
        unreadCount={unreadActivities}
        gigsCount={0}
      />
    </>
  )
}
