'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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

const AVATAR_COLORS = ['#475569', '#0f766e', '#b45309', '#6d28d9', '#0369a1']
function avatarBg(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const CHIP: Record<string, { bg: string; color: string; label: string }> = {
  message:      { bg: '#EBF4FF', color: '#2563EB', label: 'Message' },
  order:        { bg: '#ECFDF5', color: '#059669', label: 'Order' },
  offer:        { bg: '#FFF7ED', color: '#C2410C', label: 'Offer' },
  review:       { bg: '#F5F3FF', color: '#7C3AED', label: 'Review' },
  system:       { bg: '#F3F4F6', color: '#6B7280', label: 'System' },
  profile_view: { bg: '#F3F4F6', color: '#6B7280', label: 'System' },
  welcome:      { bg: '#F3F4F6', color: '#6B7280', label: 'System' },
  signin:       { bg: '#F3F4F6', color: '#6B7280', label: 'System' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', accepted: 'In Progress', funded: 'In Progress',
  delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled', disputed: 'Disputed',
}
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', accepted: '#3b82f6', funded: '#3b82f6',
  delivered: '#8b5cf6', completed: '#22c55e', cancelled: '#94a3b8', disputed: '#ef4444',
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

function getDateGroup(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / 86400000)
  if (diffDays === 0) return 'TODAY'
  if (diffDays === 1) return 'YESTERDAY'
  if (diffDays < 7) return 'THIS WEEK'
  return 'EARLIER'
}

type SidebarTab = 'all' | 'messages' | 'orders' | 'notifications' | 'reviews'
type FeedItem =
  | { kind: 'message';      data: NavConv;  ts: number }
  | { kind: 'notification'; data: NavNotif; ts: number }
  | { kind: 'order';        data: NavOrder; ts: number }

// ── Inline SVG icons ───────────────────────────────────────────────────────────
function IconMsg()   { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IconOrder() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> }
function IconBell()  { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function IconStar()  { return <svg width="10" height="10" viewBox="0 0 24 24" fill="#7C3AED"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }
function IconSearch() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> }

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
  const [activeTab, setActiveTab]       = useState<SidebarTab>('all')
  const [markingAll, setMarkingAll]     = useState(false)
  const [search, setSearch]             = useState('')
  const [dateFilter, setDateFilter]     = useState('all')
  const router = useRouter()

  const totalUnread   = unreadMsgs + unreadNotifs
  const hasAnyUnread  = convs.some(c => c.unread > 0) || notifs.some(n => !n.read)
  const reviewNotifs  = useMemo(() => notifs.filter(n => n.type === 'review'), [notifs])
  const sysNotifs     = useMemo(() => notifs.filter(n => n.type !== 'review'), [notifs])
  const reviewUnread  = reviewNotifs.filter(n => !n.read).length
  const sysUnread     = sysNotifs.filter(n => !n.read).length

  async function handleMarkAllRead() {
    if (markingAll || !hasAnyUnread) return
    setMarkingAll(true)
    const prev = { convs, notifs, unreadMsgs, unreadNotifs }
    setConvs(c => c.map(x => ({ ...x, unread: 0 })))
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    setUnreadMsgs(0)
    setUnreadNotifs(0)
    try {
      await Promise.all([markAllConversationsRead(), markAllNotificationsAsRead()])
      router.refresh()
    } catch {
      setConvs(prev.convs); setNotifs(prev.notifs)
      setUnreadMsgs(prev.unreadMsgs); setUnreadNotifs(prev.unreadNotifs)
    } finally { setMarkingAll(false) }
  }

  const handleNotifClick = useCallback((n: NavNotif) => {
    if (!n.read) {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      setUnreadNotifs(c => Math.max(0, c - 1))
      markNotificationRead(n.id).catch(() => {
        setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: false } : x))
        setUnreadNotifs(c => c + 1)
      })
    }
  }, [])

  // ── Build feed ────────────────────────────────────────────────────────────
  const baseItems = useMemo<FeedItem[]>(() => {
    const msgItems   = convs.map(c => ({ kind: 'message'      as const, data: c, ts: c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0 }))
    const orderItems = orders.map(o => ({ kind: 'order'        as const, data: o, ts: new Date(o.createdAt).getTime() }))

    let notifSrc = notifs
    if (activeTab === 'reviews')       notifSrc = reviewNotifs
    else if (activeTab === 'notifications') notifSrc = sysNotifs
    const notifItems = notifSrc.map(n => ({ kind: 'notification' as const, data: n, ts: new Date(n.createdAt).getTime() }))

    let items: FeedItem[] =
      activeTab === 'all'           ? [...msgItems, ...notifItems, ...orderItems] :
      activeTab === 'messages'      ? msgItems :
      activeTab === 'orders'        ? orderItems :
                                      notifItems

    const q = search.toLowerCase().trim()
    if (q) {
      items = items.filter(item => {
        if (item.kind === 'message') {
          const u = item.data.otherUser
          return (u?.name ?? '').toLowerCase().includes(q) ||
            (u?.twitterHandle ?? '').toLowerCase().includes(q) ||
            (item.data.lastMessage ?? '').toLowerCase().includes(q)
        }
        if (item.kind === 'notification')
          return item.data.title.toLowerCase().includes(q) || item.data.body.toLowerCase().includes(q)
        return item.data.gigTitle.toLowerCase().includes(q) ||
          (item.data.other?.name ?? '').toLowerCase().includes(q)
      })
    }

    if (dateFilter !== 'all') {
      const now = Date.now()
      const cutoff = dateFilter === 'today' ? now - 86400000 :
                     dateFilter === 'week'  ? now - 7 * 86400000 : now - 30 * 86400000
      items = items.filter(item => item.ts >= cutoff)
    }

    return items.sort((a, b) => b.ts - a.ts)
  }, [convs, notifs, orders, activeTab, search, dateFilter, reviewNotifs, sysNotifs])

  const groupedItems = useMemo(() => {
    const ORDER = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'EARLIER']
    const groups: { label: string; items: FeedItem[] }[] = []
    for (const item of baseItems) {
      const ts = item.kind === 'message' ? item.data.lastMessageTime :
                 item.kind === 'notification' ? item.data.createdAt : item.data.createdAt
      const label = ts ? getDateGroup(ts) : 'EARLIER'
      const g = groups.find(x => x.label === label)
      if (g) g.items.push(item)
      else groups.push({ label, items: [item] })
    }
    groups.sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label))
    return groups
  }, [baseItems])

  // ── Sidebar categories ────────────────────────────────────────────────────
  const sidebarCats: { key: SidebarTab; label: string; count: number }[] = [
    { key: 'all',           label: 'All Activities',  count: totalUnread + activeOrderCount },
    { key: 'messages',      label: 'Messages',         count: unreadMsgs },
    { key: 'orders',        label: 'Orders',           count: activeOrderCount },
    { key: 'notifications', label: 'Notifications',    count: sysUnread },
    { key: 'reviews',       label: 'Reviews',          count: reviewUnread },
  ]

  // ── Sub-components ────────────────────────────────────────────────────────
  function Avatar({ name, handle, image, size = 42 }: { name?: string | null; handle?: string | null; image?: string | null; size?: number }) {
    const label = (name ?? handle ?? '?').slice(0, 1).toUpperCase()
    const bg = avatarBg(name ?? handle ?? 'x')
    if (image) return (
      <Image src={image} alt="" width={size} height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    )
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.38, fontWeight: 700 }}>
        {label}
      </div>
    )
  }

  function TypeChip({ type }: { type: string }) {
    const c = CHIP[type] ?? CHIP.system
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 99, background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, lineHeight: 1.5, flexShrink: 0 }}>
        {c.label}
      </span>
    )
  }

  function AvatarBadge({ children }: { children: React.ReactNode }) {
    return (
      <span className="act-avatar-badge">
        {children}
      </span>
    )
  }

  function ActivityCard({ children, unread, href, onClick }: {
    children: React.ReactNode; unread: boolean; href?: string; onClick?: () => void
  }) {
    const cls = `act-card${unread ? ' act-card--unread' : ''}`
    if (href) return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
        {unread && <span className="act-unread-dot" />}
      </Link>
    )
    return (
      <div className={cls} onClick={onClick}>
        {children}
        {unread && <span className="act-unread-dot" />}
      </div>
    )
  }

  function MessageCard({ c }: { c: NavConv }) {
    const unread = convs.find(x => x.id === c.id)?.unread ?? c.unread
    const name = c.otherUser?.name ?? c.otherUser?.twitterHandle ?? 'Unknown'
    return (
      <ActivityCard unread={unread > 0} href={`/messages/${c.id}`}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={c.otherUser?.name} handle={c.otherUser?.twitterHandle} image={c.otherUser?.image} />
          <AvatarBadge><IconMsg /></AvatarBadge>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span className="act-name" style={{ fontWeight: unread > 0 ? 700 : 600 }}>{name}</span>
              <TypeChip type="message" />
            </div>
            <span suppressHydrationWarning className="act-time">{fmtTime(c.lastMessageTime)}</span>
          </div>
          <p className="act-body" style={{ paddingRight: 20 }}>
            {c.lastMessage ?? 'No messages yet'}
          </p>
        </div>
      </ActivityCard>
    )
  }

  function NotifCard({ n }: { n: NavNotif }) {
    const isReview = n.type === 'review'
    return (
      <ActivityCard unread={!n.read} href={n.link ?? '/notifications'} onClick={() => handleNotifClick(n)}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: isReview ? '#f5f3ff' : '#f0fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isReview
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#7C3AED"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              : n.type === 'message'
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              : n.type === 'order'
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            }
          </div>
          <AvatarBadge>{isReview ? <IconStar /> : <IconBell />}</AvatarBadge>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span className="act-name" style={{ fontWeight: !n.read ? 700 : 600 }}>{n.title}</span>
              <TypeChip type={n.type} />
            </div>
            <span className="act-time">{fmtTime(n.createdAt)}</span>
          </div>
          <p className="act-body" style={{ paddingRight: 20, lineHeight: 1.55 }}>{n.body}</p>
        </div>
      </ActivityCard>
    )
  }

  function OrderCard({ o }: { o: NavOrder }) {
    const isActive   = ['pending', 'accepted', 'funded', 'delivered'].includes(o.status)
    const statusColor = STATUS_COLORS[o.status] ?? '#94a3b8'
    const statusLabel = STATUS_LABELS[o.status] ?? o.status
    const otherName   = o.other?.name ?? o.other?.twitterHandle ?? 'Unknown'
    return (
      <ActivityCard unread={isActive} href={`/orders/${o.id}`}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={o.other?.name} handle={o.other?.twitterHandle} image={o.other?.image} />
          <AvatarBadge><IconOrder /></AvatarBadge>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span className="act-name" style={{ fontWeight: 600 }}>{otherName}</span>
              <TypeChip type="order" />
            </div>
            <span suppressHydrationWarning className="act-time">{fmtTime(o.createdAt)}</span>
          </div>
          {/* Preview card */}
          <div className="act-preview-card">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="act-preview-title">{o.gigTitle}</div>
              <div className="act-preview-sub">
                {o.role === 'buyer' ? 'Buying from' : 'Selling to'} {otherName}
                {o.gigCategory ? ` · ${o.gigCategory}` : ''}
              </div>
            </div>
            <span className="act-preview-price">${o.amount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: `${statusColor}18`, color: statusColor, fontSize: 11, fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
              {statusLabel}
            </span>
          </div>
        </div>
      </ActivityCard>
    )
  }

  function EmptyState({ message }: { message: string }) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.4 }}>◎</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 6px' }}>Nothing here yet</p>
        <p style={{ fontSize: 13, margin: 0, maxWidth: 260, marginInline: 'auto', lineHeight: 1.6 }}>{message}</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const tabLabel =
    activeTab === 'all'           ? 'All Activities' :
    activeTab === 'messages'      ? 'Messages' :
    activeTab === 'orders'        ? 'Orders' :
    activeTab === 'notifications' ? 'Notifications' : 'Reviews'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div className="act-layout">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="act-sidebar">
          <p className="act-sidebar-label">Filters</p>
          {sidebarCats.map(cat => {
            const isActive = activeTab === cat.key
            return (
              <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                className={`act-sidebar-btn${isActive ? ' act-sidebar-btn--active' : ''}`}>
                <span className="act-sidebar-btn-label">{cat.label}</span>
                {cat.count > 0 && (
                  <span className={`act-sidebar-badge${isActive ? ' act-sidebar-badge--active' : ''}`}>
                    {cat.count > 99 ? '99+' : cat.count}
                  </span>
                )}
              </button>
            )
          })}

          <div className="act-sidebar-divider" />
          <p className="act-sidebar-label">Quick Actions</p>
          {[
            { label: 'Post a Project', href: '/projects' },
            { label: 'Find Talent',    href: '/talent' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} className="act-sidebar-link">{label}</Link>
          ))}
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main style={{ minWidth: 0 }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                Activities
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'} · last updated just now
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link href="/notifications" className="act-btn-ghost">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Settings
              </Link>
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll || !hasAnyUnread}
                className={`act-btn-primary${!hasAnyUnread || markingAll ? ' act-btn-primary--disabled' : ''}`}
              >
                {markingAll ? 'Marking…' : 'Mark all read'}
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="act-toolbar">
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex' }}>
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search activities…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="act-search"
              />
            </div>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="act-select">
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
            {hasAnyUnread && (
              <button onClick={handleMarkAllRead} disabled={markingAll}
                style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: '#14B8A6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '9px 4px', whiteSpace: 'nowrap' }}>
                {markingAll ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Tab label */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            {tabLabel}
          </p>

          {/* Feed */}
          {baseItems.length === 0 ? (
            <EmptyState message={
              search              ? 'No results match your search.' :
              activeTab === 'messages'      ? 'Your conversations will appear here.' :
              activeTab === 'orders'        ? 'Your orders will appear here.' :
              activeTab === 'reviews'       ? 'Reviews you receive will appear here.' :
              activeTab === 'notifications' ? 'Notifications will appear here.' :
              'No activity yet.'
            } />
          ) : (
            groupedItems.map((group, gi) => (
              <div key={group.label}>
                <p className="act-date-label" style={{ paddingTop: gi === 0 ? 0 : 16 }}>
                  {group.label}
                </p>
                {group.items.map((item, i) => (
                  <div key={`${item.kind}-${item.data.id}-${i}`}>
                    {item.kind === 'message'      && <MessageCard c={item.data} />}
                    {item.kind === 'notification' && <NotifCard   n={item.data} />}
                    {item.kind === 'order'        && <OrderCard   o={item.data} />}
                  </div>
                ))}
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  )
}
