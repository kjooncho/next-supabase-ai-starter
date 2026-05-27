import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  CULTURAL_CORRECTION_SYSTEM_PROMPT,
  CULTURAL_CORRECTION_TOOL,
  TRANSLATION_SYSTEM_PROMPT,
  makeTranslationPrompt,
} from '@/lib/prompts'
import { createAdminClient } from '@/lib/supabase'
import { INPUT_LIMIT, MODEL } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function sseChunk(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

const SSE_PING = new TextEncoder().encode(': ping\n\n')

function startKeepalive(controller: ReadableStreamDefaultController, intervalMs = 5000) {
  const timer = setInterval(() => {
    try { controller.enqueue(SSE_PING) } catch {}
  }, intervalMs)
  return () => clearInterval(timer)
}

export async function POST(req: Request) {
  const { input_kr } = await req.json().catch(() => ({}))

  if (!input_kr || typeof input_kr !== 'string') {
    return Response.json({ error: '입력이 없습니다' }, { status: 400 })
  }
  if (input_kr.length > INPUT_LIMIT) {
    return Response.json(
      { error: `${INPUT_LIMIT}자 이하로 입력해주세요 (현재 ${input_kr.length}자)` },
      { status: 400 }
    )
  }

  // next/headers cookies로 세션 읽기 (Node.js 런타임에서만 가능)
  const cookieStore = await cookies()
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabaseServer.auth.getUser()

  // 로그인 유저 rate limit 확인
  if (user) {
    const { allowed } = await checkRateLimit(user.id)
    if (!allowed) {
      return Response.json(
        { error: '오늘 번역 한도(50회)에 도달했어요. 내일 다시 시도해주세요.' },
        { status: 429 }
      )
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(sseChunk(data))

      try {
        // ── STEP 0: 문화 교정 ─────────────────────────────────
        send({ step: 0, type: 'start' })

        let stopKeepalive = startKeepalive(controller)
        const correctionRes = await ai.messages.create({
          model: MODEL,
          max_tokens: 512,
          system: [
            {
              type: 'text',
              text: CULTURAL_CORRECTION_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          tools: [CULTURAL_CORRECTION_TOOL as Anthropic.Tool],
          tool_choice: { type: 'any' },
          messages: [{ role: 'user', content: input_kr }],
        })
        stopKeepalive()

        let correctionResult = { needs_correction: false, correction_items: [] as object[] }
        for (const block of correctionRes.content) {
          if (block.type === 'tool_use' && block.name === 'cultural_correction_check') {
            correctionResult = block.input as typeof correctionResult
          }
        }

        send({ step: 0, type: 'result', data: correctionResult })

        // ── STEP 1-5: 번역 파이프라인 ────────────────────────
        send({ step: 1, type: 'start' })

        stopKeepalive = startKeepalive(controller)
        const translationRes = await ai.messages.create({
          model: MODEL,
          max_tokens: 2048,
          system: [
            {
              type: 'text',
              text: TRANSLATION_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [
            { role: 'user', content: makeTranslationPrompt(input_kr) },
          ],
        })
        stopKeepalive()

        const rawText = translationRes.content.find((b) => b.type === 'text')?.text ?? '{}'

        let translationData: Record<string, unknown> = {}
        try {
          translationData = JSON.parse(rawText)
        } catch {
          const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (match) translationData = JSON.parse(match[1])
        }

        for (let step = 1; step <= 5; step++) {
          const key = `step${step}_${['structure', 'versions', 'grammar', 'culture', 'etymology'][step - 1]}`
          send({ step, type: 'complete', data: translationData[key] })
        }

        // ── 카드 저장 (로그인 시) ─────────────────────────────
        let savedCardId: string | null = null
        if (user) {
          const admin = createAdminClient()
          const { data: card, error: cardError } = await admin
            .from('cards')
            .insert({
              user_id: user.id,
              card_type: 'sentence',
              learning_status: 'learning',
              has_real_use: false,
              payload: {
                korean_input: input_kr,
                step0_cultural: correctionResult,
                step1_structure: translationData.step1_structure ?? [],
                step2_versions: translationData.step2_versions ?? {},
                step2_readings: translationData.step2_readings ?? undefined,
                step2_pronunciations: translationData.step2_pronunciations ?? undefined,
                step3_grammar: translationData.step3_grammar ?? [],
                step4_culture: translationData.step4_culture ?? '',
                step5_etymology: translationData.step5_etymology ?? null,
                recommended_version: translationData.recommended_version ?? 'polite',
                has_mnemonic: !!translationData.step5_etymology,
              },
            })
            .select('id')
            .single()

          if (cardError) {
            console.error('[card-save] error:', cardError.code, cardError.message)
          } else {
            savedCardId = card?.id ?? null
            await admin.rpc('increment_api_usage', {
              p_user_id: user.id,
              p_date: new Date().toISOString().slice(0, 10),
            })
          }
        }

        send({
          step: -1,
          type: 'done',
          input_kr,
          step0_cultural: correctionResult,
          step1_structure: translationData.step1_structure ?? [],
          step2_versions: translationData.step2_versions,
          step2_readings: translationData.step2_readings ?? undefined,
          step2_pronunciations: translationData.step2_pronunciations ?? undefined,
          step3_grammar: translationData.step3_grammar ?? [],
          step4_culture: translationData.step4_culture ?? '',
          step5_etymology: translationData.step5_etymology ?? null,
          recommended_version: translationData.recommended_version ?? 'polite',
          card_id: savedCardId,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류'
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
