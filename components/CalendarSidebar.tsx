// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Settings, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Schedule { pattern_work: number; pattern_off: number; start_date: string }
interface FriendEntry {
  user_id: string; username: string; full_name: string | null; avatar_url: string | null
  pattern_work: number; pattern_off: number; start_date: string
}

const PRESETS = [
  { label: '2/2', work: 2, off: 2 },
  { label: '2/3', work: 2, off: 3 },
  { label: '3/3', work: 3, off: 3 },
  { label: '5/2', work: 5, off: 2 },
  { label: '1/3', work: 1, off: 3 },
]

const FRIEND_COLORS = ['#60a5fa','#34d399','#fbbf24','#f87171','#22d3ee','#a78bfa']

const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

function isWork(date: Date, s: Schedule): boolean {
  const start = new Date(s.start_date)
  start.setHours(0,0,0,0)
  const target = new Date(date); target.setHours(0,0,0,0)
  const diff = Math.round((target.getTime() - start.getTime()) / 86400000)
  const cycle = s.pattern_work + s.pattern_off
  return ((diff % cycle) + cycle) % cycle < s.pattern_work
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function CalendarSidebar({ userId }: { userId: string }) {
  const supabase = createClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear]  = useState(now.getFullYear())
  const [schedule, setSchedule]   = useState<(Schedule & { id: string; is_public: boolean }) | null>(null)
  const [friends, setFriends]     = useState<FriendEntry[]>([])
  const [visible, setVisible]     = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  const [fWork, setFWork] = useState(2)
  const [fOff,  setFOff]  = useState(2)
  const [fStart, setFStart] = useState(todayStr())
  const [fPublic, setFPublic] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: ws } = await supabase.from('work_schedules').select('*').eq('user_id', userId).single()
    if (ws) {
      setSchedule(ws)
      setFWork(ws.pattern_work); setFOff(ws.pattern_off)
      setFStart(ws.start_date); setFPublic(ws.is_public)
    }

    const { data: fs } = await supabase
      .from('friendships').select('requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).eq('status','accepted')
    if (!fs?.length) return

    const ids = fs.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id)
    const { data: fws } = await supabase.from('work_schedules').select('*').in('user_id', ids).eq('is_public', true)
    if (!fws?.length) return

    const { data: profiles } = await supabase.from('profiles').select('id,username,full_name,avatar_url').in('id', fws.map(f => f.user_id))
    const entries: FriendEntry[] = fws.map(f => {
      const p = profiles?.find(pr => pr.id === f.user_id)
      return { user_id: f.user_id, username: p?.username ?? '', full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null, pattern_work: f.pattern_work, pattern_off: f.pattern_off, start_date: f.start_date }
    })
    setFriends(entries)
    setVisible(new Set(entries.map(e => e.user_id)))
  }

  async function save() {
    setSaving(true)
    const payload = { user_id: userId, pattern_work: fWork, pattern_off: fOff, start_date: fStart, is_public: fPublic }
    if (schedule) await supabase.from('work_schedules').update(payload).eq('user_id', userId)
    else await supabase.from('work_schedules').insert(payload)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
    await loadData()
    setSaving(false)
  }

  function toggleFriend(id: string) {
    setVisible(v => { const n = new Set(v); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Build grid
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Math.ceil((firstDow + daysInMonth) / 7) * 7
  const todayISO = todayStr()

  function cellISO(i: number): string | null {
    const d = i - firstDow + 1
    if (d < 1 || d > daysInMonth) return null
    return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <button onClick={() => { if (month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">{MONTHS[month]} {year}</span>
          <button onClick={() => { if (month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 pb-1">{d}</div>)}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1 px-2 pb-3">
          {Array.from({length: cells}).map((_,i) => {
            const iso = cellISO(i)
            if (!iso) return <div key={i} />
            const day = Number(iso.split('-')[2])
            const cellDate = new Date(year, month, day)
            const isToday = iso === todayISO
            const myWork = schedule ? isWork(cellDate, schedule) : null
            const activeFriends = friends.filter(f => visible.has(f.user_id) && isWork(cellDate, f))

            return (
              <div key={i} className="flex flex-col items-center py-0.5">
                <div className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium
                  ${isToday ? 'ring-2 ring-violet-500 font-bold' : ''}
                  ${myWork === true  ? 'bg-violet-500 text-white' : ''}
                  ${myWork === false ? 'text-zinc-300 dark:text-zinc-600' : ''}
                  ${myWork === null  ? 'text-zinc-500 dark:text-zinc-400' : ''}
                `}>
                  {day}
                </div>
                {activeFriends.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {activeFriends.slice(0,4).map(f => (
                      <div key={f.user_id} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: FRIEND_COLORS[friends.indexOf(f) % FRIEND_COLORS.length] }}
                        title={f.full_name ?? f.username} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        {schedule && (
          <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
            Мои рабочие ({schedule.pattern_work}/{schedule.pattern_off})
          </div>
        )}

        {/* Settings button */}
        <button onClick={() => setShowSettings(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors border-t border-zinc-100 dark:border-zinc-800">
          <Settings className="h-3.5 w-3.5" />
          {schedule ? 'Настроить график' : 'Задать рабочие дни'}
        </button>
      </div>

      {/* Friend toggles */}
      {friends.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-4 shadow-sm">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Друзья на календаре</p>
          <div className="space-y-2">
            {friends.map((f, i) => {
              const color = FRIEND_COLORS[i % FRIEND_COLORS.length]
              const on = visible.has(f.user_id)
              const initials = f.full_name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) ?? '?'
              return (
                <button key={f.user_id} onClick={() => toggleFriend(f.user_id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${on ? 'bg-zinc-50 dark:bg-zinc-800' : 'opacity-40'}`}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <Avatar className="h-7 w-7 shrink-0">
                    {f.avatar_url && <AvatarImage src={f.avatar_url} />}
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1 text-left">
                    {f.full_name ?? f.username}
                  </span>
                  <span className="text-[10px] text-zinc-400 shrink-0">{f.pattern_work}/{f.pattern_off}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-zinc-900 dark:text-white">График работы</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Presets */}
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Быстрый выбор</p>
            <div className="flex gap-2 flex-wrap mb-5">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => { setFWork(p.work); setFOff(p.off) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-colors ${fWork===p.work && fOff===p.off ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-400'}`}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-4 mb-5">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Рабочих дней</label>
                  <span className="text-sm font-black text-violet-600">{fWork}</span>
                </div>
                <input type="range" min={1} max={14} value={fWork} onChange={e => setFWork(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer" />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5"><span>1</span><span>14</span></div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Выходных дней</label>
                  <span className="text-sm font-black text-zinc-500">{fOff}</span>
                </div>
                <input type="range" min={1} max={14} value={fOff} onChange={e => setFOff(Number(e.target.value))}
                  className="w-full accent-zinc-500 cursor-pointer" />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5"><span>1</span><span>14</span></div>
              </div>
            </div>

            <div className="mb-4 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-xs text-violet-700 dark:text-violet-300 font-semibold">
              Цикл: {fWork} раб. + {fOff} вых. = каждые {fWork+fOff} дней
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Первый рабочий день</label>
              <input type="date" value={fStart} onChange={e => setFStart(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
            </div>

            <label className="flex items-center gap-3 mb-5 cursor-pointer">
              <div onClick={() => setFPublic(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${fPublic ? 'bg-violet-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${fPublic ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Показать друзьям</p>
                <p className="text-xs text-zinc-400">Друзья увидят ваши рабочие дни</p>
              </div>
            </label>

            <Button onClick={save} disabled={saving} className="w-full gap-2">
              {saved ? <><Check className="h-4 w-4" /> Сохранено!</> : 'Сохранить'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
