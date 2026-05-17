'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, MapPin, Globe, Plus, Trash2,
  Calendar, Clock, Users, DollarSign, Tag, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORY_META, generateId } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Category, DateOption, CreateActivityInput } from '@/types'

const STEPS = ['Основное', 'Дата и место', 'Детали', 'Предпросмотр']

const CATEGORIES = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value: value as Category,
  ...meta,
}))

const EMPTY_DATE: DateOption = {
  id: generateId(),
  date: '',
  time_start: '',
  time_end: '',
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            i < current
              ? 'bg-emerald-500 text-white'
              : i === current
              ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
          }`}>
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 rounded-full transition-all duration-500 ${i < current ? 'bg-emerald-400' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CreateActivityInput>({
    title: '',
    description: '',
    category: 'social',
    location: '',
    is_online: false,
    date_options: [{ ...EMPTY_DATE, id: generateId() }],
    max_participants: null,
    cost: 0,
    min_votes_to_confirm: 3,
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update<K extends keyof CreateActivityInput>(key: K, value: CreateActivityInput[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function addDateOption() {
    update('date_options', [...form.date_options, { ...EMPTY_DATE, id: generateId() }])
  }

  function removeDateOption(id: string) {
    update('date_options', form.date_options.filter(d => d.id !== id))
  }

  function updateDateOption(id: string, field: keyof DateOption, value: string) {
    update('date_options', form.date_options.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-zа-яё0-9_]/gi, '')
    if (tag && !form.tags.includes(tag) && form.tags.length < 8) {
      update('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  function validateStep(): boolean {
    const errs: Record<string, string> = {}
    if (step === 0) {
      if (!form.title.trim()) errs.title = 'Введите название'
      if (form.title.length > 100) errs.title = 'Максимум 100 символов'
      if (!form.category) errs.category = 'Выберите категорию'
    }
    if (step === 1) {
      if (form.date_options.some(d => !d.date || !d.time_start)) {
        errs.date_options = 'Заполните все варианты дат'
      }
      if (!form.is_online && !form.location.trim()) {
        errs.location = 'Укажите место или отметьте «Онлайн»'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function nextStep() {
    if (!validateStep()) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('activities')
        .insert({
          creator_id: user.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category,
          location: form.is_online ? null : form.location.trim() || null,
          is_online: form.is_online,
          date_options: form.date_options,
          max_participants: form.max_participants,
          cost: form.cost,
          min_votes_to_confirm: form.min_votes_to_confirm,
          tags: form.tags,
          status: 'proposal',
        })
        .select()
        .single()

      if (error) { console.error(error); return }
      router.push(`/activities/${data.id}`)
    })
  }

  const meta = CATEGORY_META[form.category]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="mb-4 gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? STEPS[step - 1] : 'Назад'}
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
              Новая активность
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Шаг {step + 1} из {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <StepIndicator current={step} total={STEPS.length} />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm space-y-6">

        {/* ── STEP 0: Basic info ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Название активности *
              </label>
              <Input
                placeholder="Например: Поход на Воробьёвы горы"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                error={errors.title}
                maxLength={100}
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
                placeholder="Расскажи подробнее — что будет, как добраться, что взять с собой..."
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-zinc-400">{form.description.length}/1000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Категория *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => update('category', cat.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      form.category === cat.value
                        ? `${cat.bg} ${cat.text} border-current`
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>
          </div>
        )}

        {/* ── STEP 1: Date & location ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  Дата и время *
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addDateOption}
                  className="gap-1 text-violet-600 dark:text-violet-400 h-7"
                  disabled={form.date_options.length >= 3}
                >
                  <Plus className="h-3.5 w-3.5" /> Добавить вариант
                </Button>
              </div>

              <div className="space-y-3">
                {form.date_options.map((opt, i) => (
                  <div key={opt.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        {form.date_options.length > 1 ? `Вариант ${i + 1}` : 'Дата'}
                      </span>
                      {form.date_options.length > 1 && (
                        <button
                          onClick={() => removeDateOption(opt.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          type="date"
                          value={opt.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => updateDateOption(opt.id, 'date', e.target.value)}
                          icon={<Calendar className="h-4 w-4" />}
                        />
                      </div>
                      <div>
                        <Input
                          type="time"
                          value={opt.time_start}
                          onChange={e => updateDateOption(opt.id, 'time_start', e.target.value)}
                          icon={<Clock className="h-4 w-4" />}
                        />
                      </div>
                      <div>
                        <Input
                          type="time"
                          value={opt.time_end ?? ''}
                          onChange={e => updateDateOption(opt.id, 'time_end', e.target.value)}
                          placeholder="Конец"
                          icon={<Clock className="h-4 w-4 text-zinc-300" />}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {errors.date_options && (
                  <p className="text-xs text-red-500">{errors.date_options}</p>
                )}
              </div>

              {form.date_options.length > 1 && (
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-2 font-medium">
                  💡 Участники смогут голосовать за удобный вариант
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Место *
              </label>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => update('is_online', false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    !form.is_online
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
                  }`}
                >
                  <MapPin className="h-4 w-4" /> Офлайн
                </button>
                <button
                  type="button"
                  onClick={() => update('is_online', true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.is_online
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
                  }`}
                >
                  <Globe className="h-4 w-4" /> Онлайн
                </button>
              </div>

              {!form.is_online && (
                <Input
                  placeholder="Парк Горького, Москва / ул. Пушкина, 10"
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.location}
                  onChange={e => update('location', e.target.value)}
                  error={errors.location}
                />
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Details ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Голосов для подтверждения
                </label>
                <Input
                  type="number"
                  min={2}
                  max={100}
                  value={form.min_votes_to_confirm}
                  onChange={e => update('min_votes_to_confirm', Number(e.target.value))}
                  icon={<Check className="h-4 w-4" />}
                />
                <p className="text-xs text-zinc-400 mt-1">Нужно голосов «Да» для подтверждения</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Макс. участников
                </label>
                <Input
                  type="number"
                  min={2}
                  max={1000}
                  placeholder="Без ограничений"
                  value={form.max_participants ?? ''}
                  onChange={e => update('max_participants', e.target.value ? Number(e.target.value) : null)}
                  icon={<Users className="h-4 w-4" />}
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
                value={form.cost || ''}
                onChange={e => update('cost', Number(e.target.value) || 0)}
                icon={<DollarSign className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Теги (до 8)
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Добавить тег..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  icon={<Tag className="h-4 w-4" />}
                />
                <Button type="button" variant="outline" onClick={addTag} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => update('tags', form.tags.filter(t => t !== tag))}
                    className="px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium cursor-pointer hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                    title="Нажми, чтобы удалить"
                  >
                    #{tag} ×
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className={`h-2 -mx-8 -mt-8 bg-gradient-to-r ${meta.gradient} rounded-t-3xl`} />

            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${meta.bg} ${meta.text}`}>
                  {meta.emoji} {meta.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  Голосование
                </span>
              </div>

              <h2 className="text-xl font-black text-zinc-900 dark:text-white">{form.title || 'Без названия'}</h2>

              {form.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{form.description}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                {form.date_options[0]?.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-violet-400" />
                    {form.date_options[0].date} • {form.date_options[0].time_start}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  {form.is_online
                    ? <><Globe className="h-3.5 w-3.5 text-sky-400" /> Онлайн</>
                    : <><MapPin className="h-3.5 w-3.5 text-rose-400" /> {form.location || 'Место не указано'}</>
                  }
                </span>
                {form.max_participants && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-amber-400" /> до {form.max_participants} чел.
                  </span>
                )}
                {form.cost > 0 && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> {form.cost} ₽
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Нужно {form.min_votes_to_confirm} голоса «Да»</span>
                  <span>0/{form.min_votes_to_confirm}</span>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                  <div className="h-full w-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Выглядит хорошо? Нажми «Опубликовать» и дождись голосов!
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setStep(s => s - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button size="lg" className="flex-1" onClick={nextStep}>
            Далее
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            variant="amber"
            className="flex-1"
            loading={isPending}
            onClick={handleSubmit}
          >
            🚀 Опубликовать активность
          </Button>
        )}
      </div>
    </div>
  )
}
