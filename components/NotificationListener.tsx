'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ToastNotif {
  id: string
  activityId: string
  activityTitle: string
  sender: string
  content: string
}

function playBeep() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880,  ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

export function NotificationListener({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<ToastNotif[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelsRef = useRef<any[]>([])
  const supabase = createClient()

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    async function setup() {
      // Gather activity IDs where user is creator, voted yes, or has a booking
      const [{ data: created }, { data: voted }, { data: booked }] = await Promise.all([
        supabase.from('activities').select('id, title').eq('creator_id', userId),
        supabase.from('votes').select('activity_id, activities(id, title)').eq('user_id', userId).eq('vote', 'yes'),
        supabase.from('bookings').select('activity_id, activities(id, title)').eq('user_id', userId).eq('status', 'confirmed'),
      ])

      const map = new Map<string, string>()
      created?.forEach(a => map.set(a.id, a.title))
      voted?.forEach(v => {
        const a = Array.isArray(v.activities) ? v.activities[0] : v.activities as { id: string; title: string } | null
        if (a) map.set(a.id, a.title)
      })
      booked?.forEach(b => {
        const a = Array.isArray(b.activities) ? b.activities[0] : b.activities as { id: string; title: string } | null
        if (a) map.set(a.id, a.title)
      })

      map.forEach((title, activityId) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ch = (supabase as any)
          .channel(`notif:${activityId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `activity_id=eq.${activityId}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (payload: any) => {
              if (payload.new.user_id === userId) return
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, username')
                .eq('id', payload.new.user_id)
                .single()

              const sender = profile?.full_name || profile?.username || 'Кто-то'
              const notif: ToastNotif = {
                id: payload.new.id,
                activityId,
                activityTitle: title,
                sender,
                content: payload.new.content,
              }

              playBeep()
              setToasts(prev => [...prev.slice(-3), notif])
              setTimeout(() => dismiss(notif.id), 6000)
            }
          )
          .subscribe()

        channelsRef.current.push(ch)
      })
    }

    if (userId) setup()
    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        >
          <Link href={`/activities/${t.activityId}`} className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 truncate">{t.activityTitle}</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t.sender}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{t.content}</p>
              </div>
              <button
                onClick={e => { e.preventDefault(); dismiss(t.id) }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0 mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Link>
          <div className="h-1 bg-zinc-100 dark:bg-zinc-700">
            <div className="h-full bg-violet-500 animate-shrink" />
          </div>
        </div>
      ))}
    </div>
  )
}
