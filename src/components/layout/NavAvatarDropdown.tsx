'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  User, ClipboardList, MessageSquare, Heart,
  CreditCard, Users, Briefcase, HelpCircle, LogOut, ChevronDown, ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMode, setMode } from '@/components/ModeProvider'

interface Props {
  image: string | null
  name: string | null
  twitterHandle?: string | null
  role?: string | null
  availability?: string | null
  unreadCount?: number
  gigsCount?: number
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: '#22c55e',
  open: '#f59e0b',
  busy: '#ef4444',
}
const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  open: 'Open to offers',
  busy: 'Busy',
}

function MenuLink({ href, icon, children, badge }: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: number
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-100"
    >
      <span className="text-gray-400 flex items-center">{icon}</span>
      <span className="flex-1">{children}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-teal-400 text-white rounded-full text-[10px] font-bold px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function NavAvatarDropdown({
  image, name, twitterHandle, role, availability, unreadCount = 0,
}: Props) {
  const [open, setOpen] = useState(false)
  const { mode } = useMode()
  const wrapRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  function switchMode() {
    setMode(mode === 'working' ? 'hiring' : 'working')
  }

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const availColor = availability ? (AVAILABILITY_COLORS[availability] ?? '#94a3b8') : null
  const availLabel = availability ? (AVAILABILITY_LABELS[availability] ?? availability) : null

  return (
    <div ref={wrapRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        className="flex items-center gap-1 p-0.5 rounded-full focus:outline-none"
      >
        <div className={cn(
          'rounded-full overflow-hidden flex-shrink-0 w-8 h-8',
          'border-2 transition-colors duration-150',
          open ? 'border-teal-400' : 'border-transparent'
        )}>
          {image ? (
            <Image
              src={image}
              alt="Profile"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-teal-400 flex items-center justify-center text-white text-xs font-semibold">
              {(name ?? twitterHandle ?? '?').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <ChevronDown
          size={12}
          className={cn(
            'text-gray-400 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className={cn(
          'absolute top-[calc(100%+8px)] right-0 z-[9999]',
          'w-60 rounded-2xl overflow-hidden',
          'bg-white dark:bg-dark-card',
          'border border-gray-100 dark:border-dark-border',
          'shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
        )}>
          {/* Profile header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
              {image ? (
                <Image src={image} alt="" width={44} height={44} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-teal-400 flex items-center justify-center text-white text-sm font-semibold">
                  {(name ?? twitterHandle ?? '?').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {name ?? twitterHandle ?? 'User'}
              </div>
              {twitterHandle && (
                <div className="text-xs text-gray-400 mt-0.5">@{twitterHandle}</div>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {role && (
                  <span className="text-[10px] font-bold text-white bg-teal-400 rounded-full px-2 py-0.5 uppercase tracking-wide">
                    {role}
                  </span>
                )}
                {availColor && availLabel && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: availColor }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: availColor }} />
                    {availLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mode switcher */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
              Current mode
            </div>
            <button
              onClick={switchMode}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-hover hover:bg-gray-100 dark:hover:bg-dark-border transition-colors duration-100"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: mode === 'working' ? '#14b8a6' : '#6366f1' }} />
                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                  {mode === 'working' ? 'Working' : 'Hiring'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                <ArrowLeftRight size={11} />
                Switch to {mode === 'working' ? 'Hiring' : 'Working'}
              </div>
            </button>
          </div>

          {/* Nav links */}
          <div className="p-1.5">
            <MenuLink href={twitterHandle ? `/u/${twitterHandle}` : '/dashboard'} icon={<User size={14} />}>
              My Profile
            </MenuLink>
            <MenuLink href="/orders" icon={<ClipboardList size={14} />}>
              Orders
            </MenuLink>
            <MenuLink href="/messages" icon={<MessageSquare size={14} />} badge={unreadCount}>
              Messages
            </MenuLink>
            <MenuLink href="/saved-talents" icon={<Heart size={14} />}>
              Favorites
            </MenuLink>
          </div>

          {/* Account section */}
          <div className="border-t border-gray-100 dark:border-dark-border p-1.5">
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Account
            </div>
            <MenuLink href="/billing" icon={<CreditCard size={14} />}>
              Billing
            </MenuLink>
            {mode === 'hiring' && (
              <MenuLink href="/talent" icon={<Users size={14} />}>
                Find Talent
              </MenuLink>
            )}
            {mode === 'working' && (
              <MenuLink href="/gigs" icon={<Briefcase size={14} />}>
                My Gigs
              </MenuLink>
            )}
            <MenuLink href="/help" icon={<HelpCircle size={14} />}>
              Help
            </MenuLink>
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 dark:border-dark-border p-1.5">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-100"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
