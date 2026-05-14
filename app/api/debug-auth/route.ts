import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  const all = cookieStore.getAll()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => all, setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  let insertResult: Record<string, unknown> = { skipped: 'not logged in' }
  if (user) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('cards')
      .insert({
        user_id: user.id,
        card_type: 'sentence',
        learning_status: 'learning',
        has_real_use: false,
        payload: { korean_input: '__debug_test__' },
      })
      .select('id')
      .single()

    if (error) {
      insertResult = { error_code: error.code, error_message: error.message, details: error.details, hint: error.hint }
    } else {
      // 테스트 카드 바로 삭제
      await admin.from('cards').delete().eq('id', data.id)
      insertResult = { success: true, inserted_id: data.id }
    }
  }

  return Response.json({
    user_id: user?.id ?? null,
    email: user?.email ?? null,
    auth_error: authError?.message ?? null,
    insert_test: insertResult,
  })
}
