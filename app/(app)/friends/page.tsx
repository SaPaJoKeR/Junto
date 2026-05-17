// @ts-nocheck
'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, UserPlus, UserCheck, UserX, MessageCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

interface UserResult {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  friendship_id?: string
  status?: FriendStatus
}

interface Friendship {
  id: string
  status: string
  requester_id: string
  addressee_id: string
  requester: { id: string; username: string; full_name: string | null; avatar_url: string | null }
  addressee:  { id: string; username: string; full_name: string | null; avatar_url: string | null }
}

function Avatar2({ profile, size = 'md' }: { profile: { full_name?: string | null; username?: string; avatar_url?: string | null }; size?: 'sm' | 'md' }) {
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  const cls = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  return (
    <Avatar className={cls}>
      {profile.avatar_url && <AvatarFallback>{initials}</AvatarFallback>}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

export default function FriendsPage() {
  const [userId, setUserId] = useState('')
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [friends, setFriends] = useState<Friendship[]>([])
  const [incoming, setIncoming] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const supabase = createClient()

  async function loadData(uid: string) {
    const { data } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(id,username,full_name,avatar_url), addressee:profiles!friendships_addressee_id_fkey(id,username,full_name,avatar_url)')
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)

    const all = (data ?? []) as Friendship[]
    setFriends(all.filter(f => f.status === 'accepted'))
    setIncoming(all.filter(f => f.status === 'pending' && f.addressee_id === uid))
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      loadData(user.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doSearch(q: string) {
    if (!q.trim() || !userId) { setSearchResults([]); return }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .neq('id', userId)
      .limit(12)

    const { data: myFs } = await supabase
      .from('friendships')
      .select('id, status, requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

    const results = (profiles ?? []).map(p => {
      const f = myFs?.find(fr => fr.requester_id === p.id || fr.addressee_id === p.id)
      let status: FriendStatus = 'none'
      let friendship_id: string | undefined
      if (f) {
        friendship_id = f.id
        if (f.status === 'accepted') status = 'accepted'
        else if (f.requester_id === userId) status = 'pending_sent'
        else status = 'pending_received'
      }
      return { ...p, status, friendship_id }
    })
    setSearchResults(results)
  }

  function sendRequest(addresseeId: string) {
    startTransition(async () => {
      await supabase.from('friendships').insert({ requester_id: userId, addressee_id: addresseeId, status: 'pending' })
      doSearch(query)
    })
  }

  function cancelRequest(friendshipId: string) {
    startTransition(async () => {
      await supabase.from('friendships').delete().eq('id', friendshipId)
      doSearch(query)
      loadData(userId)
    })
  }

  function acceptRequest(friendshipId: string) {
    startTransition(async () => {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
      loadData(userId)
    })
  }

  function declineRequest(friendshipId: string) {
    startTransition(async () => {
      await supabase.from('friendships').delete().eq('id', friendshipId)
      loadData(userId)
    })
  }

  function unfriend(friendshipId: string) {
    startTransition(async () => {
      await supabase.from('friendships').delete().eq('id', friendshipId)
      loadData(userId)
    })
  }

  function getFriendProfile(f: Friendship) {
    return f.requester_id === userId ? f.addressee : f.requester
  }

  const TABS = [
    { id: 'friends'  as const, label: `Друзья (${friends.length})` },
    { id: 'requests' as const, label: `Заявки${incoming.length > 0 ? ` (${incoming.length})` : ''}` },
    { id: 'search'   as const, label: 'Найти' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-1">Друзья</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Находи людей и общайся в личке</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
              tab === t.id
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}>
            {t.label}
            {t.id === 'requests' && incoming.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold">
                {incoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)
          ) : friends.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">Пока нет друзей. Найди людей во вкладке «Найти»!</p>
              <Button onClick={() => setTab('search')}>Найти друзей</Button>
            </div>
          ) : friends.map(f => {
            const p = getFriendProfile(f)
            const initials = p.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
            return (
              <div key={f.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
                <Avatar className="h-11 w-11">
                  {p.avatar_url && <img src={p.avatar_url} alt="" className="rounded-full w-full h-full object-cover" />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 dark:text-white truncate">{p.full_name ?? p.username}</p>
                  <p className="text-sm text-zinc-400">@{p.username}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/messages/${p.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" /> Написать
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => unfriend(f.id)} loading={isPending}>
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Incoming requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {incoming.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📬</div>
              <p className="text-zinc-500 dark:text-zinc-400">Нет входящих заявок</p>
            </div>
          ) : incoming.map(f => {
            const p = f.requester
            const initials = p.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
            return (
              <div key={f.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
                <Avatar className="h-11 w-11">
                  {p.avatar_url && <img src={p.avatar_url} alt="" className="rounded-full w-full h-full object-cover" />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 dark:text-white truncate">{p.full_name ?? p.username}</p>
                  <p className="text-sm text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> @{p.username}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => acceptRequest(f.id)} loading={isPending}>
                    <UserCheck className="h-3.5 w-3.5" /> Принять
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => declineRequest(f.id)} loading={isPending}>
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); doSearch(e.target.value) }}
              placeholder="Поиск по имени или никнейму..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-2">
            {searchResults.map(p => {
              const initials = p.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
                  <Avatar className="h-10 w-10">
                    {p.avatar_url && <img src={p.avatar_url} alt="" className="rounded-full w-full h-full object-cover" />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate text-sm">{p.full_name ?? p.username}</p>
                    <p className="text-xs text-zinc-400">@{p.username}</p>
                  </div>
                  <div>
                    {p.status === 'none' && (
                      <Button size="sm" className="gap-1.5" onClick={() => sendRequest(p.id)} loading={isPending}>
                        <UserPlus className="h-3.5 w-3.5" /> Добавить
                      </Button>
                    )}
                    {p.status === 'pending_sent' && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-zinc-400" onClick={() => cancelRequest(p.friendship_id!)} loading={isPending}>
                        <Clock className="h-3.5 w-3.5" /> Отмена
                      </Button>
                    )}
                    {p.status === 'pending_received' && (
                      <Button size="sm" className="gap-1.5" onClick={() => acceptRequest(p.friendship_id!)} loading={isPending}>
                        <UserCheck className="h-3.5 w-3.5" /> Принять
                      </Button>
                    )}
                    {p.status === 'accepted' && (
                      <Link href={`/messages/${p.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5" /> Написать
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
            {query && searchResults.length === 0 && (
              <p className="text-center text-sm text-zinc-400 py-8">Никто не найден</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
