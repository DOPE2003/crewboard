import { auth } from '@/auth'
import db from '@/lib/db'
import BottomTabBar from './BottomTabBar'

export default async function BottomTabBarServer() {
  const session = await auth()
  const userId = (session?.user as any)?.userId as string | undefined
  const twitterHandle = (session?.user as any)?.twitterHandle as string | undefined

  if (!userId) return null

  let unreadActivities = 0
  let image: string | null = null
  let name: string | null = null
  let userTitle: string | null = null
  let availability: string | null = null

  try {
    const [notifUnread, msgUnread, dbUser] = await Promise.all([
      db.notification.count({ where: { userId, read: false } }).catch(() => 0),
      db.message.count({
        where: {
          read: false,
          senderId: { not: userId },
          conversation: { participants: { has: userId } },
        },
      }).catch(() => 0),
      db.user.findUnique({
        where: { id: userId },
        select: { image: true, name: true, userTitle: true, availability: true },
      }).catch(() => null),
    ])
    unreadActivities = notifUnread + msgUnread
    image = dbUser?.image ?? null
    name = dbUser?.name ?? null
    userTitle = dbUser?.userTitle ?? null
    availability = dbUser?.availability ?? null
  } catch {}

  return (
    <BottomTabBar
      twitterHandle={twitterHandle ?? null}
      unreadActivities={unreadActivities}
      image={image}
      name={name}
      userTitle={userTitle}
      availability={availability}
    />
  )
}
