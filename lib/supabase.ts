import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 클라이언트 컴포넌트용 (브라우저)
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// API Route 전용 — service role key (RLS 우회, 서버에서만 사용)
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}
