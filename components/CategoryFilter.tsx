'use client'

import { useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CATEGORY_META } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

const ALL_CATEGORIES: { value: Category | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'Все', emoji: '🌟' },
  ...Object.entries(CATEGORY_META).map(([value, meta]) => ({
    value: value as Category,
    label: meta.label,
    emoji: meta.emoji,
  })),
]

export function CategoryFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = (searchParams.get('category') as Category | null) ?? 'all'
  const scrollRef = useRef<HTMLDivElement>(null)

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'all') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleWheel(e: React.WheelEvent) {
    if (!scrollRef.current) return
    e.preventDefault()
    scrollRef.current.scrollLeft += e.deltaY + e.deltaX
  }

  return (
    <div ref={scrollRef} onWheel={handleWheel} className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
      {ALL_CATEGORIES.map(cat => {
        const isActive = cat.value === active
        return (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
              isActive
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-300 hover:text-violet-700 dark:hover:text-violet-300'
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
