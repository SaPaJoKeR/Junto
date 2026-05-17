'use client'

import { useState, useTransition } from 'react'
import { ThumbsUp, ThumbsDown, HelpCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn, getVoteProgress } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Activity, VoteType } from '@/types'

interface VotingPanelProps {
  activity: Activity
  userId: string | null
}

const VOTE_OPTIONS: {
  type: VoteType
  label: string
  emoji: string
  variant: 'vote_yes' | 'vote_no' | 'vote_maybe'
  activeClass: string
}[] = [
  {
    type: 'yes',
    label: 'Да, иду!',
    emoji: '👍',
    variant: 'vote_yes',
    activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30',
  },
  {
    type: 'no',
    label: 'Не смогу',
    emoji: '👎',
    variant: 'vote_no',
    activeClass: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30',
  },
  {
    type: 'maybe',
    label: 'Может быть',
    emoji: '🤔',
    variant: 'vote_maybe',
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30',
  },
]

export function VotingPanel({ activity, userId }: VotingPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticVote, setOptimisticVote] = useState<VoteType | null>(
    activity.user_vote ?? null
  )
  const [optimisticCounts, setOptimisticCounts] = useState(
    activity.vote_counts ?? { yes: 0, no: 0, maybe: 0, total: 0 }
  )

  const progress = getVoteProgress(optimisticCounts.yes, activity.min_votes_to_confirm)
  const isConfirmed = activity.status === 'confirmed'

  async function handleVote(voteType: VoteType) {
    if (!userId || isConfirmed) return

    // Optimistic update
    const prev = optimisticVote
    const prevCounts = { ...optimisticCounts }

    const newCounts = { ...optimisticCounts }
    if (prev) newCounts[prev] = Math.max(0, newCounts[prev] - 1)

    if (voteType === prev) {
      setOptimisticVote(null)
      newCounts.total = Math.max(0, newCounts.total - 1)
    } else {
      setOptimisticVote(voteType)
      newCounts[voteType] = newCounts[voteType] + 1
      if (!prev) newCounts.total = newCounts.total + 1
    }
    setOptimisticCounts(newCounts)

    startTransition(async () => {
      const supabase = createClient()

      if (voteType === prev) {
        // Remove vote
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('activity_id', activity.id)
          .eq('user_id', userId)

        if (error) {
          setOptimisticVote(prev)
          setOptimisticCounts(prevCounts)
        }
      } else {
        // Upsert vote
        const { error } = await supabase
          .from('votes')
          .upsert(
            { activity_id: activity.id, user_id: userId, vote: voteType },
            { onConflict: 'activity_id,user_id' }
          )

        if (error) {
          setOptimisticVote(prev)
          setOptimisticCounts(prevCounts)
        }
      }

      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Voting buttons */}
      {!isConfirmed && (
        <div className="space-y-3">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
            {userId ? 'Ваш голос:' : 'Войдите, чтобы проголосовать'}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {VOTE_OPTIONS.map(opt => {
              const isActive = optimisticVote === opt.type
              return (
                <button
                  key={opt.type}
                  onClick={() => handleVote(opt.type)}
                  disabled={!userId || isPending}
                  className={cn(
                    'relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 active:scale-95',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isActive
                      ? opt.activeClass
                      : opt.variant === 'vote_yes'
                      ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      : opt.variant === 'vote_no'
                      ? 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  )}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-lg font-black">
                    {opt.type === 'yes'
                      ? optimisticCounts.yes
                      : opt.type === 'no'
                      ? optimisticCounts.no
                      : optimisticCounts.maybe}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {isConfirmed ? '🎉 Активность подтверждена!' : 'Прогресс голосования'}
          </span>
          <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
            {optimisticCounts.yes} / {activity.min_votes_to_confirm}
          </span>
        </div>

        <Progress
          value={progress}
          className="h-3"
          indicatorClassName={
            isConfirmed
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : progress >= 75
              ? 'bg-gradient-to-r from-amber-500 to-orange-400'
              : 'bg-gradient-to-r from-violet-500 to-indigo-500'
          }
        />

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isConfirmed
            ? `Набрано достаточно голосов. Все участники приглашены!`
            : progress >= 100
            ? 'Ура! Достаточно голосов для подтверждения'
            : `Нужно ещё ${Math.max(0, activity.min_votes_to_confirm - optimisticCounts.yes)} голосов «Да» для подтверждения`}
        </p>
      </div>
    </div>
  )
}
