import { Suspense } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ActivityCard } from '@/components/ActivityCard'
import { CategoryFilter } from '@/components/CategoryFilter'
import { Button } from '@/components/ui/button'
import type { Activity, Category } from '@/types'

interface PageProps {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>
}

async function ActivitiesGrid({ category, sort, q, userId }: {
  category?: string; sort?: string; q?: string; userId: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('activities')
    .select(`
      *,
      creator:profiles!activities_creator_id_fkey(id, username, full_name, avatar_url),
      vote_counts:votes(vote)
    `)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(24)

  if (category && category !== 'all') {
    query = query.eq('category', category as Category)
  }

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const { data: rawActivities, error } = await query

  if (error) {
    return (
      <div className="col-span-full text-center py-16 text-zinc-400">
        Не удалось загрузить активности. Попробуйте позже.
      </div>
    )
  }

  // Get user votes
  const activityIds = rawActivities?.map(a => a.id) ?? []
  const { data: userVotes } = activityIds.length
    ? await supabase
        .from('votes')
        .select('activity_id, vote')
        .eq('user_id', userId)
        .in('activity_id', activityIds)
    : { data: [] }

  const voteMap = Object.fromEntries(userVotes?.map(v => [v.activity_id, v.vote]) ?? [])

  // Aggregate vote counts
  const activities: Activity[] = (rawActivities ?? []).map(activity => {
    const votes = Array.isArray(activity.vote_counts) ? activity.vote_counts : []
    const yes = votes.filter((v: { vote: string }) => v.vote === 'yes').length
    const no = votes.filter((v: { vote: string }) => v.vote === 'no').length
    const maybe = votes.filter((v: { vote: string }) => v.vote === 'maybe').length
    return {
      ...activity,
      vote_counts: { yes, no, maybe, total: votes.length },
      user_vote: voteMap[activity.id] ?? null,
    }
  })

  // Sort
  const sorted = [...activities]
  if (sort === 'popular') {
    sorted.sort((a, b) => (b.vote_counts?.yes ?? 0) - (a.vote_counts?.yes ?? 0))
  } else if (sort === 'upcoming') {
    sorted.sort((a, b) => {
      const da = a.date_options?.[0]?.date ?? ''
      const db = b.date_options?.[0]?.date ?? ''
      return da.localeCompare(db)
    })
  }

  if (sorted.length === 0) {
    return (
      <div className="col-span-full text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">
          Активностей не найдено
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Попробуй другой фильтр или создай свою активность
        </p>
        <Button asChild>
          <Link href="/create">Создать активность</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      {sorted.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </>
  )
}

export default async function FeedPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">
            Лента активностей 🌟
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Найди компанию для чего угодно
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/create">
            <PlusCircle className="h-5 w-5" />
            Создать активность
          </Link>
        </Button>
      </div>

      {/* Search + sort bar */}
      <div className="flex flex-col gap-3">
        <form className="relative" action="/feed" method="get">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Поиск активностей..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 placeholder:text-zinc-400"
          />
          {params.category && (
            <input type="hidden" name="category" value={params.category} />
          )}
        </form>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <SlidersHorizontal className="h-4 w-4 text-zinc-400 shrink-0" />
          {[
            { value: 'newest', label: 'Новые' },
            { value: 'popular', label: 'Популярные' },
            { value: 'upcoming', label: 'Скоро' },
          ].map(opt => {
            const cleanParams = Object.fromEntries(
              Object.entries({ ...params, sort: opt.value }).filter(([, v]) => v !== undefined && v !== '')
            )
            return (
              <Link
                key={opt.value}
                href={`/feed?${new URLSearchParams(cleanParams as Record<string, string>).toString()}`}
                className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  (params.sort ?? 'newest') === opt.value
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {opt.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Category filter */}
      <Suspense>
        <CategoryFilter />
      </Suspense>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Suspense
          fallback={[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        >
          <ActivitiesGrid
            category={params.category}
            sort={params.sort}
            q={params.q}
            userId={user?.id ?? ''}
          />
        </Suspense>
      </div>
    </div>
  )
}
