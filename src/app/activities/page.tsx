import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import db from '@/lib/db'
import ActivitiesClient from './ActivitiesClient'
import type { NavNotif, NavOrder, NavConv } from '@/types/nav'

const ENVELOPE_PREFIXES = ['__OFFER__:', '__GIGREQUEST__:'] as const

function msgPreview(body: string, maxLen = 60): string {
  if (body.startsWith('__OFFER__:')) {
    try {
      const p = JSON.parse(body.slice('__OFFER__:'.length))
      return `📋 Offer: ${p.title} — $${p.amount}`
    } catch { return '📋 Contract Offer' }
  }
  if (body.startsWith('__GIGREQUEST__:')) {
    try { return 'Gig Request: ' + JSON.parse(body.slice('__GIGREQUEST__:'.length)).title }
    catch { return 'Gig Request' }
  }
  if (body.startsWith('__FILE__:')) {
    try {
      const f = JSON.parse(body.slice('__FILE__:'.length))
      if (f.type?.startsWith('image/')) return '📷 Image'
      if (f.type?.startsWith('video/')) return '🎥 Video'
      return '📄 ' + f.name
    } catch { return '📎 File' }
  }
  return body.slice(0, maxLen) + (body.length > maxLen ? '…' : '')
}

export const metadata = { title: 'Activities — Crewboard' }

export default async function ActivitiesPage() {
  const session = await auth()
  const user = session?.user
  const userId = (user as any)?.userId as string | undefined

  if (!userId) redirect('/login')

  let conversations: NavConv[] = []
  let notifications: NavNotif[] = []
  let orders: NavOrder[] = []
  let totalMsgUnread = 0
  let totalNotifUnread = 0
  let activeOrderCount = 0

  try {
    const [convs, notifs, recentOrders] = await Promise.all([
      db.conversation.findMany({
        where: { participants: { has: userId } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, type: true, title: true, body: true, link: true, read: true, createdAt: true },
      }).catch(() => []),
      db.order.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          gig: { select: { id: true, title: true, category: true } },
          buyer: { select: { id: true, name: true, twitterHandle: true, image: true } },
          seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
        },
      }).catch(() => []),
    ])

    // Resolve conversation other-users
    const otherIds = convs
      .map(c => c.participants.find(p => p !== userId) ?? '')
      .filter(Boolean)
    const otherUsers = await db.user.findMany({
      where: { id: { in: otherIds } },
      select: { id: true, name: true, twitterHandle: true, image: true, lastSeenAt: true },
    }).catch(() => [])
    const userMap = Object.fromEntries(otherUsers.map(u => [u.id, u]))

    // Unread per conversation
    const unreadPerConv = await Promise.all(
      convs.map(c =>
        db.message.count({ where: { conversationId: c.id, read: false, senderId: { not: userId } } }).catch(() => 0)
      )
    )
    totalMsgUnread = unreadPerConv.reduce((a, b) => a + b, 0)

    conversations = convs.map((c, i) => {
      const otherId = c.participants.find(p => p !== userId) ?? ''
      const other = userMap[otherId] ?? null
      const lastMsg = c.messages[0]

      // Offer/gig-request envelopes are internal protocol — they surface in the
      // feed via their corresponding notifications. Skip those conversations so
      // the same event doesn't appear twice (once as a raw chat row, once as a
      // structured notification card). __FILE__: attachments are kept because
      // they have no corresponding notification.
      const isEnvelopeOnly = lastMsg &&
        ENVELOPE_PREFIXES.some(p => lastMsg.body.startsWith(p)) &&
        lastMsg.senderId !== userId // receiver sees the notif; sender has /offers

      if (isEnvelopeOnly) return null

      let lastMessageText: string | null = null
      if (lastMsg) {
        const prefix = lastMsg.senderId === userId ? 'You: ' : ''
        lastMessageText = prefix + msgPreview(lastMsg.body, 60)
      }
      return {
        id: c.id,
        lastMessage: lastMessageText,
        lastSenderId: lastMsg?.senderId ?? null,
        lastMessageTime: lastMsg?.createdAt?.toISOString() ?? null,
        unread: unreadPerConv[i],
        otherUser: other
          ? {
              id: other.id,
              name: other.name,
              twitterHandle: other.twitterHandle,
              image: other.image,
              lastSeenAt: (other as any).lastSeenAt?.toISOString?.() ?? null,
            }
          : null,
      }
    }).filter((c): c is NonNullable<typeof c> => c !== null)

    // Strip message-type notifications — message unread state is tracked via
    // conversation.unread counts. Including them here inflates the badge without
    // adding anything to the feed (the client filters them out anyway).
    const nonMsgNotifs = notifs.filter(n => n.type !== 'message')
    notifications = nonMsgNotifs.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }))
    totalNotifUnread = nonMsgNotifs.filter(n => !n.read).length

    orders = recentOrders.map(o => {
      const role: 'buyer' | 'seller' = o.buyerId === userId ? 'buyer' : 'seller'
      const other = role === 'buyer' ? o.seller : o.buyer
      return {
        id: o.id,
        status: o.status,
        amount: o.amount,
        createdAt: o.createdAt.toISOString(),
        gigTitle: o.gig.title,
        gigCategory: o.gig.category ?? '',
        role,
        other: other
          ? { id: other.id, name: other.name, twitterHandle: other.twitterHandle, image: other.image }
          : null,
      }
    })

    activeOrderCount = recentOrders.filter(o =>
      ['pending', 'accepted', 'funded', 'delivered'].includes(o.status)
    ).length
  } catch (e) {
    console.error('[ActivitiesPage] DB error:', e)
  }

  return (
    <ActivitiesClient
      userId={userId}
      conversations={conversations}
      totalMsgUnread={totalMsgUnread}
      notifications={notifications}
      totalNotifUnread={totalNotifUnread}
      orders={orders}
      activeOrderCount={activeOrderCount}
    />
  )
}
