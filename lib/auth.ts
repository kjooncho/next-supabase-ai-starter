import { createServerSupabase } from '@/lib/supabase-server'

export async function getCurrentUser() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserProfile() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const supabase = await createServerSupabase()
  const { data: profile } = await supabase
    .from('users')
    .select('level, life_situations')
    .eq('id', userId)
    .single()

  return !!(
    profile &&
    profile.level &&
    profile.level !== 'beginner' &&
    profile.life_situations &&
    Array.isArray(profile.life_situations) &&
    profile.life_situations.length > 0
  )
}
