'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils'

interface ChatMessage {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface ActivityChatProps {
  activityId: string
  userId: string | null
  initialMessages: ChatMessage[]
}

export function ActivityChat({ activityId, userId, initialMessages }: ActivityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setSending_input] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel(`chat:${activityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `activity_id=eq.${activityId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(username, full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages(prev => [...prev, data as ChatMessage])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || !userId || sending) return
    setSending(true)
    setSending_input('')
    await supabase.from('messages').insert({ activity_id: activityId, user_id: userId, content })
    setSending(false)
  }

  return (
    <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
      <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Чат ({messages.length})
      </h2>

      <div className="space-y-3 max-h-72 overflow-y-auto mb-4 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6">
            Пока нет сообщений. Будь первым! 👋
          </p>
        ) : (
          messages.map(msg => {
            const p = msg.profiles
            const initials = p?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'
            const isOwn = msg.user_id === userId
            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-7 w-7 shrink-0">
                  {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
                  }`}>
                    {!isOwn && (
                      <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5">
                        {p?.full_name ?? p?.username ?? 'Аноним'}
                      </p>
                    )}
                    <span className="break-words">{msg.content}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{timeAgo(msg.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {userId ? (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setSending_input(e.target.value)}
            placeholder="Написать в чат..."
            maxLength={1000}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
          />
          <Button type="submit" size="sm" disabled={!input.trim() || sending} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-2">
          <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">Войдите</Link>
          {' '}чтобы написать в чат
        </p>
      )}
    </div>
  )
}
