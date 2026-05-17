import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { VoteType } from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const vote = body.vote as VoteType
  if (!['yes', 'no', 'maybe'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })
  }

  // Check activity exists and is still a proposal
  const { data: activity } = await supabase
    .from('activities')
    .select('id, status, min_votes_to_confirm')
    .eq('id', activityId)
    .single()

  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (activity.status !== 'proposal') {
    return NextResponse.json({ error: 'Voting closed' }, { status: 400 })
  }

  // Upsert vote
  const { error } = await supabase
    .from('votes')
    .upsert(
      { activity_id: activityId, user_id: user.id, vote },
      { onConflict: 'activity_id,user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check if we should auto-confirm
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId)
    .eq('vote', 'yes')

  if ((count ?? 0) >= activity.min_votes_to_confirm) {
    await supabase
      .from('activities')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', activityId)
      .eq('status', 'proposal')
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('votes')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
