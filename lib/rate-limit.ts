import { createAdminClient } from './supabase'

const DAILY_LIMIT = 50

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { data, error } = await supabase
    .from('api_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found (정상: 오늘 첫 호출)
    throw new Error('Rate limit check failed')
  }

  const currentCount = data?.count ?? 0

  if (currentCount >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: DAILY_LIMIT - currentCount }
}

