'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { markAllConversationsRead, deleteConversation } from '@/actions/messages'
import { markAllNotificationsAsRead, markNotificationRead, deleteNotification } from '@/actions/notifications'
import type { NavNotif, NavOrder, NavConv } from '@/types/nav'

interface Props {
  conversations: NavConv[]
  totalMsgUnread: number
  notifications: NavNotif[]
  totalNotifUnread: number
  orders: NavOrder[]
  activeOrderCount: number
}

// ── Priority: lower number = shown first ──────────────────────────────────────
function itemPriority(item: FeedItem): number {
  if (item.kind === 'notification') {
    const t = item.data.type
    if (t === 'dispute_opened' || t === 'dispute') return 1
    if (t === 'payment_received' || t === 'escrow_funded' || t === 'escrow_released') return 2
    if (t === 'order') return 3
    if (t === 'message') return 4
    if (t === 'review') return 5
    return 6
  }
  if (item.kind === 'order') {
    if (item.data.status === 'disputed') return 1
    if (item.data.status === 'delivered' || item.data.status === 'funded') return 2
    if (['pending', 'accepted'].includes(item.data.status)) return 3
    return 5
  }
  if (item.kind === 'message') return 4
  return 6
}

const AVATAR_COLORS = ['#475569', '#0f766e', '#b45309', '#6d28d9', '#0369a1']
function avatarBg(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ── Type chips ────────────────────────────────────────────────────────────────
const CHIP: Record<string, { bg: string; color: string; label: string }> = {
  message:          { bg: '#EBF4FF', color: '#2563EB', label: 'Message' },
  order:            { bg: '#ECFDF5', color: '#059669', label: 'Order' },
  offer:            { bg: '#FFF7ED', color: '#C2410C', label: 'Offer' },
  review:           { bg: '#F5F3FF', color: '#7C3AED', label: 'Review' },
  payment_received: { bg: '#ECFDF5', color: '#059669', label: 'Payment' },
  escrow_funded:    { bg: '#EFF6FF', color: '#3B82F6', label: 'Escrow' },
  escrow_released:  { bg: '#D1FAE5', color: '#16A34A', label: 'Released' },
  dispute_opened:   { bg: '#FEF2F2', color: '#EF4444', label: 'Dispute' },
  dispute:          { bg: '#FEF2F2', color: '#EF4444', label: 'Dispute' },
  profile_view:     { bg: '#F3F4F6', color: '#6B7280', label: 'Profile' },
  system:           { bg: '#F3F4F6', color: '#6B7280', label: 'System' },
  welcome:          { bg: '#F3F4F6', color: '#6B7280', label: 'System' },
  signin:           { bg: '#F3F4F6', color: '#6B7280', label: 'System' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Waiting for acceptance', accepted: 'In Progress', funded: 'Escrow locked',
  delivered: 'Delivered — review pending', completed: 'Completed & paid',
  cancelled: 'Cancelled', disputed: 'In dispute',
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

type SidebarTab = 'all' | 'messages' | 'orders' | 'payments' | 'disputes' | 'reviews' | 'system'

function previewLastMessage(body: string | null): string {
  if (!body) return 'No messages yet'
  if (body.startsWith('__OFFER__:')) {
    try {
      const p = JSON.parse(body.slice('__OFFER__:'.length))
      return `📋 Offer: ${p.title} — $${p.amount}`
    } catch { return '📋 Contract Offer' }
  }
  if (body.startsWith('__GIGREQUEST__:')) {
    try { return 'Service request: ' + JSON.parse(body.slice('__GIGREQUEST__:'.length)).title }
    catch { return 'Service Request' }
  }
  if (body.startsWith('__FILE__:')) {
    try {
      const f = JSON.parse(body.slice('__FILE__:'.length))
      if (f.type?.startsWith('image/')) return '📷 Image'
      if (f.type?.startsWith('video/')) return '🎥 Video'
      return `📎 ${f.name}`
    } catch { return '📎 File' }
  }
  return body
}

function parseGigRequest(body: string | null): { title: string; price?: number; days?: number } | null {
  if (!body?.startsWith('__GIGREQUEST__:')) return null
  try { return JSON.parse(body.slice('__GIGREQUEST__:'.length)) }
  catch { return null }
}

type FeedItem =
  | { kind: 'message';      data: NavConv;  ts: number }
  | { kind: 'notification'; data: NavNotif; ts: number }
  | { kind: 'order';        data: NavOrder; ts: number }

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function IconMsg()     { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IconOrder()   { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> }
function IconBell()    { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function IconStar()    { return <svg width="10" height="10" viewBox="0 0 24 24" fill="#7C3AED"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }
function IconSearch()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> }
function IconLock()    { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> }
function IconDispute() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IconCheck()   { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }

// ── Per-type notification icon ────────────────────────────────────────────────
function NotifIcon({ type, size }: { type: string; size: number }) {
  const configs: Record<string, { bg: string; stroke: string; path: React.ReactNode }> = {
    review:           { bg: '#f5f3ff', stroke: '#7C3AED', path: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/> },
    message:          { bg: '#eff6ff', stroke: '#3B82F6', path: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
    order:            { bg: '#ecfdf5', stroke: '#059669', path: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    payment_received: { bg: '#ecfdf5', stroke: '#16a34a', path: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></> },
    escrow_funded:    { bg: '#eff6ff', stroke: '#3B82F6', path: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></> },
    escrow_released:  { bg: '#d1fae5', stroke: '#16a34a', path: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
    dispute_opened:   { bg: '#fef2f2', stroke: '#EF4444', path: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
    dispute:          { bg: '#fef2f2', stroke: '#EF4444', path: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
    profile_view:     { bg: '#f3f4f6', stroke: '#6B7280', path: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> },
  }
  const c = configs[type] ?? { bg: '#f3f4f6', stroke: '#64748b', path: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {c.path}
      </svg>
    </div>
  )
}

// ── CTA helper ────────────────────────────────────────────────────────────────
function CtaBtn({ label, href, urgent }: { label: string; href: string; urgent?: boolean }) {
  const router = useRouter()
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(href) }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 13px', borderRadius: 7, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', flexShrink: 0, border: 'none',
        background: urgent ? '#14B8A6' : 'var(--background)',
        color: urgent ? '#fff' : '#14B8A6',
        outline: urgent ? '1px solid #14B8A6' : '1px solid rgba(20,184,166,0.35)',
        transition: 'opacity 0.15s',
      }}
    >
      {label} →
    </button>
  )
}

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
  const [avatarSize, setAvatarSize]     = useState(42)
  const router = useRouter()

  useEffect(() => {
    const update = () => setAvatarSize(window.innerWidth < 768 ? 36 : 42)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const totalUnread  = unreadMsgs + unreadNotifs
  const hasAnyUnread = convs.some(c => c.unread > 0) || notifs.some(n => !n.read)

  // Categorise notifications — exclude message-type (covered by conversations)
  const nonMsgNotifs    = useMemo(() => notifs.filter(n => n.type !== 'message'), [notifs])
  const reviewNotifs    = useMemo(() => nonMsgNotifs.filter(n => n.type === 'review'), [nonMsgNotifs])
  const paymentNotifs   = useMemo(() => nonMsgNotifs.filter(n => ['payment_received', 'escrow_funded', 'escrow_released'].includes(n.type)), [nonMsgNotifs])
  const disputeNotifs   = useMemo(() => nonMsgNotifs.filter(n => ['dispute_opened', 'dispute'].includes(n.type)), [nonMsgNotifs])
  const systemNotifs    = useMemo(() => nonMsgNotifs.filter(n => ['system', 'welcome', 'signin', 'profile_view'].includes(n.type) || !['review', 'payment_received', 'escrow_funded', 'escrow_released', 'dispute_opened', 'dispute', 'order', 'offer'].includes(n.type)), [nonMsgNotifs])
  const disputeOrders   = useMemo(() => orders.filter(o => o.status === 'disputed'), [orders])

  const reviewUnread    = reviewNotifs.filter(n => !n.read).length
  const paymentUnread   = paymentNotifs.filter(n => !n.read).length
  const disputeCount    = disputeOrders.length + disputeNotifs.filter(n => !n.read).length
  const systemUnread    = systemNotifs.filter(n => !n.read).length

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

  function handleDeleteNotif(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    const notif = notifs.find(n => n.id === id)
    setNotifs(prev => prev.filter(n => n.id !== id))
    if (notif && !notif.read) setUnreadNotifs(c => Math.max(0, c - 1))
    deleteNotification(id).catch(() => {})
  }

  function handleDeleteConv(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    const conv = convs.find(c => c.id === id)
    setConvs(prev => prev.filter(c => c.id !== id))
    if (conv?.unread) setUnreadMsgs(c => Math.max(0, c - conv.unread))
    deleteConversation(id).catch(() => {})
  }

  // ── Build feed ────────────────────────────────────────────────────────────
  const baseItems = useMemo<FeedItem[]>(() => {
    // Conversations: already filtered by unread > 0.
    const msgItems = convs.map(c => ({ kind: 'message' as const, data: c, ts: c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0 }))

    // Orders: only active flows — pending, accepted, funded, delivered, disputed.
    const activeOrderStatuses = new Set(['pending', 'accepted', 'funded', 'delivered', 'disputed'])
    const orderItems = orders
      .filter(o => activeOrderStatuses.has(o.status))
      .map(o => ({ kind: 'order' as const, data: o, ts: new Date(o.createdAt).getTime() }))

    const notifSrc =
      activeTab === 'reviews'  ? reviewNotifs  :
      activeTab === 'payments' ? paymentNotifs :
      activeTab === 'disputes' ? disputeNotifs :
      activeTab === 'system'   ? systemNotifs  :
      nonMsgNotifs

    const notifItems = notifSrc
      .map(n => ({ kind: 'notification' as const, data: n, ts: new Date(n.createdAt).getTime() }))

    let items: FeedItem[] =
      activeTab === 'all'      ? [...msgItems, ...notifItems, ...orderItems] :
      activeTab === 'messages' ? msgItems :
      activeTab === 'orders'   ? orderItems :
      activeTab === 'payments' ? notifItems :
      activeTab === 'disputes' ? [...orders.filter(o => o.status === 'disputed').map(o => ({ kind: 'order' as const, data: o, ts: new Date(o.createdAt).getTime() })), ...notifItems] :
      activeTab === 'system'   ? notifItems :
      notifItems

    const q = search.toLowerCase().trim()
    if (q) {
      items = items.filter(item => {
        if (item.kind === 'message') {
          const u = item.data.otherUser
          return (u?.name ?? '').toLowerCase().includes(q) || (u?.twitterHandle ?? '').toLowerCase().includes(q) || (item.data.lastMessage ?? '').toLowerCase().includes(q)
        }
        if (item.kind === 'notification')
          return item.data.title.toLowerCase().includes(q) || item.data.body.toLowerCase().includes(q)
        return item.data.gigTitle.toLowerCase().includes(q) || (item.data.other?.name ?? '').toLowerCase().includes(q)
      })
    }

    // Sort: by timestamp first, then within same timestamp by priority
    return items.sort((a, b) => {
      const tsDiff = b.ts - a.ts
      if (Math.abs(tsDiff) > 300000) return tsDiff // > 5 min apart: use time
      return itemPriority(a) - itemPriority(b)      // same time window: use priority
    })
  }, [convs, nonMsgNotifs, orders, activeTab, search, reviewNotifs, paymentNotifs, disputeNotifs])

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
    // Within each group, sort by priority then time
    groups.forEach(g => g.items.sort((a, b) => {
      const pd = itemPriority(a) - itemPriority(b)
      if (pd !== 0) return pd
      return b.ts - a.ts
    }))
    groups.sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label))
    return groups
  }, [baseItems])

  // ── Sidebar categories ────────────────────────────────────────────────────
  const sidebarCats: { key: SidebarTab; label: string; count: number; urgent?: boolean }[] = [
    { key: 'all',      label: 'All Activities', count: totalUnread + activeOrderCount },
    { key: 'messages', label: 'Messages',        count: unreadMsgs },
    { key: 'orders',   label: 'Orders',          count: activeOrderCount },
    { key: 'payments', label: 'Payments',        count: paymentUnread },
    { key: 'disputes', label: 'Disputes',        count: disputeCount, urgent: disputeCount > 0 },
    { key: 'reviews',  label: 'Reviews',         count: reviewUnread },
    { key: 'system',   label: 'System',          count: systemUnread },
  ]

  // ── Sub-components ────────────────────────────────────────────────────────
  function Avatar({ name, handle, image, size = 42 }: { name?: string | null; handle?: string | null; image?: string | null; size?: number }) {
    const label = (name ?? handle ?? '?').slice(0, 1).toUpperCase()
    const bg = avatarBg(name ?? handle ?? 'x')
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none' }} />
        )}
        {!image && (
          <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.38, fontWeight: 700 }}>
            {label}
          </div>
        )}
      </div>
    )
  }

  function AvatarBadge({ children }: { children: React.ReactNode }) {
    return <span className="act-avatar-badge">{children}</span>
  }

  function ActivityCard({ children, unread, urgent, href, onClick }: {
    children: React.ReactNode; unread: boolean; urgent?: boolean; href?: string; onClick?: () => void
  }) {
    const cls = `act-card${unread ? ' act-card--unread' : ''}${urgent ? ' act-card--urgent' : ''}`
    if (href) return <Link href={href} className={cls} onClick={onClick}>{children}{unread && <span className="act-unread-dot" />}</Link>
    return <div className={cls} onClick={onClick}>{children}{unread && <span className="act-unread-dot" />}</div>
  }

  // ── Message card ─────────────────────────────────────────────────────────
  function MessageCard({ c }: { c: NavConv }) {
    const current = convs.find(x => x.id === c.id) ?? c
    const unreadCount = current.unread
    const name = c.otherUser?.name ?? c.otherUser?.twitterHandle ?? 'Unknown'
    const gigReq = parseGigRequest(c.lastMessage)

    // Title: group multiple unread as "X new messages"
    const title = unreadCount > 1
      ? `${unreadCount} new messages from ${name}`
      : name

    return (
      <ActivityCard unread={unreadCount > 0} href={`/messages/${c.id}`}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={c.otherUser?.name} handle={c.otherUser?.twitterHandle} image={c.otherUser?.image} size={avatarSize} />
          <AvatarBadge><IconMsg /></AvatarBadge>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
            <span className="act-name" style={{ fontWeight: unreadCount > 0 ? 700 : 600 }}>{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span suppressHydrationWarning className="act-time">{fmtTime(c.lastMessageTime)}</span>
              <button
                onClick={e => handleDeleteConv(e, c.id)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(127,127,127,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1, padding: 0, flexShrink: 0 }}
                aria-label="Delete conversation"
              >×</button>
            </div>
          </div>
          <p className="act-body">
            {gigReq ? `Service request: ${gigReq.title}${gigReq.price ? ` · $${gigReq.price}` : ''}` : previewLastMessage(c.lastMessage)}
          </p>
          {/* CTA */}
          <div style={{ marginTop: 8 }}>
            <CtaBtn label="Reply" href={`/messages/${c.id}`} urgent={unreadCount > 0} />
          </div>
        </div>
      </ActivityCard>
    )
  }

  // ── Notification card ─────────────────────────────────────────────────────
  function NotifCard({ n }: { n: NavNotif }) {
    const isUrgent = ['dispute_opened', 'dispute', 'escrow_funded', 'payment_received'].includes(n.type)

    // CTA based on type
    const cta: { label: string; href: string } | null =
      n.type === 'dispute_opened' || n.type === 'dispute'
        ? { label: 'Resolve Dispute', href: n.link ?? '/orders' }
      : n.type === 'payment_received' || n.type === 'escrow_released'
        ? { label: 'View Transaction', href: n.link ?? '/billing' }
      : n.type === 'escrow_funded'
        ? { label: 'View Order', href: n.link ?? '/orders' }
      : n.type === 'order'
        ? { label: 'View Order', href: n.link ?? '/orders' }
      : n.type === 'review'
        ? { label: 'See Review', href: n.link ?? '/notifications' }
      : n.link
        ? { label: 'Open', href: n.link }
      : null

    const badgeIcon =
      n.type === 'review'           ? <IconStar /> :
      n.type === 'dispute_opened' || n.type === 'dispute' ? <IconDispute /> :
      n.type === 'escrow_funded'    ? <IconLock /> :
      n.type === 'payment_received' || n.type === 'escrow_released' ? <IconCheck /> :
      <IconBell />

    return (
      <ActivityCard unread={!n.read} urgent={isUrgent && !n.read} href={cta?.href} onClick={() => handleNotifClick(n)}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <NotifIcon type={n.type} size={avatarSize} />
          <AvatarBadge>{badgeIcon}</AvatarBadge>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
            <span className="act-name" style={{ fontWeight: !n.read ? 700 : 600 }}>{n.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span className="act-time">{fmtTime(n.createdAt)}</span>
              <button
                onClick={e => handleDeleteNotif(e, n.id)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(127,127,127,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1, padding: 0, flexShrink: 0 }}
                aria-label="Delete"
              >×</button>
            </div>
          </div>
          <p className="act-body" style={{ lineHeight: 1.55 }}>{n.body}</p>
          {cta && (
            <div style={{ marginTop: 8 }}>
              <CtaBtn label={cta.label} href={cta.href} urgent={isUrgent && !n.read} />
            </div>
          )}
        </div>
      </ActivityCard>
    )
  }

  // ── Order card ────────────────────────────────────────────────────────────
  function OrderCard({ o }: { o: NavOrder }) {
    const isDisputed   = o.status === 'disputed'
    const isActive     = ['pending', 'accepted', 'funded', 'delivered'].includes(o.status)
    const statusColor  = STATUS_COLORS[o.status] ?? '#94a3b8'
    const statusLabel  = STATUS_LABELS[o.status] ?? o.status
    const otherName    = o.other?.name ?? o.other?.twitterHandle ?? 'Unknown'

    // CTA
    const cta =
      isDisputed                              ? { label: 'Resolve Dispute', urgent: true  } :
      o.status === 'delivered' && o.role === 'buyer'  ? { label: 'Review & Release Payment', urgent: true  } :
      o.status === 'funded'    && o.role === 'seller' ? { label: 'Accept & Start', urgent: true  } :
      o.status === 'accepted'  && o.role === 'seller' ? { label: 'Submit Delivery', urgent: false } :
      isActive                                ? { label: 'View Progress', urgent: false } :
      o.status === 'completed'                ? { label: 'View Order',    urgent: false } :
      null

    return (
      <ActivityCard unread={isActive || isDisputed} urgent={isDisputed || (o.status === 'delivered' && o.role === 'buyer')}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={o.other?.name} handle={o.other?.twitterHandle} image={o.other?.image} size={avatarSize} />
          <AvatarBadge>{isDisputed ? <IconDispute /> : <IconOrder />}</AvatarBadge>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
            <span className="act-name" style={{ fontWeight: 600 }}>{otherName}</span>
            <span suppressHydrationWarning className="act-time">{fmtTime(o.createdAt)}</span>
          </div>
          {/* Subtitle: role + gig + amount */}
          <p className="act-body">
            <span style={{ fontWeight: 600, color: o.role === 'buyer' ? '#3b82f6' : '#14B8A6', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{o.role === 'buyer' ? 'Buying' : 'Selling'}</span>
            {' · '}{o.gigTitle} · <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>${o.amount.toLocaleString()}</span>
          </p>
          {/* Status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: `${statusColor}18`, color: statusColor, fontSize: 11, fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
              {statusLabel}
            </span>
            {/* Escrow badge */}
            {(o.status === 'funded' || o.status === 'accepted' || o.status === 'delivered') && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Escrow locked
              </span>
            )}
            {o.status === 'completed' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#22c55e' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Escrow released
              </span>
            )}
          </div>
          {/* CTA */}
          {cta && (
            <div style={{ marginTop: 8 }}>
              <CtaBtn label={cta.label} href={`/orders/${o.id}`} urgent={cta.urgent} />
            </div>
          )}
        </div>
      </ActivityCard>
    )
  }

  function EmptyState({ message }: { message: string }) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.35 }}>◎</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 6px' }}>Nothing here yet</p>
        <p style={{ fontSize: 13, margin: 0, maxWidth: 260, marginInline: 'auto', lineHeight: 1.6 }}>{message}</p>
      </div>
    )
  }

  const tabLabel =
    activeTab === 'all'      ? 'All Activities' :
    activeTab === 'messages' ? 'Messages' :
    activeTab === 'orders'   ? 'Orders' :
    activeTab === 'payments' ? 'Payments' :
    activeTab === 'disputes' ? 'Disputes' :
    activeTab === 'system'   ? 'System' :
                               'Reviews'

  const mobileTabs: { key: SidebarTab; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'messages', label: 'Messages' },
    { key: 'orders',   label: 'Orders' },
    { key: 'payments', label: 'Payments' },
    { key: 'disputes', label: 'Disputes' },
    { key: 'reviews',  label: 'Reviews' },
    { key: 'system',   label: 'System' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>

      {/* ── Mobile header ─────────────────────────────────────────────── */}
      <div className="act-mobile-header md:hidden">
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)' }}>Activities</span>
        <button
          onClick={handleMarkAllRead}
          disabled={markingAll}
          style={{ fontSize: 11, color: '#14B8A6', fontWeight: 500, background: 'none', border: 'none', cursor: markingAll ? 'default' : 'pointer', fontFamily: 'inherit', padding: 0, opacity: markingAll ? 0.5 : 1 }}
        >
          {markingAll ? 'Marking…' : 'Mark all read'}
        </button>
      </div>

      {/* ── Mobile filter tabs ────────────────────────────────────────── */}
      <div className="act-mobile-tabs md:hidden">
        {mobileTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`act-mobile-tab${activeTab === tab.key ? ' act-mobile-tab--active' : ''}`}
            style={{ position: 'relative' }}
          >
            {tab.label}
            {tab.key === 'disputes' && disputeCount > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
            )}
          </button>
        ))}
      </div>

      <div className="act-layout">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="act-sidebar">
          <p className="act-sidebar-label">Filters</p>
          {sidebarCats.map(cat => {
            const isActive = activeTab === cat.key
            return (
              <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                className={`act-sidebar-btn${isActive ? ' act-sidebar-btn--active' : ''}`}
                style={{ color: cat.urgent && !isActive ? '#ef4444' : undefined }}>
                <span className="act-sidebar-btn-label">{cat.label}</span>
                {cat.count > 0 && (
                  <span className={`act-sidebar-badge${isActive ? ' act-sidebar-badge--active' : ''}`}
                    style={{ background: cat.urgent && !isActive ? '#ef444420' : undefined, color: cat.urgent && !isActive ? '#ef4444' : undefined }}>
                    {cat.count > 99 ? '99+' : cat.count}
                  </span>
                )}
              </button>
            )
          })}

          <div className="act-sidebar-divider" />
          <p className="act-sidebar-label">Quick Actions</p>
          {[
            { label: 'Post a Service', href: '/gigs/new' },
            { label: 'Browse Talent',  href: '/talent' },
            { label: 'View Orders',    href: '/orders' },
            { label: 'Wallet',         href: '/billing' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} className="act-sidebar-link">{label}</Link>
          ))}
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main style={{ minWidth: 0 }}>

          {/* Desktop header */}
          <div className="hidden md:block">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  Activities
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
                  {disputeCount > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}> · {disputeCount} dispute{disputeCount > 1 ? 's' : ''} need attention</span>}
                </p>
              </div>
              <button onClick={handleMarkAllRead} disabled={markingAll || !hasAnyUnread}
                className={`act-btn-primary${!hasAnyUnread || markingAll ? ' act-btn-primary--disabled' : ''}`}>
                {markingAll ? 'Marking…' : 'Mark all read'}
              </button>
            </div>
          </div>

          {/* Desktop toolbar */}
          <div className="hidden md:block">
            <div className="act-toolbar">
              <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex' }}>
                  <IconSearch />
                </span>
                <input type="text" placeholder="Search activities…" value={search} onChange={e => setSearch(e.target.value)} className="act-search" />
              </div>
            </div>
          </div>

          {/* Tab label */}
          <div className="hidden md:block">
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 10px' }}>
              {tabLabel}
            </p>
          </div>

          {/* Feed */}
          {baseItems.length === 0 ? (
            <EmptyState message={
              search               ? 'No results match your search.' :
              activeTab === 'messages' ? 'Your conversations will appear here.' :
              activeTab === 'orders'   ? 'Your orders will appear here.' :
              activeTab === 'payments' ? 'Payments and escrow events will appear here.' :
              activeTab === 'disputes' ? 'No disputes. Nice work staying out of here.' :
              activeTab === 'reviews'  ? 'Reviews you receive will appear here.' :
              activeTab === 'system'   ? 'System notifications will appear here.' :
              hasAnyUnread ? 'No more activity in this tab.' : "You're all caught up."
            } />
          ) : (
            groupedItems.map((group, gi) => (
              <div key={group.label}>
                <p className="act-date-label" style={{ paddingTop: gi === 0 ? 0 : 16 }}>
                  {group.label}
                </p>
                <div className="act-feed-list">
                  {group.items.map((item, i) => (
                    <div key={`${item.kind}-${item.data.id}-${i}`}>
                      {item.kind === 'message'      && <MessageCard c={item.data} />}
                      {item.kind === 'notification' && <NotifCard   n={item.data} />}
                      {item.kind === 'order'        && <OrderCard   o={item.data} />}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  )
}
