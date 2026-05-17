import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Category } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return format(parseISO(date), 'd MMMM yyyy', { locale: ru })
}

export function formatDateTime(date: string, time: string) {
  const parsed = parseISO(`${date}T${time}`)
  return format(parsed, 'd MMMM, HH:mm', { locale: ru })
}

export function timeAgo(date: string) {
  return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: ru })
}

export const CATEGORY_META: Record<
  Category,
  { label: string; emoji: string; gradient: string; bg: string; text: string }
> = {
  sport: {
    label: 'Спорт',
    emoji: '⚽',
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  food: {
    label: 'Еда',
    emoji: '🍕',
    gradient: 'from-orange-500 to-red-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  culture: {
    label: 'Культура',
    emoji: '🎭',
    gradient: 'from-purple-500 to-pink-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
  nature: {
    label: 'Природа',
    emoji: '🌿',
    gradient: 'from-green-500 to-teal-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  learning: {
    label: 'Обучение',
    emoji: '📚',
    gradient: 'from-indigo-500 to-violet-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  travel: {
    label: 'Путешествия',
    emoji: '✈️',
    gradient: 'from-sky-500 to-blue-400',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
  },
  games: {
    label: 'Игры',
    emoji: '🎮',
    gradient: 'from-yellow-500 to-orange-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  social: {
    label: 'Общение',
    emoji: '🎉',
    gradient: 'from-pink-500 to-rose-400',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
  },
  music: {
    label: 'Музыка',
    emoji: '🎵',
    gradient: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
  },
  other: {
    label: 'Другое',
    emoji: '✨',
    gradient: 'from-slate-500 to-gray-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-700 dark:text-slate-300',
  },
}

export function getVoteProgress(yesVotes: number, minRequired: number): number {
  if (minRequired === 0) return 100
  return Math.min(100, Math.round((yesVotes / minRequired) * 100))
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
