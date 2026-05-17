'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/feed'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    let email = form.email.trim()

    // If no '@' it's a username — look up the email
    if (!email.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email.toLowerCase())
        .single()

      if (!profile) {
        setError('Пользователь с таким никнеймом не найден')
        setLoading(false)
        return
      }

      // Get email via RPC or from auth — fall back to <id>@junto.local convention
      // We store a predictable placeholder email for username-only users
      // For regular users, we use the lookup API
      const { data: emailData } = await supabase
        .rpc('get_user_email_by_id', { user_id: profile.id })
        .single()

      if (!emailData) {
        setError('Не удалось найти аккаунт. Попробуйте войти через email.')
        setLoading(false)
        return
      }

      email = emailData as string
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: form.password,
    })

    if (error) {
      setError('Неверный email/никнейм или пароль')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${next}`,
      },
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-black text-base">J</span>
            </div>
            <span className="text-white font-black text-2xl">Junto</span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-5xl font-black text-white leading-tight">
              Твои лучшие<br />воспоминания<br />
              <span className="text-amber-300">начинаются здесь</span>
            </h2>
            <p className="text-violet-200 text-lg leading-relaxed max-w-sm">
              Сотни активностей ждут тебя каждый день. Один клик — и ты в компании.
            </p>
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
              <p className="text-white text-sm italic mb-3">
                "Нашёл команду для воскресного футбола за 10 минут. Теперь играем каждую неделю!"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm font-bold">А</div>
                <div>
                  <p className="text-white text-xs font-semibold">Андрей К.</p>
                  <p className="text-violet-300 text-xs">Москва</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-violet-300 text-sm">© 2025 Junto</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">J</span>
            </div>
            <span className="font-black text-xl bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">Junto</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
              С возвращением! 👋
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                Зарегистрируйся
              </Link>
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full mb-6 gap-3 border-zinc-200 dark:border-zinc-700"
            onClick={handleGoogle}
            loading={googleLoading}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Войти через Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-zinc-950 px-3 text-zinc-400">или через email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email или никнейм</label>
              <Input
                type="text"
                placeholder="you@example.com или @nickname"
                icon={<Mail className="h-4 w-4" />}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Пароль</label>
                <Link href="/forgot-password" className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
                  Забыл пароль?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  error={error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
              Войти
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  )
}
