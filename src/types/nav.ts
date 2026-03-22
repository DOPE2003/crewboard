export interface NavNotif {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface NavOrder {
  id: string
  status: string
  amount: number
  createdAt: string
  gigTitle: string
  gigCategory: string
  role: 'buyer' | 'seller'
  other: {
    id: string
    name: string | null
    twitterHandle: string
    image: string | null
  } | null
}

export interface NavConv {
  id: string
  lastMessage: string | null
  lastMessageTime: string | null
  unread: number
  otherUser: {
    id: string
    name: string | null
    twitterHandle: string
    image: string | null
    lastSeenAt: string | null
  } | null
}
