// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils'

interface DM {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

interface PageProps {
  params: Promise<{ friendId: string }>
}

export default function ConversationPage({ params }: PageProps) {
  const router = useRouter()
  const [userId, setUserId]   = useState('')
  const [friendId, setFriendId] = useState('')
  const [friend, setFriend]   = useState<{ id: string; username: string; full_name: string | null; avatar_url: string | null } | null>(null)
  const [messages, setMessages] = useState<DM[]>([])
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase  = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    async function init() {
      const { friendId: fid } = await params
      setFriendId(fid)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Load friend profile
      const { data: fp } = await supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', fid).single()
      setFriend(fp)

      // Load messages
      const { data: dms } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${fid}),and(sender_id.eq.${fid},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(200)

      setMessages(dms ?? [])
      setLoading(false)

      // Mark incoming as read
      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('sender_id', fid)
        .eq('receiver_id', user.id)
        .eq('read', false)

      // Subscribe to realtime
      const channel = (supabase as any)
        .channel(`dm:${[user.id, fid].sort().join(':')}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'direct_messages',
          filter: `sender_id=eq.${fid}`,
        }, async (payload: any) => {
          if (payload.new.receiver_id !== user.id) return
          setMessages(prev => [...prev, payload.new as DM])
          await supabase.from('direct_messages').update({ read: true }).eq('id', payload.new.id)
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || !userId || !friendId || sending) return
    setSending(true)
    setInput('')
    const { data: dm } = await supabase
      .from('direct_messages')
      .insert({ sender_id: userId, receiver_id: friendId, content })
      .select()
      .single()
    if (dm) setMessages(prev => [...prev, dm as DM])
    setSending(false)
  }

  const friendInitials = friend?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <Link href="/messages" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar className="h-9 w-9">
          {friend?.avatar_url && <AvatarImage src={friend.avatar_url} />}
          <AvatarFallback>{friendInitials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-zinc-900 dark:text-white text-sm">{friend?.full_name ?? friend?.username}</p>
          <p className="text-xs text-zinc-400">@{friend?.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-12">Начни переписку! 👋</p>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {!isOwn && (
                <Avatar className="h-7 w-7 shrink-0">
                  {friend?.avatar_url && <AvatarImage src={friend.avatar_url} />}
                  <AvatarFallback className="text-[10px]">{friendInitials}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2.5 rounded-2xl text-sm break-words ${
                  isOwn
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-zinc-400">{timeAgo(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Написать ${friend?.full_name ?? friend?.username ?? ''}...`}
          maxLength={2000}
          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
        />
        <Button type="submit" disabled={!input.trim() || sending} className="shrink-0 gap-1.5">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
