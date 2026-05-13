import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  const all = cookieStore.getAll()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => all,
        setAll: () => {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  return Response.json({
    user_id: user?.id ?? null,
    email: user?.email ?? null,
    cookie_count: all.length,
    sb_cookies: all.filter(c => c.name.startsWith('sb-')).map(c => c.name),
    error: error?.message ?? null,
  })
}
