'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, AtSign, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

const INTERESTS = [
  '⚽ Спорт', '🍕 Еда', '🎭 Культура', '🌿 Природа',
  '📚 Обучение', '✈️ Путешествия', '🎮 Игры', '🎉 Тусовки',
  '🎵 Музыка', '🎨 Творчество', '🏋️ Фитнес', '🧘 Йога',
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    interests: [] as string[],
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function toggleInterest(interest: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      // Validate step 1
      const errs: Record<string, string> = {}
      if (!form.email) errs.email = 'Введите email'
      if (form.password.length < 6) errs.password = 'Минимум 6 символов'
      if (!form.fullName.trim()) errs.fullName = 'Введите имя'
      if (!form.username.trim()) errs.username = 'Введите никнейм'
      if (form.username.includes(' ')) errs.username = 'Никнейм без пробелов'
      if (Object.keys(errs).length > 0) { setErrors(errs); return }
      setErrors({})
      setStep(2)
      return
    }

    setLoading(true)
    setErrors({})

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          username: form.username.toLowerCase(),
        },
      },
    })

    if (error) {
      setErrors({ general: error.message === 'User already registered' ? 'Этот email уже зарегистрирован' : error.message })
      setLoading(false)
      return
    }

    if (data.user) {
      // Create profile with interests
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.fullName,
        username: form.username.toLowerCase(),
        interests: form.interests,
      })
    }

    router.push('/feed')
    router.refresh()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-black text-base">J</span>
            </div>
            <span className="text-white font-black text-2xl">Junto</span>
          </Link>

          <div className="space-y-8">
            <h2 className="text-5xl font-black text-white leading-tight">
              Начни встречаться<br />с
              <span className="text-amber-300"> интересными<br />людьми</span>
            </h2>

            <div className="space-y-4">
              {[
                { icon: '✓', text: 'Предлагай активности за 2 минуты' },
                { icon: '✓', text: 'Голосуй и смотри, кто идёт' },
                { icon: '✓', text: 'Находи людей с общими интересами' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {item.icon}
                  </div>
                  <p className="text-violet-100 font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-violet-300 text-sm">© 2025 Junto • Бесплатно навсегда</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">J</span>
            </div>
            <span className="font-black text-xl gradient-text">Junto</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s
                    ? 'bg-emerald-500 text-white'
                    : step === s
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
                <span className={`text-xs font-semibold ${step === s ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}`}>
                  {s === 1 ? 'Аккаунт' : 'Интересы'}
                </span>
                {s < 2 && <div className={`w-8 h-0.5 rounded-full ${step > 1 ? 'bg-violet-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
              {step === 1 ? 'Создать аккаунт 🎉' : 'Твои интересы 🌟'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {step === 1
                ? <>Уже есть аккаунт? <Link href="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">Войти</Link></>
                : 'Выбери темы — мы покажем подходящие активности'
              }
            </p>
          </div>

          {step === 1 && (
            <>
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
                Зарегистрироваться через Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-zinc-950 px-3 text-zinc-400">или заполни форму</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Имя</label>
                  <Input
                    placeholder="Александр Иванов"
                    icon={<User className="h-4 w-4" />}
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    error={errors.fullName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Никнейм</label>
                  <Input
                    placeholder="alex_ivan"
                    icon={<AtSign className="h-4 w-4" />}
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    error={errors.username}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    icon={<Mail className="h-4 w-4" />}
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    error={errors.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Пароль</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Минимум 6 символов"
                      icon={<Lock className="h-4 w-4" />}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      error={errors.password}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => {
                    const isSelected = form.interests.includes(interest)
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/25'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-300 hover:text-violet-600'
                        }`}
                      >
                        {interest}
                      </button>
                    )
                  })}
                </div>
                {form.interests.length > 0 && (
                  <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                    Выбрано: {form.interests.length}
                  </p>
                )}
                {errors.general && (
                  <p className="text-sm text-red-500">{errors.general}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Назад
                </Button>
              )}
              <Button type="submit" size="lg" className="flex-1" loading={loading}>
                {step === 1 ? 'Далее' : 'Создать аккаунт'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
