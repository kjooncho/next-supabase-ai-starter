import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MODEL } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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
  const { topic, expression_a, expression_b, haru_question, user_answer, mode } = body

  if (mode === 'hint') {
    const result = await ai.messages.create({
      model: MODEL,
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `일본어 "${expression_a} vs ${expression_b}" 차이를 한국어로 핵심만 1~2문장 힌트. 정답은 주지 말고 방향만.`,
      }],
    })
    await createAdminClient().rpc('increment_api_usage', {
      p_user_id: user.id,
      p_date: new Date().toISOString().slice(0, 10),
    })
    return Response.json({ hint: (result.content[0] as { text: string }).text })
  }

  if (!user_answer) {
    return Response.json({ error: '입력이 없습니다' }, { status: 400 })
  }

  const systemPrompt = `당신은 하루(Haru)입니다. 일본어를 배우고 싶은 학생 캐릭터예요.
선생님(사용자)이 표현 차이를 설명해줬어요. 반응 규칙:
- 항상 한국어로 2~3문장
- 핵심 설명이 맞으면: 감사·복창하며 이해 표현
- 부족하거나 틀리면: 구체적으로 무엇이 더 궁금한지 재질문
- 이모지 1~2개, "선생님" 호칭 유지`

  const result = await ai.messages.create({
    model: MODEL,
    max_tokens: 250,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `주제: ${topic}\n하루 질문: ${haru_question}\n선생님 설명: ${user_answer}\n\n"${expression_a} vs ${expression_b}" 차이를 잘 설명했나요? 하루로서 반응해주세요.`,
    }],
  })

  await createAdminClient().rpc('increment_api_usage', {
    p_user_id: user.id,
    p_date: new Date().toISOString().slice(0, 10),
  })

  const haruResponse = (result.content[0] as { text: string }).text
  const understood = /이해|알겠|맞아|감사|완벽|정확/.test(haruResponse)

  return Response.json({ haru_response: haruResponse, understood })
}
