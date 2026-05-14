import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MODEL } from '@/lib/anthropic'
import { IMAGE_ANALYSIS_PROMPT } from '@/lib/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function sseChunk(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
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

        const res = await ai.messages.create({
          model: MODEL,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type, data: image },
                },
                { type: 'text', text: IMAGE_ANALYSIS_PROMPT },
              ],
            },
          ],
        })

        const rawText = res.content.find((b) => b.type === 'text')?.text ?? '{}'

        let parsed: Record<string, unknown> = {}
        try {
          parsed = JSON.parse(rawText)
        } catch {
          const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (match) {
            try { parsed = JSON.parse(match[1]) } catch {}
          }
        }

        const extractedText = (parsed.extracted_text as string) ?? '(텍스트를 찾을 수 없습니다)'

        send({ step: 0, type: 'result', data: { needs_correction: false, correction_items: [] } })

        for (let step = 1; step <= 5; step++) {
          const key = `step${step}_${['structure', 'versions', 'grammar', 'culture', 'etymology'][step - 1]}`
          send({ step, type: 'complete', data: parsed[key] })
        }

        if (user) {
          const admin = createAdminClient()
          await admin.rpc('increment_api_usage', {
            p_user_id: user.id,
            p_date: new Date().toISOString().slice(0, 10),
          })
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
          card_id: null,
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
