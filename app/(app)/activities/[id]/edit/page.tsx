// @ts-nocheck
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditActivityPage({ params }: PageProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activityId, setActivityId] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notAllowed, setNotAllowed] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    max_participants: '',
    cost: '',
    min_votes_to_confirm: 3,
  })

  useEffect(() => {
    async function load() {
      const { id } = await params
      setActivityId(id)
      const supabase = createClient()
      const [{ data: { user } }, { data }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('activities').select('*').eq('id', id).single(),
      ])

      if (!data || data.creator_id !== user?.id) {
        setNotAllowed(true)
        setLoading(false)
        return
      }

      setIsOnline(data.is_online)
      setForm({
        title: data.title ?? '',
        description: data.description ?? '',
        location: data.location ?? '',
        max_participants: data.max_participants?.toString() ?? '',
        cost: data.cost?.toString() ?? '0',
        min_votes_to_confirm: data.min_votes_to_confirm ?? 3,
      })
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Введите название'); return }
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('activities')
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          location: isOnline ? null : form.location.trim() || null,
          max_participants: form.max_participants ? Number(form.max_participants) : null,
          cost: Number(form.cost) || 0,
          min_votes_to_confirm: form.min_votes_to_confirm,
        })
        .eq('id', activityId)

      if (err) { setError('Ошибка сохранения: ' + err.message); return }
      router.push(`/activities/${activityId}`)
      router.refresh()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notAllowed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">У тебя нет прав редактировать эту активность.</p>
        <Button variant="outline" onClick={() => router.back()}>Назад</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/activities/${activityId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Назад к активности
        </Link>
      </div>

      <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-6">
        Редактировать активность
      </h1>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Название *
          </label>
          <Input
            value={form.title}
            onChange={e => update('title', e.target.value)}
            maxLength={100}
            placeholder="Название активности"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-zinc-400">{form.title.length}/100</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Описание
          </label>
          <Textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Описание активности..."
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-zinc-400">{form.description.length}/1000</span>
          </div>
        </div>

        {!isOnline && (
          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Место
            </label>
            <Input
              value={form.location}
              onChange={e => update('location', e.target.value)}
              icon={<MapPin className="h-4 w-4" />}
              placeholder="Адрес или название места"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Голосов для подтверждения
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={form.min_votes_to_confirm}
              onChange={e => update('min_votes_to_confirm', Number(e.target.value))}
            />
            <p className="text-xs text-zinc-400 mt-1">Нужно голосов «Да»</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Макс. участников
            </label>
            <Input
              type="number"
              min={2}
              placeholder="Без ограничений"
              value={form.max_participants}
              onChange={e => update('max_participants', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Стоимость участия (₽)
          </label>
          <Input
            type="number"
            min={0}
            placeholder="0 — бесплатно"
            value={form.cost}
            onChange={e => update('cost', e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <Button size="lg" className="w-full gap-2" loading={isPending} onClick={handleSave}>
          <Save className="h-4 w-4" />
          Сохранить изменения
        </Button>
      </div>
    </div>
  )
}
