'use client'

import Link from 'next/link'
import { MapPin, Calendar, Users, DollarSign, Globe, ThumbsUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { CATEGORY_META, formatDate, getVoteProgress, timeAgo } from '@/lib/utils'
import type { Activity } from '@/types'

interface ActivityCardProps {
  activity: Activity
  compact?: boolean
}

const STATUS_BADGE = {
  proposal: { label: 'Идёт голосование', variant: 'proposal' as const },
  confirmed: { label: 'Подтверждено ✓', variant: 'confirmed' as const },
  cancelled: { label: 'Отменено', variant: 'destructive' as const },
  completed: { label: 'Завершено', variant: 'secondary' as const },
}

export function ActivityCard({ activity, compact }: ActivityCardProps) {
  const meta = CATEGORY_META[activity.category]
  const votes = activity.vote_counts ?? { yes: 0, no: 0, maybe: 0, total: 0 }
  const progress = getVoteProgress(votes.yes, activity.min_votes_to_confirm)
  const firstDate = activity.date_options?.[0]
  const status = STATUS_BADGE[activity.status]

  const creatorInitials = activity.creator?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <Link href={`/activities/${activity.id}`} className="block group">
      <article className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-xl hover:shadow-zinc-200/60 dark:hover:shadow-zinc-900/60 hover:-translate-y-1 transition-all duration-300">
        {/* Category gradient header */}
        <div className={`h-2 bg-gradient-to-r ${meta.gradient}`} />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {activity.cost > 0 && (
              <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full">
                <DollarSign className="h-3 w-3" />
                {activity.cost} ₽
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-2 line-clamp-2">
            {activity.title}
          </h3>

          {/* Description */}
          {!compact && activity.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
              {activity.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            {firstDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-violet-400" />
                {formatDate(firstDate.date)}, {firstDate.time_start}
              </span>
            )}
            <span className="flex items-center gap-1">
              {activity.is_online ? (
                <>
                  <Globe className="h-3.5 w-3.5 text-sky-400" />
                  Онлайн
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  <span className="truncate max-w-[120px]">{activity.location || 'Место уточняется'}</span>
                </>
              )}
            </span>
            {activity.max_participants && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                до {activity.max_participants} чел.
              </span>
            )}
          </div>

          {/* Vote progress */}
          {activity.status === 'proposal' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Голоса «Да»
                </span>
                <span className="text-xs text-zinc-500">
                  {votes.yes} / {activity.min_votes_to_confirm}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="text-emerald-500">👍</span> {votes.yes}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-red-400">👎</span> {votes.no}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-amber-400">🤔</span> {votes.maybe}
                </span>
              </div>
            </div>
          )}

          {activity.status === 'confirmed' && (
            <div className="mb-4 flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
              <ThumbsUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Активность подтверждена! {votes.yes} участников идут
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {activity.creator?.avatar_url && (
                  <AvatarImage src={activity.creator.avatar_url} />
                )}
                <AvatarFallback className="text-[10px]">{creatorInitials}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {activity.creator?.full_name ?? activity.creator?.username ?? 'Аноним'}
              </span>
            </div>
            <span className="text-xs text-zinc-400">
              {timeAgo(activity.created_at)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
