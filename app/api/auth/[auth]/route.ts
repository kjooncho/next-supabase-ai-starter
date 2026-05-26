import { createServerSupabase } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth: string }> }
) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { email, user_metadata } = user
        const displayName = user_metadata?.name || email?.split('@')[0] || 'User'

        await supabase.from('users').upsert(
          {
            id: user.id,
            email,
            display_name: displayName,
            level: 'beginner',
          },
          { onConflict: 'id' }
        )
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
