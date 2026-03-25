import { auth } from '@/auth'
import db from '@/lib/db'
import BottomTabBar from './BottomTabBar'

export default async function BottomTabBarServer() {
  const session = await auth()
  const userId = (session?.user as any)?.userId as string | undefined
  const twitterHandle = (session?.user as any)?.twitterHandle as string | undefined

  if (!userId) return null

  let unreadActivities = 0
  try {
    const [notifUnread, msgUnread] = await Promise.all([
      db.notification.count({ where: { userId, read: false } }).catch(() => 0),
      db.message.count({
        where: {
          read: false,
          senderId: { not: userId },
          conversation: { participants: { has: userId } },
        },
      }).catch(() => 0),
    ])
    unreadActivities = notifUnread + msgUnread
  } catch {}

  return (
    <BottomTabBar
      twitterHandle={twitterHandle ?? null}
      unreadActivities={unreadActivities}
    />
  )
}
