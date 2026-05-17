import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import CalendarSidebar from '@/components/CalendarSidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar profile={profile} userId={user.id} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6 items-start">
          <main className="flex-1 min-w-0">
            {children}
          </main>
          <aside className="hidden xl:block w-72 shrink-0 sticky top-24">
            <CalendarSidebar userId={user.id} />
          </aside>
        </div>
      </div>
    </div>
  )
}
