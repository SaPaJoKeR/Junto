// @ts-nocheck
'use client'

import { useEffect, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Settings, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { WorkSchedule } from '@/types'

interface FriendSchedule {
  user_id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  pattern_work: number
  pattern_off: number
  start_date: string
}

const PRESETS = [
  { label: '2/2', work: 2, off: 2 },
  { label: '2/3', work: 2, off: 3 },
  { label: '3/3', work: 3, off: 3 },
  { label: '5/2', work: 5, off: 2 },
  { label: '1/3', work: 1, off: 3 },
]

const FRIEND_COLORS = [
  'bg-blue-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-cyan-400',
  'bg-purple-400',
]

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

function isWorkDay(date: Date, schedule: { pattern_work: number; pattern_off: number; start_date: string }): boolean {
  const [sy, sm, sd] = schedule.start_date.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = target.getTime() - start.getTime()
  const diff = Math.round(diffMs / 86400000)
  const cycle = schedule.pattern_work + schedule.pattern_off
  const pos = ((diff % cycle) + cycle) % cycle
  return pos < schedule.pattern_work
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarSidebar({ userId }: { userId: string }) {
  const supabase = createClient()
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [schedule, setSchedule] = useState<WorkSchedule | null>(null)
  const [friendSchedules, setFriendSchedules] = useState<FriendSchedule[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Settings form state
  const [formWork, setFormWork] = useState(2)
  const [formOff, setFormOff] = useState(2)
  const [formStart, setFormStart] = useState(todayStr())
  const [formPublic, setFormPublic] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    // Load own schedule
    const { data: ws } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (ws) {
      setSchedule(ws as WorkSchedule)
      setFormWork(ws.pattern_work)
      setFormOff(ws.pattern_off)
      setFormStart(ws.start_date)
      setFormPublic(ws.is_public)
    }

    // Load friend schedules (accepted friends who made schedule public)
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (!friendships || friendships.length === 0) return

    const friendIds = friendships.map(f =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    )

    const { data: fws } = await supabase
      .from('work_schedules')
      .select('user_id, pattern_work, pattern_off, start_date')
      .in('user_id', friendIds)
      .eq('is_public', true)

    if (!fws || fws.length === 0) return

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', fws.map(f => f.user_id))

    const merged: FriendSchedule[] = fws.map(f => {
      const p = profiles?.find(pr => pr.id === f.user_id)
      return {
        user_id: f.user_id,
        username: p?.username ?? '',
        full_name: p?.full_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        pattern_work: f.pattern_work,
        pattern_off: f.pattern_off,
        start_date: f.start_date,
      }
    })
    setFriendSchedules(merged)
  }

  function saveSchedule() {
    startTransition(async () => {
      const payload = {
        user_id: userId,
        pattern_work: formWork,
        pattern_off: formOff,
        start_date: formStart,
        is_public: formPublic,
      }
      if (schedule) {
        await supabase.from('work_schedules').update(payload).eq('user_id', userId)
      } else {
        await supabase.from('work_schedules').insert(payload)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      loadData()
    })
  }

  // Build calendar grid (Mon-Sun week start)
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  // getDay(): 0=Sun,1=Mon... we want Mon=0
  const startDow = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7

  const todayISO = todayStr()

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function getDateISO(cellIndex: number): string | null {
    const dayNum = cellIndex - startDow + 1
    if (dayNum < 1 || dayNum > daysInMonth) return null
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
  }

  return (
    <div className="w-full space-y-3">
      {/* Calendar card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            {MONTHS_RU[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_RU.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 pb-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: totalCells }).map((_, i) => {
            const iso = getDateISO(i)
            if (!iso) return <div key={i} />

            const dayNum = iso.split('-')[2]
            const cellDate = new Date(Number(iso.split('-')[0]), Number(iso.split('-')[1]) - 1, Number(dayNum))
            const isToday = iso === todayISO
            const myWork = schedule ? isWorkDay(cellDate, schedule) : null
            const workerFriends = friendSchedules.filter(fs => isWorkDay(cellDate, fs))

            return (
              <div key={i} className="flex flex-col items-center py-0.5 relative">
                <div className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-medium relative
                  ${isToday ? 'ring-2 ring-violet-500' : ''}
                  ${myWork === true ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold' : ''}
                  ${myWork === false ? 'text-zinc-400 dark:text-zinc-600' : ''}
                  ${myWork === null ? 'text-zinc-500 dark:text-zinc-400' : ''}
                `}>
                  {dayNum}
                </div>
                {/* Friend work dots */}
                {workerFriends.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[28px]">
                    {workerFriends.slice(0, 3).map((fs, fi) => (
                      <div
                        key={fs.user_id}
                        title={fs.full_name ?? fs.username}
                        className={`w-1.5 h-1.5 rounded-full ${FRIEND_COLORS[friendSchedules.indexOf(fs) % FRIEND_COLORS.length]}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        {(schedule || friendSchedules.length > 0) && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
            {schedule && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <div className="w-3 h-3 rounded-sm bg-violet-100 dark:bg-violet-900/40 border border-violet-300 dark:border-violet-700 shrink-0" />
                <span>Мои рабочие дни ({schedule.pattern_work}/{schedule.pattern_off})</span>
              </div>
            )}
            {friendSchedules.map((fs, i) => (
              <div key={fs.user_id} className="flex items-center gap-2 text-[11px] text-zinc-500">
                <div className={`w-2 h-2 rounded-full shrink-0 ${FRIEND_COLORS[i % FRIEND_COLORS.length]}`} />
                <span className="truncate">{fs.full_name ?? fs.username} ({fs.pattern_work}/{fs.pattern_off})</span>
              </div>
            ))}
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30"
        >
          <Settings className="h-3.5 w-3.5" />
          {schedule ? 'Настроить график' : 'Задать график работы'}
        </button>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-zinc-900 dark:text-white">График работы</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Пресеты (рабочие/выходные)</p>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setFormWork(p.work); setFormOff(p.off) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      formWork === p.work && formOff === p.off
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-violet-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Рабочих дней</label>
                <input
                  type="number"
                  min={1} max={30}
                  value={formWork}
                  onChange={e => setFormWork(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Выходных дней</label>
                <input
                  type="number"
                  min={1} max={30}
                  value={formOff}
                  onChange={e => setFormOff(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Preview label */}
            <div className="mb-4 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
              <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                Цикл: {formWork} рабочих + {formOff} выходных = {formWork + formOff} дней
              </p>
            </div>

            {/* Start date */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Первый рабочий день цикла</label>
              <input
                type="date"
                value={formStart}
                onChange={e => setFormStart(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
              />
            </div>

            {/* Share toggle */}
            <label className="flex items-center gap-3 mb-5 cursor-pointer group">
              <div
                onClick={() => setFormPublic(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors ${formPublic ? 'bg-violet-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${formPublic ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Поделиться с друзьями</p>
                <p className="text-xs text-zinc-400">Друзья увидят ваши рабочие дни на своём календаре</p>
              </div>
            </label>

            <Button
              onClick={saveSchedule}
              disabled={isPending}
              className="w-full gap-2"
            >
              {saved ? <><Check className="h-4 w-4" /> Сохранено!</> : 'Сохранить график'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
