'use client'

import { useEffect, useState } from 'react'

interface LocalTimeProps {
  date: string       // "2025-01-15"
  timeStart: string  // "17:00"
  timeEnd?: string   // "19:00"
  sourceTimezone?: string | null
}

function getOffsetMs(tz: string, date: Date): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr  = date.toLocaleString('en-US', { timeZone: tz })
  return new Date(tzStr).getTime() - new Date(utcStr).getTime()
}

function convertTime(date: string, time: string, fromTz: string, toTz: string): string {
  const utcGuess   = new Date(`${date}T${time}:00Z`)
  const fromOffset = getOffsetMs(fromTz, utcGuess)
  const actualUtc  = new Date(utcGuess.getTime() - fromOffset)
  return new Intl.DateTimeFormat('ru', {
    timeZone: toTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(actualUtc)
}

export function LocalTime({ date, timeStart, timeEnd, sourceTimezone }: LocalTimeProps) {
  const [localStart, setLocalStart] = useState<string | null>(null)
  const [localEnd,   setLocalEnd]   = useState<string | null>(null)

  useEffect(() => {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!sourceTimezone || sourceTimezone === userTz) return
    try {
      setLocalStart(convertTime(date, timeStart, sourceTimezone, userTz))
      if (timeEnd) setLocalEnd(convertTime(date, timeEnd, sourceTimezone, userTz))
    } catch {}
  }, [date, timeStart, timeEnd, sourceTimezone])

  const original = `${timeStart}${timeEnd ? `–${timeEnd}` : ''}`

  if (!localStart) return <span>{original}</span>

  const converted = `${localStart}${localEnd ? `–${localEnd}` : ''}`
  if (converted === original) return <span>{original}</span>

  return (
    <span title={`Время организатора: ${original}`}>
      {converted}
      <span className="ml-1 text-zinc-400 text-[10px] font-normal">(ваш пояс)</span>
    </span>
  )
}
