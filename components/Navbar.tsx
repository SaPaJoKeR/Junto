'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Compass, PlusCircle, Users, User, LogOut, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/NotificationBell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface NavbarProps {
  profile: Profile | null
  userId: string
}

const NAV_LINKS = [
  { href: '/feed',    label: 'Лента',   icon: Compass   },
  { href: '/friends', label: 'Друзья',  icon: Users     },
  { href: '/create',  label: 'Создать', icon: PlusCircle },
]

export function Navbar({ profile, userId }: NavbarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
              <span className="text-white font-black text-sm">J</span>
            </div>
            <span className="font-black text-xl bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              Junto
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell userId={userId} />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-semibold text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate">
                  {profile?.full_name ?? profile?.username ?? 'Профиль'}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-semibold">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                    </div>
                    <div className="p-2">
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <User className="h-4 w-4 text-zinc-500" /> Мой профиль
                      </Link>
                      <Link href="/friends" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <Users className="h-4 w-4 text-zinc-500" /> Друзья
                      </Link>
                      <button onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors">
                        <LogOut className="h-4 w-4" /> Выйти
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-slide-up">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                  pathname === href
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}>
                <Icon className="h-5 w-5" /> {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
