import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile exists (first OAuth login)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        const meta = data.user.user_metadata
        const username = (meta?.full_name ?? meta?.name ?? 'user')
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 20)

        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: meta?.full_name ?? meta?.name ?? null,
          avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
          username: `${username}_${Math.random().toString(36).slice(2, 6)}`,
          interests: [],
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
