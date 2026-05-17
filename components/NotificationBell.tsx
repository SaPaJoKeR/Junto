'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, MessageCircle, UserPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NotifItem {
  id: string
  type: 'chat' | 'dm' | 'friend'
  title: string
  body: string
  link: string
  read: boolean
}

function playBeep() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [toast, setToast] = useState<NotifItem | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelsRef = useRef<any[]>([])
  const supabase = createClient()

  const unread = notifs.filter(n => !n.read).length

  function push(item: NotifItem) {
    playBeep()
    setNotifs(prev => [item, ...prev].slice(0, 30))
    setToast(item)
    setTimeout(() => setToast(t => t?.id === item.id ? null : t), 5000)
  }

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  useEffect(() => {
    if (!userId) return
    const supabaseInstance = supabase

    async function setup() {
      // ── Chat in user's activities ──────────────────────────
      const [{ data: created }, { data: voted }] = await Promise.all([
        supabaseInstance.from('activities').select('id, title').eq('creator_id', userId),
        supabaseInstance.from('votes').select('activity_id, activities(id, title)').eq('user_id', userId).eq('vote', 'yes'),
      ])
      const activityMap = new Map<string, string>()
      created?.forEach(a => activityMap.set(a.id, a.title))
      voted?.forEach(v => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a: any = Array.isArray(v.activities) ? v.activities[0] : v.activities
        if (a?.id) activityMap.set(a.id, a.title)
      })

      activityMap.forEach((title, activityId) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ch = (supabaseInstance as any)
          .channel(`nb:chat:${activityId}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `activity_id=eq.${activityId}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (payload: any) => {
              if (payload.new.user_id === userId) return
              const { data: p } = await supabaseInstance.from('profiles').select('full_name, username').eq('id', payload.new.user_id).single()
              const sender = p?.full_name || p?.username || 'Кто-то'
              push({ id: payload.new.id, type: 'chat', title, body: `${sender}: ${payload.new.content}`, link: `/activities/${activityId}`, read: false })
            })
          .subscribe()
        channelsRef.current.push(ch)
      })

      // ── Direct messages ────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dmCh = (supabaseInstance as any)
        .channel(`nb:dm:${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `receiver_id=eq.${userId}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (payload: any) => {
            const { data: p } = await supabaseInstance.from('profiles').select('full_name, username').eq('id', payload.new.sender_id).single()
            const sender = p?.full_name || p?.username || 'Кто-то'
            push({ id: payload.new.id, type: 'dm', title: 'Личное сообщение', body: `${sender}: ${payload.new.content}`, link: `/messages/${payload.new.sender_id}`, read: false })
          })
        .subscribe()
      channelsRef.current.push(dmCh)

      // ── Friend requests ────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const frCh = (supabaseInstance as any)
        .channel(`nb:friend:${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (payload: any) => {
            const { data: p } = await supabaseInstance.from('profiles').select('full_name, username').eq('id', payload.new.requester_id).single()
            const name = p?.full_name || p?.username || 'Кто-то'
            push({ id: payload.new.id, type: 'friend', title: 'Заявка в друзья', body: `${name} хочет добавить тебя в друзья`, link: '/friends', read: false })
          })
        .subscribe()
      channelsRef.current.push(frCh)
    }

    setup()
    return () => {
      channelsRef.current.forEach(ch => supabaseInstance.removeChannel(ch))
      channelsRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const ICON = { chat: MessageCircle, dm: MessageCircle, friend: UserPlus }
  const COLOR = {
    chat:   'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    dm:     'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    friend: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <>
      {/* Bell button */}
      <div className="relative">
        <button
          onClick={() => { setOpen(o => !o); if (!open) markAllRead() }}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Bell className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-violet-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <p className="font-bold text-sm text-zinc-900 dark:text-white">Уведомления</p>
                {notifs.length > 0 && (
                  <button onClick={() => setNotifs([])} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                    Очистить
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {notifs.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-10">Пока нет уведомлений</p>
                ) : notifs.map(n => {
                  const Icon = ICON[n.type]
                  return (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${COLOR[n.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">{n.title}</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{n.body}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-2" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <Link href={toast.link} className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${COLOR[toast.type]}`}>
                {(() => { const Icon = ICON[toast.type]; return <Icon className="h-4 w-4" /> })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-zinc-400 mb-0.5">{toast.title}</p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2">{toast.body}</p>
              </div>
              <button onClick={e => { e.preventDefault(); setToast(null) }} className="text-zinc-400 hover:text-zinc-600 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </Link>
          <div className="h-1 bg-zinc-100 dark:bg-zinc-700">
            <div className="h-full bg-violet-500 animate-shrink" />
          </div>
        </div>
      )}
    </>
  )
}
