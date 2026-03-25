'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, ClipboardList, Eye, Star, CheckCheck, Users, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { markAllConversationsRead } from '@/actions/messages'
import { markAllNotificationsAsRead, markNotificationRead } from '@/actions/notifications'
import type { NavNotif, NavOrder, NavConv } from '@/types/nav'

interface Props {
  conversations: NavConv[]
  totalMsgUnread: number
  notifications: NavNotif[]
  totalNotifUnread: number
  orders: NavOrder[]
  activeOrderCount: number
}

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  accepted:  '#3b82f6',
  funded:    '#3b82f6',
  delivered: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#94a3b8',
  disputed:  '#ef4444',
}
const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  accepted:  'In Progress',
  funded:    'In Progress',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed:  'Disputed',
}

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function isOnline(iso: string | null): boolean {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() < 3 * 60 * 1000
}

function getDateGroup(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This week'
  return 'Earlier'
}

function renderNotifBody(type: string, body: string) {
  if (type !== 'review') return <>{body}</>
  const parts = body.split(/(★+|☆+)/)
  return (
    <>
      {parts.map((part, i) =>
        /[★☆]/.test(part)
          ? <span key={i} style={{ color: '#f59e0b' }}>{'★'.repeat(part.length)}</span>
          : part
      )}
    </>
  )
}

function NotifIconCircle({ type }: { type: string }) {
  const bg =
    type === 'message'      ? 'bg-teal-400/10' :
    type === 'order'        ? 'bg-amber-400/10' :
    type === 'profile_view' ? 'bg-purple-400/10' :
    type === 'review'       ? 'bg-amber-400/10' :
    'bg-gray-100 dark:bg-white/[0.07]'

  const icon =
    type === 'message'      ? <MessageSquare size={20} style={{ color: '#14b8a6' }} /> :
    type === 'order'        ? <ClipboardList  size={20} style={{ color: '#f59e0b' }} /> :
    type === 'profile_view' ? <Eye            size={20} style={{ color: '#8b5cf6' }} /> :
    type === 'review'       ? <Star           size={20} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> :
    <Bell size={20} style={{ color: '#64748b' }} />

  return (
    <div className={cn('w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center', bg)}>
      {icon}
    </div>
  )
}

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#14B8A6] text-white text-[9px] font-bold leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

type Tab = 'all' | 'messages' | 'notifications' | 'orders'
type FeedItem =
  | { kind: 'message';      data: NavConv;  ts: number }
  | { kind: 'notification'; data: NavNotif; ts: number }
  | { kind: 'order';        data: NavOrder; ts: number }

