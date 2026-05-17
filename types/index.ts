export type VoteType = 'yes' | 'no' | 'maybe'
export type ActivityStatus = 'proposal' | 'confirmed' | 'cancelled' | 'completed'

export type Category =
  | 'sport'
  | 'food'
  | 'culture'
  | 'nature'
  | 'learning'
  | 'travel'
  | 'games'
  | 'social'
  | 'music'
  | 'other'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  interests: string[]
  created_at: string
}

export interface DateOption {
  id: string
  date: string       // ISO string
  time_start: string // HH:MM
  time_end?: string
}

export interface Activity {
  id: string
  creator_id: string
  title: string
  description: string | null
  category: Category
  location: string | null
  is_online: boolean
  date_options: DateOption[]
  max_participants: number | null
  cost: number
  status: ActivityStatus
  min_votes_to_confirm: number
  image_url: string | null
  tags: string[]
  created_at: string
  confirmed_at: string | null
  // joined from relations
  creator?: Profile
  vote_counts?: VoteCounts
  user_vote?: VoteType | null
  participant_count?: number
  is_participant?: boolean
}

export interface VoteCounts {
  yes: number
  no: number
  maybe: number
  total: number
}

export interface Vote {
  id: string
  activity_id: string
  user_id: string
  vote: VoteType
  created_at: string
  profile?: Profile
}

export interface Booking {
  id: string
  activity_id: string
  user_id: string
  status: 'confirmed' | 'cancelled'
  created_at: string
  profile?: Profile
}

export interface CreateActivityInput {
  title: string
  description: string
  category: Category
  location: string
  is_online: boolean
  date_options: DateOption[]
  max_participants: number | null
  cost: number
  min_votes_to_confirm: number
  tags: string[]
}

export type SortOption = 'newest' | 'popular' | 'upcoming' | 'ending_soon'
