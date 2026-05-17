import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Globe, Calendar, Users, DollarSign,
  Share2, BookmarkPlus, User, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VotingPanel } from '@/components/VotingPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CATEGORY_META, formatDate, timeAgo } from '@/lib/utils'
import type { Activity } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function BookingSection({ activity, userId }: { activity: Activity; userId: string }) {
  const supabase = await createClient()
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('activity_id', activity.id)
    .eq('user_id', userId)
    .single()

  const { count: participantCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activity.id)
    .eq('status', 'confirmed')

  if (activity.status !== 'confirmed') return null

  return (
    <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
      <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
        🎉 Активность подтверждена!
      </h3>
      <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-4">
        {participantCount} участников уже подтвердили участие
        {activity.max_participants && ` из ${activity.max_participants}`}.
      </p>
      {!booking ? (
        <form action={`/api/activities/${activity.id}/book`} method="POST">
          <Button className="w-full" variant="amber">
            Подтвердить участие
          </Button>
        </form>
      ) : (
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          ✓ Ты участвуешь!
        </div>
      )}
    </div>
  )
}

export default async function ActivityPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: raw, error } = await supabase
    .from('activities')
    .select(`
      *,
      creator:profiles!activities_creator_id_fkey(id, username, full_name, avatar_url, bio)
    `)
    .eq('id', id)
    .single()

  if (error || !raw) notFound()

  // Get vote aggregates
  const { data: votes } = await supabase
    .from('votes')
    .select('vote, user_id, profiles(username, full_name, avatar_url)')
    .eq('activity_id', id)

  const yes = votes?.filter(v => v.vote === 'yes').length ?? 0
  const no = votes?.filter(v => v.vote === 'no').length ?? 0
  const maybe = votes?.filter(v => v.vote === 'maybe').length ?? 0
  const userVote = votes?.find(v => v.user_id === user?.id)?.vote ?? null

  const activity: Activity = {
    ...raw,
    vote_counts: { yes, no, maybe, total: (votes?.length ?? 0) },
    user_vote: userVote as Activity['user_vote'],
  }

  const meta = CATEGORY_META[activity.category]
  const creatorInitials = activity.creator?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  const STATUS_LABELS = {
    proposal: { text: 'Идёт голосование', variant: 'proposal' as const },
    confirmed: { text: 'Подтверждено ✓', variant: 'confirmed' as const },
    cancelled: { text: 'Отменено', variant: 'destructive' as const },
    completed: { text: 'Завершено', variant: 'secondary' as const },
  }
  const statusInfo = STATUS_LABELS[activity.status]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Назад к ленте
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Main content — 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero card */}
          <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Category gradient strip */}
            <div className={`h-3 bg-gradient-to-r ${meta.gradient}`} />

            <div className="p-6 sm:p-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${meta.bg} ${meta.text}`}>
                  <span className="text-base">{meta.emoji}</span>
                  {meta.label}
                </span>
                <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                {activity.is_online && (
                  <Badge variant="default">
                    <Globe className="h-3 w-3" /> Онлайн
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
                {activity.title}
              </h1>

              {/* Meta grid */}
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {activity.date_options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                    <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">
                        {activity.date_options.length > 1 ? `Вариант ${i + 1}` : 'Дата и время'}
                      </p>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {formatDate(opt.date)} • {opt.time_start}
                        {opt.time_end && `–${opt.time_end}`}
                      </p>
                    </div>
                  </div>
                ))}

                {!activity.is_online && activity.location && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                    <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Место</p>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{activity.location}</p>
                    </div>
                  </div>
                )}

                {activity.max_participants && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                    <Users className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Макс. участников</p>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{activity.max_participants} человек</p>
                    </div>
                  </div>
                )}

                {activity.cost > 0 && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                    <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Стоимость</p>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{activity.cost} ₽</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {activity.description && (
                <div>
                  <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-2">Описание</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {activity.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {activity.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {activity.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Creator */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Организатор
            </h2>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {activity.creator?.avatar_url && <AvatarImage src={activity.creator.avatar_url} />}
                <AvatarFallback>{creatorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">
                  {activity.creator?.full_name ?? 'Аноним'}
                </p>
                <p className="text-sm text-zinc-500">@{activity.creator?.username}</p>
                {activity.creator?.bio && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                    {activity.creator.bio}
                  </p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo(activity.created_at)}
              </div>
            </div>
          </div>

          {/* Voters list */}
          {votes && votes.length > 0 && (
            <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                Голоса ({votes.length})
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {votes.map((vote, i) => {
                  const raw = Array.isArray(vote.profiles) ? vote.profiles[0] : vote.profiles
                  const p = raw as { username: string; full_name: string; avatar_url: string } | null
                  const initials = p?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
                        {p?.full_name ?? p?.username ?? 'Пользователь'}
                      </span>
                      <span className="text-base">
                        {vote.vote === 'yes' ? '👍' : vote.vote === 'no' ? '👎' : '🤔'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          {/* Voting panel */}
          <div className="sticky top-24 space-y-5">
            <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
              <VotingPanel activity={activity} userId={user?.id ?? null} />
            </div>

            {/* Booking panel */}
            <BookingSection activity={activity} userId={user?.id ?? ''} />

            {/* Share */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Поделиться
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <BookmarkPlus className="h-4 w-4" />
                Сохранить
              </Button>
            </div>

            {/* Similar activities nudge */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/60 dark:border-violet-800/40">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                Похожие активности 👀
              </p>
              <Link
                href={`/feed?category=${activity.category}`}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                Смотреть все в «{meta.label}» →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