export default function ActivitiesClient({
  conversations: initialConvs,
  totalMsgUnread: initialMsgUnread,
  notifications: initialNotifs,
  totalNotifUnread: initialNotifUnread,
  orders,
  activeOrderCount,
}: Props) {
  const [convs, setConvs]               = useState(initialConvs)
  const [notifs, setNotifs]             = useState(initialNotifs)
  const [unreadMsgs, setUnreadMsgs]     = useState(initialMsgUnread)
  const [unreadNotifs, setUnreadNotifs] = useState(initialNotifUnread)
  const [activeTab, setActiveTab]       = useState('All Activities')
  const [markingAll, setMarkingAll]     = useState(false)
  const router = useRouter()

  const totalBadge   = unreadMsgs + unreadNotifs + activeOrderCount
  const hasAnyUnread = convs.some(c => c.unread > 0) || notifs.some(n => !n.read)

  async function handleMarkAllRead() {
    const prev = { convs, notifs, unreadMsgs, unreadNotifs }
    setMarkingAll(true)
    setConvs(c => c.map(x => ({ ...x, unread: 0 })))
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    setUnreadMsgs(0)
    setUnreadNotifs(0)
    try {
      await Promise.all([markAllConversationsRead(), markAllNotificationsAsRead()])
      router.refresh()
    } catch {
      setConvs(prev.convs)
      setNotifs(prev.notifs)
      setUnreadMsgs(prev.unreadMsgs)
      setUnreadNotifs(prev.unreadNotifs)
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleNotifClick(n: NavNotif) {
    if (!n.read) {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      setUnreadNotifs(c => Math.max(0, c - 1))
      markNotificationRead(n.id).catch(() => {
        setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: false } : x))
        setUnreadNotifs(c => c + 1)
      })
    }
  }

  // ── Row renderers ─────────────────────────────────────────────────────────

  function MessageRow({ c }: { c: NavConv }) {
    const unread = convs.find(x => x.id === c.id)?.unread ?? c.unread
    const online = isOnline(c.otherUser?.lastSeenAt ?? null)
    return (
      <Link
        href={`/messages/${c.id}`}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: unread > 0 ? '12px' : '3px',
          paddingRight: '0',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          borderLeft: unread > 0 ? '3px solid #14B8A6' : '3px solid transparent',
          background: unread > 0 ? 'rgba(20,184,166,0.04)' : 'transparent',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {c.otherUser?.image ? (
            <Image src={c.otherUser.image} alt="" width={48} height={48}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#14B8A6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: '600' }}>
              {(c.otherUser?.name ?? c.otherUser?.twitterHandle ?? '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: '50%',
            border: '2px solid var(--card-bg)',
            background: unread > 0 ? '#14B8A6' : online ? '#4ade80' : '#d1d5db',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: unread > 0 ? '600' : '500', color: 'var(--foreground)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.otherUser?.name ?? c.otherUser?.twitterHandle ?? 'Unknown'}
            </span>
            <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0, marginTop: '2px' }}>{fmtTime(c.lastMessageTime)}</span>
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '4px', marginBottom: 0, color: unread > 0 ? '#374151' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.lastMessage ?? 'No messages yet'}
          </p>
        </div>
      </Link>
    )
  }

  function NotifRow({ n }: { n: NavNotif }) {
    return (
      <Link
        href={n.link ?? '/notifications'}
        onClick={() => handleNotifClick(n)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: !n.read ? '12px' : '3px',
          paddingRight: '0',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          borderLeft: !n.read ? '3px solid #14B8A6' : '3px solid transparent',
          background: !n.read ? 'rgba(20,184,166,0.04)' : 'transparent',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
      >
        <NotifIconCircle type={n.type} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: !n.read ? '600' : '500', color: 'var(--foreground)', lineHeight: 1.3 }}>
              {n.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginTop: '2px' }}>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#14B8A6', display: 'inline-block' }} />}
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtTime(n.createdAt)}</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '4px', marginBottom: 0, color: '#6b7280' }}>
            {renderNotifBody(n.type, n.body)}
          </p>
        </div>
      </Link>
    )
  }

  function OrderRow({ o }: { o: NavOrder }) {
    const color    = STATUS_COLORS[o.status] ?? '#94a3b8'
    const label    = STATUS_LABELS[o.status] ?? o.status
    const isActive = ['pending', 'accepted', 'funded', 'delivered'].includes(o.status)
    return (
      <Link
        href={`/orders/${o.id}`}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: isActive ? '12px' : '3px',
          paddingRight: '0',
          minHeight: '80px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
          background: isActive ? 'rgba(245,158,11,0.03)' : 'transparent',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'rgba(var(--foreground-rgb), 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {o.other?.image ? (
            <Image src={o.other.image} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#9ca3af' }}>
              {(o.other?.name ?? o.other?.twitterHandle ?? '?').slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--foreground)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {o.gigTitle}
            </span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#14B8A6', flexShrink: 0 }}>${o.amount.toLocaleString()}</span>
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '4px', marginBottom: '6px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {o.role === 'buyer' ? 'Seller' : 'Buyer'}: {o.other?.name ?? o.other?.twitterHandle ?? 'Unknown'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{fmtTime(o.createdAt)}</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '99px', background: `${color}18`, border: `1px solid ${color}40`, color, fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // ── Build chronological feed ──────────────────────────────────────────────

  const allItems: FeedItem[] = [
    ...convs.map(c => ({
      kind: 'message' as const, data: c,
      ts: c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0,
    })),
    ...notifs.map(n => ({
      kind: 'notification' as const, data: n,
      ts: new Date(n.createdAt).getTime(),
    })),
    ...orders.map(o => ({
      kind: 'order' as const, data: o,
      ts: new Date(o.createdAt).getTime(),
    })),
  ].sort((a, b) => b.ts - a.ts)

  const labelOrder = ['Today', 'Yesterday', 'This week', 'Earlier']
  const groupedItems: { label: string; items: FeedItem[] }[] = []
  for (const item of allItems) {
    const ts =
      item.kind === 'message'      ? item.data.lastMessageTime :
      item.kind === 'notification' ? item.data.createdAt :
      item.data.createdAt
    const label = ts ? getDateGroup(ts) : 'Earlier'
    const group = groupedItems.find(g => g.label === label)
    if (group) group.items.push(item)
    else groupedItems.push({ label, items: [item] })
  }
  groupedItems.sort((a, b) => labelOrder.indexOf(a.label) - labelOrder.indexOf(b.label))

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all',           label: 'All Activities', count: totalBadge      },
    { key: 'messages',      label: 'Messages',       count: unreadMsgs      },
    { key: 'notifications', label: 'Notifications',  count: unreadNotifs    },
    { key: 'orders',        label: 'Orders',         count: activeOrderCount },
  ]

  const tabCounts: Record<string, number> = {
    'All Activities': totalBadge,
    'Messages':       unreadMsgs,
    'Notifications':  unreadNotifs,
    'Orders':         activeOrderCount,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>

      {/* ── Header ── */}
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 24px 16px',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#0f172a',
          marginBottom: '4px',
        }}>
          Activities
        </h1>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        width: '100%',
        borderBottom: '1px solid var(--card-border)',
        backgroundColor: 'var(--background)',
        position: 'sticky',
        top: '56px',
        zIndex: 40,
      }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex' }}>
          {['All Activities', 'Messages', 'Notifications', 'Orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '14px 8px',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '400',
                color: activeTab === tab ? '#14B8A6' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #14B8A6' : '2px solid transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '99px',
                  background: '#14B8A6',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: '700',
                  lineHeight: 1,
                }}>
                  {tabCounts[tab] > 99 ? '99+' : tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ paddingBottom: '80px' }}>

          {/* ALL ACTIVITIES */}
          {activeTab === 'All Activities' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll || !hasAnyUnread}
                  style={{ fontSize: '13px', color: '#14B8A6', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', opacity: (markingAll || !hasAnyUnread) ? 0.4 : 1, fontFamily: 'inherit' }}
                >
                  {markingAll ? 'Marking…' : 'Mark all read'}
                </button>
              </div>
              {allItems.length === 0
                ? <EmptyState icon={<Bell size={40} className="text-gray-300" />} title="No activity yet" description="Your messages, notifications and orders will show up here." />
                : groupedItems.map((group, gi) => (
                  <div key={group.label}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: gi === 0 ? '24px 0 10px' : '32px 0 10px',
                      margin: 0,
                    }}>
                      {group.label}
                    </p>
                    {group.items.map((item, i) => (
                      <div key={`${item.kind}-${item.data.id}-${i}`}>
                        {item.kind === 'message'      && <MessageRow c={item.data} />}
                        {item.kind === 'notification' && <NotifRow   n={item.data} />}
                        {item.kind === 'order'        && <OrderRow   o={item.data} />}
                      </div>
                    ))}
                  </div>
                ))
              }
            </>
          )}

          {/* MESSAGES */}
          {activeTab === 'Messages' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <button
                  onClick={async () => { setMarkingAll(true); setConvs(c => c.map(x => ({ ...x, unread: 0 }))); setUnreadMsgs(0); try { await markAllConversationsRead(); router.refresh() } finally { setMarkingAll(false) } }}
                  disabled={markingAll || !convs.some(c => c.unread > 0)}
                  style={{ fontSize: '13px', color: '#14B8A6', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', opacity: (markingAll || !convs.some(c => c.unread > 0)) ? 0.4 : 1, fontFamily: 'inherit' }}
                >
                  {markingAll ? 'Marking…' : 'Mark all read'}
                </button>
              </div>
              {convs.length === 0
                ? <EmptyState icon={<Inbox size={40} className="text-gray-300" />} title="No messages yet" description="Start a conversation with a builder." action={{ label: 'Browse Profiles', href: '/talent' }} />
                : <>
                    <div style={{ paddingTop: '20px' }}>{convs.map(c => <MessageRow key={c.id} c={c} />)}</div>
                    <div style={{ paddingTop: '16px' }}>
                      <Link href="/messages" className="text-[13px] font-semibold text-[#14B8A6] no-underline">Open full inbox →</Link>
                    </div>
                  </>
              }
            </>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'Notifications' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <button
                  onClick={async () => { setMarkingAll(true); setNotifs(n => n.map(x => ({ ...x, read: true }))); setUnreadNotifs(0); try { await markAllNotificationsAsRead(); router.refresh() } finally { setMarkingAll(false) } }}
                  disabled={markingAll || !notifs.some(n => !n.read)}
                  style={{ fontSize: '13px', color: '#14B8A6', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', opacity: (markingAll || !notifs.some(n => !n.read)) ? 0.4 : 1, fontFamily: 'inherit' }}
                >
                  {markingAll ? 'Marking…' : 'Mark all read'}
                </button>
              </div>
              {notifs.length === 0
                ? <EmptyState icon={<CheckCheck size={40} className="text-gray-300" />} title="You're all caught up!" description="No new notifications right now." />
                : <>
                    <div style={{ paddingTop: '20px' }}>{notifs.map(n => <NotifRow key={n.id} n={n} />)}</div>
                    <div style={{ paddingTop: '16px' }}>
                      <Link href="/notifications" className="text-[13px] font-semibold text-[#14B8A6] no-underline">View all notifications →</Link>
                    </div>
                  </>
              }
            </>
          )}

          {/* ORDERS */}
          {activeTab === 'Orders' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <Link
                  href="/orders"
                  style={{ fontSize: '13px', color: '#14B8A6', fontWeight: '500', textDecoration: 'none' }}
                >
                  View all orders →
                </Link>
              </div>
              {orders.length === 0
                ? <EmptyState icon={<Users size={40} className="text-gray-300" />} title="No orders yet" description="Browse talent and make your first hire." action={{ label: 'Browse Profiles', href: '/talent' }} />
                : <div style={{ paddingTop: '20px' }}>{orders.map(o => <OrderRow key={o.id} o={o} />)}</div>
              }
            </>
          )}

        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 opacity-50">{icon}</div>
      <p className="text-[16px] font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-[13px] text-gray-400 mt-1.5 max-w-[260px] leading-relaxed">{description}</p>
      {action && (
        <Link href={action.href} className="mt-5 inline-flex items-center h-9 px-5 rounded-full bg-[#14B8A6] hover:bg-teal-500 text-white text-[13px] font-semibold no-underline transition-colors">
          {action.label}
        </Link>
      )}
    </div>
  )
}
