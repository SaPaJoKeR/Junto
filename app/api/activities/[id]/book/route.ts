import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: activity } = await supabase
    .from('activities')
    .select('id, status, max_participants')
    .eq('id', activityId)
    .single()

  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (activity.status !== 'confirmed') {
    return NextResponse.json({ error: 'Activity not confirmed yet' }, { status: 400 })
  }

  // Check capacity
  if (activity.max_participants) {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .eq('status', 'confirmed')

    if ((count ?? 0) >= activity.max_participants) {
      return NextResponse.json({ error: 'Activity is full' }, { status: 409 })
    }
  }

  const { error } = await supabase
    .from('bookings')
    .upsert(
      { activity_id: activityId, user_id: user.id, status: 'confirmed' },
      { onConflict: 'activity_id,user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
