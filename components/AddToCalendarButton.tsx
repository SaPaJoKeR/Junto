'use client'

import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DateOption } from '@/types'

interface AddToCalendarProps {
  title: string
  description?: string | null
  location?: string | null
  dateOption: DateOption
  timezone?: string | null
}

function toGCalDate(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

export function AddToCalendarButton({ title, description, location, dateOption, timezone }: AddToCalendarProps) {
  function handleClick() {
    const start = toGCalDate(dateOption.date, dateOption.time_start)
    const rawEnd = dateOption.time_end ||
      `${String(Number(dateOption.time_start.split(':')[0]) + 1).padStart(2, '0')}:${dateOption.time_start.split(':')[1]}`
    const end = toGCalDate(dateOption.date, rawEnd)

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${start}/${end}`,
    })
    if (description) params.set('details', description)
    if (location) params.set('location', location)
    if (timezone) params.set('ctz', timezone)

    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener')
  }

  return (
    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleClick}>
      <CalendarPlus className="h-4 w-4" />
      В календарь
    </Button>
  )
}
