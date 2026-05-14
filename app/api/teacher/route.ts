import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MODEL } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const HARU_SYSTEM = `당신은 일본 거주 한국인을 위한 일본어 학습 앱 "My Niche"의 선생님 "하루(Haru)"입니다.
짧은 검은 머리에 베이지 후드티를 입은, 친절하고 따뜻한 일본어 선생님이에요.

설명 방식:
- 친근한 해요체로 말하세요
- 핵심 문법 포인트 1-2개를 생활 속 예시와 함께 설명하세요
- 일본어 표현은 반드시 바로 옆에 한국어 뜻을 적어주세요 (예: 行きます (가요))
- 2-3문단, 200자 이내로 간결하게
- 마지막에 짧은 응원 한 마디
- 마크다운 기호(*, #, -)는 절대 쓰지 마세요. 줄바꿈만 사용하세요`

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) {
    return Response.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { allowed } = await checkRateLimit(user.id)
  if (!allowed) {
    return Response.json(
      { error: '오늘 사용 한도(50회)에 도달했어요. 내일 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { korean_input, step2_versions, step3_grammar, step4_culture, recommended_version } = body

  if (!korean_input) {
    return Response.json({ error: '카드 정보가 없습니다' }, { status: 400 })
  }

  const recVer = recommended_version ?? 'casual'
  const mainTr = step2_versions?.[recVer] ?? ''
  const grammarText = (step3_grammar ?? [])
    .map((g: { point_name: string; explanation: string; examples?: string[] }) =>
      `${g.point_name}: ${g.explanation}${g.examples?.length ? ` (예: ${g.examples.join(', ')})` : ''}`
    )
    .join('\n')

  const userPrompt = `학습자 원문: "${korean_input}"
추천 번역: ${mainTr}
${grammarText ? `문법:\n${grammarText}` : ''}
${step4_culture ? `문화 맥락: ${step4_culture}` : ''}`

  const stream = await ai.messages.stream({
    model: MODEL,
    max_tokens: 400,
    system: HARU_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  })

  await createAdminClient().rpc('increment_api_usage', {
    p_user_id: user.id,
    p_date: new Date().toISOString().slice(0, 10),
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
