'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Edit3, Save, X, MapPin, AtSign, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ActivityCard } from '@/components/ActivityCard'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_META } from '@/lib/utils'
import type { Profile, Activity } from '@/types'

const INTERESTS = [
  '⚽ Спорт', '🍕 Еда', '🎭 Культура', '🌿 Природа',
  '📚 Обучение', '✈️ Путешествия', '🎮 Игры', '🎉 Тусовки',
  '🎵 Музыка', '🎨 Творчество', '🏋️ Фитнес', '🧘 Йога',
]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ full_name: '', bio: '', interests: [] as string[] })
  const [activeTab, setActiveTab] = useState<'created' | 'voted'>('created')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(p)
      setForm({ full_name: p?.full_name ?? '', bio: p?.bio ?? '', interests: p?.interests ?? [] })

      const { data: acts } = await supabase
        .from('activities')
        .select(`
          *,
          creator:profiles!activities_creator_id_fkey(id, username, full_name, avatar_url),
          vote_counts:votes(vote)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      const mapped = (acts ?? []).map(a => {
        const vs = Array.isArray(a.vote_counts) ? a.vote_counts : []
        return {
          ...a,
          vote_counts: {
            yes: vs.filter((v: { vote: string }) => v.vote === 'yes').length,
            no: vs.filter((v: { vote: string }) => v.vote === 'no').length,
            maybe: vs.filter((v: { vote: string }) => v.vote === 'maybe').length,
            total: vs.length,
          },
        }
      })
      setActivities(mapped)
      setLoading(false)
    }
    load()
  }, [router])

  function toggleInterest(interest: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        bio: form.bio,
        interests: form.interests,
      })
      .eq('id', profile!.id)

    setProfile(p => p ? { ...p, ...form } : p)
    setEditing(false)
    setSaving(false)
  }

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  const totalVotes = activities.reduce((sum, a) => sum + (a.vote_counts?.total ?? 0), 0)
  const confirmedCount = activities.filter(a => a.status === 'confirmed').length

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-3xl animate-pulse" />
        <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute bottom-0 right-4 translate-y-1/2">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-900 shadow-xl">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-700 transition-colors">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pt-14 pb-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Имя</label>
                <Input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  icon={<User className="h-4 w-4" />}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-1">О себе</label>
                <Textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Расскажи о себе..."
                  rows={3}
                  maxLength={300}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Интересы</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => {
                    const isSelected = form.interests.includes(interest)
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-300'
                        }`}
                      >
                        {interest}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} loading={saving} className="gap-2">
                  <Save className="h-4 w-4" /> Сохранить
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" /> Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
                    {profile?.full_name ?? 'Пользователь'}
                  </h1>
                  <div className="flex items-center gap-1 text-zinc-400 mt-0.5">
                    <AtSign className="h-3.5 w-3.5" />
                    <span className="text-sm">{profile?.username}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="gap-2"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Редактировать
                </Button>
              </div>

              {profile?.bio && (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {profile?.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.interests.map(interest => (
                    <span key={interest} className="px-3 py-1 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {[
                  { label: 'Активностей', value: activities.length },
                  { label: 'Подтверждено', value: confirmedCount },
                  { label: 'Всего голосов', value: totalVotes },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-black gradient-text">{stat.value}</div>
                    <div className="text-xs text-zinc-400 mt-0.5 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activities */}
      <div>
        <div className="flex items-center gap-1 mb-5 border-b border-zinc-200 dark:border-zinc-800">
          {[
            { id: 'created' as const, label: 'Мои активности' },
            { id: 'voted' as const, label: 'Участвую' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'created' && (
          <div className="grid gap-4">
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">Ещё нет активностей</h3>
                <p className="text-zinc-500 mb-4">Создай первую и найди компанию!</p>
                <Button asChild><a href="/create">Создать активность</a></Button>
              </div>
            ) : (
              activities.map(a => <ActivityCard key={a.id} activity={a} compact />)
            )}
          </div>
        )}

        {activeTab === 'voted' && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🗳️</div>
            <p className="text-zinc-500">История голосований появится здесь</p>
          </div>
        )}
      </div>
    </div>
  )
}
