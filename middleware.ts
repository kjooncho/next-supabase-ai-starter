import { NextResponse, type NextRequest } from 'next/server'

// @supabase/ssr이 Edge에서 node:fs/node:path를 참조하는 문제로
// 세션 갱신은 클라이언트 측 onAuthStateChange에 위임한다.
// 향후 라우트 보호가 필요하면 API route 레벨에서 처리.
export function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
