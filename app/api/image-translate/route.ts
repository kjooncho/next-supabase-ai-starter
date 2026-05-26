import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IMAGE_OCR_PROMPT, makeImageTranslationPrompt, TRANSLATION_SYSTEM_PROMPT } from '@/lib/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase'

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

const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageMediaType = (typeof VALID_MEDIA_TYPES)[number]

export async function POST(req: Request) {
  let image: string, media_type: ImageMediaType

  try {
    const body = await req.json()
    image = body.image
    const mt = body.media_type ?? 'image/jpeg'
    media_type = VALID_MEDIA_TYPES.includes(mt) ? mt : 'image/jpeg'
  } catch {
    return Response.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  if (!image) {
    return Response.json({ error: '이미지가 없습니다' }, { status: 400 })
  }

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
        send({ step: 0, type: 'start' })

        // Step 1: OCR — 이미지에서 일본어 텍스트만 추출
        const stopKeepalive1 = startKeepalive(controller)
        const ocrRes = await ai.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type, data: image } },
                { type: 'text', text: IMAGE_OCR_PROMPT },
              ],
            },
          ],
        })
        stopKeepalive1()

        const extractedText = ocrRes.content.find((b) => b.type === 'text')?.text?.trim() ?? ''

        if (!extractedText || extractedText === '(없음)') {
          send({ type: 'error', message: '이미지에서 일본어 텍스트를 찾지 못했어요. 더 선명한 이미지를 사용하거나, 일본어가 있는 부분을 클로즈업해서 다시 시도해주세요.' })
          controller.close()
          return
        }

        send({ step: 0, type: 'result', data: { needs_correction: false, correction_items: [] } })

        // Step 2: 번역 분석 — 추출된 텍스트를 번역·분석
        const stopKeepalive2 = startKeepalive(controller)
        const translationRes = await ai.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: TRANSLATION_SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: makeImageTranslationPrompt(extractedText) },
          ],
        })
        stopKeepalive2()

        const rawText = translationRes.content.find((b) => b.type === 'text')?.text ?? '{}'

        let parsed: Record<string, unknown> = {}
        try {
          parsed = JSON.parse(rawText)
        } catch {
          // 코드블록 안에 있을 경우
          const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (codeBlock) {
            try { parsed = JSON.parse(codeBlock[1]) } catch {}
          }
          // { ... } 영역만 추출 시도
          if (!Object.keys(parsed).length) {
            const first = rawText.indexOf('{')
            const last = rawText.lastIndexOf('}')
            if (first !== -1 && last !== -1) {
              try { parsed = JSON.parse(rawText.slice(first, last + 1)) } catch {}
            }
          }
        }

        for (let step = 1; step <= 5; step++) {
          const key = `step${step}_${['structure', 'versions', 'grammar', 'culture', 'etymology'][step - 1]}`
          send({ step, type: 'complete', data: parsed[key] })
        }

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
                mode: 'image',
                korean_input: extractedText,
                step0_cultural: { needs_correction: false, correction_items: [] },
                step1_structure: parsed.step1_structure ?? [],
                step2_versions: parsed.step2_versions ?? { casual: '', polite: '', formal: '' },
                step2_readings: parsed.step2_readings ?? undefined,
                step2_pronunciations: parsed.step2_pronunciations ?? undefined,
                step3_grammar: parsed.step3_grammar ?? [],
                step4_culture: parsed.step4_culture ?? '',
                step5_etymology: parsed.step5_etymology ?? null,
                recommended_version: parsed.recommended_version ?? 'casual',
                has_mnemonic: !!parsed.step5_etymology,
              },
            })
            .select('id')
            .single()

          if (cardError) {
            console.error('[image-card-save] error:', cardError.code, cardError.message)
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
          mode: 'image',
          input_kr: extractedText,
          step0_cultural: { needs_correction: false, correction_items: [] },
          step1_structure: parsed.step1_structure ?? [],
          step2_versions: parsed.step2_versions ?? { casual: '', polite: '', formal: '' },
          step2_readings: parsed.step2_readings ?? undefined,
          step2_pronunciations: parsed.step2_pronunciations ?? undefined,
          step3_grammar: parsed.step3_grammar ?? [],
          step4_culture: parsed.step4_culture ?? '',
          step5_etymology: parsed.step5_etymology ?? null,
          recommended_version: parsed.recommended_version ?? 'casual',
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
