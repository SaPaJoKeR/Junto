// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Conversation {
  profile: { id: string; username: string; full_name: string | null; avatar_url: string | null }
  lastMessage: string
  lastAt: string
  unread: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all DMs involving user
      const { data: dms } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, created_at, read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      // Group by conversation partner
      const seen = new Set<string>()
      const convMap = new Map<string, Conversation>()

      for (const dm of dms ?? []) {
        const partnerId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id
        if (seen.has(partnerId)) {
          if (!dm.read && dm.receiver_id === user.id) {
            convMap.get(partnerId)!.unread++
          }
          continue
        }
        seen.add(partnerId)
        convMap.set(partnerId, {
          profile: { id: partnerId, username: '', full_name: null, avatar_url: null },
          lastMessage: dm.content,
          lastAt: dm.created_at,
          unread: (!dm.read && dm.receiver_id === user.id) ? 1 : 0,
        })
      }

      // Fetch partner profiles
      if (convMap.size > 0) {
        const ids = Array.from(convMap.keys())
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', ids)
        profiles?.forEach(p => {
          if (convMap.has(p.id)) convMap.get(p.id)!.profile = p
        })
      }

      setConversations(Array.from(convMap.values()))
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-1">Сообщения</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Личные переписки с друзьями</p>
      </div>

      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)
      ) : conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">Нет сообщений. Напиши другу!</p>
          <Button asChild><Link href="/friends">Перейти к друзьям</Link></Button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => {
            const initials = c.profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
            return (
              <Link key={c.profile.id} href={`/messages/${c.profile.id}`}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-md transition-all group">
                <Avatar className="h-12 w-12 shrink-0">
                  {c.profile.avatar_url && <AvatarImage src={c.profile.avatar_url} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`font-bold text-zinc-900 dark:text-white truncate ${c.unread > 0 ? 'font-black' : ''}`}>
                      {c.profile.full_name ?? c.profile.username}
                    </p>
                    <span className="text-[11px] text-zinc-400 shrink-0 ml-2">{timeAgo(c.lastAt)}</span>
                  </div>
                  <p className={`text-sm truncate ${c.unread > 0 ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {c.lastMessage}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {c.unread}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
