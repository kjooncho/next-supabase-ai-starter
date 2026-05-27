'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import ChatBubble from '@/components/chat/ChatBubble'
import InputBar from '@/components/chat/InputBar'
import StepIndicator from '@/components/chat/StepIndicator'
import TranslationResult from '@/components/chat/TranslationResult'
import DarumaAvatar from '@/components/ui/DarumaAvatar'
import { createBrowserSupabase } from '@/lib/supabase'
import { useAuthStore, useChatStore, type TranslationResultData, type Message } from '@/lib/store'

const EXAMPLE_CHIPS = [
  '오늘 정말 수고했어요',
  '잘 부탁드립니다',
  '오랜만이에요, 잘 지냈어요?',
]

export default function ChatPage() {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Zustand stores
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const currentStep = useChatStore((s) => s.currentStep)
  const resultModal = useChatStore((s) => s.resultModal)

  const addMessage = useChatStore((s) => s.addMessage)
  const removeMessage = useChatStore((s) => s.removeMessage)
  const updateMessages = useChatStore((s) => s.updateMessages)
  const setCorrectionData = useChatStore((s) => s.setCorrectionData)
  const setCurrentStep = useChatStore((s) => s.setCurrentStep)
  const setLoading = useChatStore((s) => s.setLoading)
  const setResultModal = useChatStore((s) => s.setResultModal)
  const clearChatMessages = useChatStore((s) => s.clearMessages)

  // Load initial auth state
  useEffect(() => {
    const supabase = createBrowserSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [setUser])

  // Restore chat history from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('chat_messages')
      if (saved) {
        const restored = JSON.parse(saved) as Message[]
        if (restored.length > 0) {
          updateMessages(restored)
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, [updateMessages])

  // Persist non-loading messages to sessionStorage
  useEffect(() => {
    if (isLoading) return
    try {
      const toSave = messages.filter((m) => m.kind !== 'loading')
      sessionStorage.setItem('chat_messages', JSON.stringify(toSave))
    } catch {
      // Ignore storage errors
    }
  }, [messages, isLoading])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentStep])

  const handleSignOut = async () => {
    await createBrowserSupabase().auth.signOut()
    router.refresh()
  }

  const handleImageSubmit = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    addMessage({ id: crypto.randomUUID(), kind: 'image-upload', dataUrl })
    addMessage({ id: '__loading__', kind: 'loading', mode: 'image' })
    setLoading(true)
    setCurrentStep(0)

    const base64 = dataUrl.split(',')[1]
    const media_type = file.type || 'image/jpeg'

    try {
      const res = await fetch('/api/image-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, media_type }),
      })

      if (!res.ok || !res.body) {
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          const errorMsg = data.error ?? '오늘 번역 한도(50회)에 도달했어요. 내일 다시 만나요! 😊'
          removeMessage('__loading__')
          addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: `오류: ${errorMsg}` })
        } else {
          const errorMsg = `잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요. (${res.status})`
          removeMessage('__loading__')
          addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: `오류: ${errorMsg}` })
        }
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = JSON.parse(line.slice(6))
          if (json.type === 'start' || json.type === 'complete') setCurrentStep(json.step)
          if (json.type === 'done') {
            removeMessage('__loading__')
            addMessage({
              id: crypto.randomUUID(),
              kind: 'translation-result',
              data: {
                mode: 'image',
                input_kr: json.input_kr ?? '',
                step0_cultural: json.step0_cultural ?? { needs_correction: false, correction_items: [] },
                step1_structure: json.step1_structure ?? [],
                step2_versions: json.step2_versions ?? { casual: '', polite: '', formal: '' },
                step2_readings: json.step2_readings ?? undefined,
                step2_pronunciations: json.step2_pronunciations ?? undefined,
                step3_grammar: json.step3_grammar ?? [],
                step4_culture: json.step4_culture ?? '',
                step5_etymology: json.step5_etymology ?? null,
                recommended_version: json.recommended_version ?? 'casual',
                card_id: json.card_id ?? null,
              } as TranslationResultData,
            })
            setLoading(false)
            setCurrentStep(-1)
          }
          if (json.type === 'error') {
            removeMessage('__loading__')
            addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: `오류: ${json.message}` })
            setLoading(false)
          }
        }
      }
    } catch {
      removeMessage('__loading__')
      addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: '오류: 네트워크 연결을 확인하고 다시 시도해 주세요.' })
      setLoading(false)
    }
  }

  const handleSubmit = async (text: string) => {
    addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'user', text })
    addMessage({ id: '__loading__', kind: 'loading' })
    setLoading(true)
    setCurrentStep(0)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_kr: text }),
      })

      if (!res.ok || !res.body) {
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          const errorMsg = data.error ?? '오늘 번역 한도(50회)에 도달했어요. 내일 다시 만나요! 😊'
          removeMessage('__loading__')
          addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: `오류: ${errorMsg}` })
        } else {
          const errorMsg = `잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요. (${res.status})`
          removeMessage('__loading__')
          addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: `오류: ${errorMsg}` })
        }
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = JSON.parse(line.slice(6))
          if (json.type === 'start' || json.type === 'complete') setCurrentStep(json.step)
          if (json.type === 'result' && json.data) setCorrectionData(json.data)
          if (json.type === 'done') {
            removeMessage('__loading__')
            addMessage({
              id: crypto.randomUUID(),
              kind: 'translation-result',
              data: {
                input_kr: json.input_kr ?? '',
                step0_cultural: json.step0_cultural ?? { needs_correction: false, correction_items: [] },
                step1_structure: json.step1_structure ?? [],
                step2_versions: json.step2_versions ?? { casual: '', polite: '', formal: '' },
                step2_readings: json.step2_readings ?? undefined,
                step2_pronunciations: json.step2_pronunciations ?? undefined,
                step3_grammar: json.step3_grammar ?? [],
                step4_culture: json.step4_culture ?? '',
                step5_etymology: json.step5_etymology ?? null,
                recommended_version: json.recommended_version ?? 'casual',
                card_id: json.card_id ?? null,
              } as TranslationResultData,
            })
            setLoading(false)
            setCurrentStep(-1)
          }
          if (json.type === 'error') {
            removeMessage('__loading__')
            addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: `오류: ${json.message}` })
            setLoading(false)
          }
        }
      }
    } catch {
      removeMessage('__loading__')
      addMessage({ id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: '오류: 네트워크 연결을 확인하고 다시 시도해 주세요.' })
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header
        className="fixed top-0 inset-x-0 h-[56px] flex items-center justify-between px-4 z-10"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <span className="text-white text-h2 font-bold">毎日</span>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              onClick={() => {
                if (!confirm('대화 기록을 모두 삭제할까요?')) return
                sessionStorage.removeItem('chat_messages')
                clearChatMessages()
              }}
              className="text-white/50 active:opacity-50 p-1"
              title="채팅 초기화"
            >
              <Trash2 size={16} />
            </button>
          )}
          {user ? (
            <button onClick={handleSignOut} className="text-caption text-white/60 active:opacity-50">
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="text-caption px-3 py-1 rounded-full text-white border border-white/30 active:opacity-50"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[92px] flex flex-col gap-3">
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-1">
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSubmit(chip)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium active:opacity-70"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--text-secondary)' }}
              >
                {chip} →
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => {
          if (msg.kind === 'correction') {
            return (
              <div
                key={msg.id}
                className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-cultural-bg)', border: '1px solid var(--color-cultural-border)' }}
              >
                <p className="text-body font-medium mb-2" style={{ color: 'var(--color-cultural)' }}>
                  💡 문화 표현 교정
                </p>
                {msg.items.map((item, i) => (
                  <p key={i} className="text-caption text-[var(--text-secondary)] leading-relaxed">
                    <span className="font-medium">&ldquo;{item.detected}&rdquo;</span> — {item.issue}
                  </p>
                ))}
              </div>
            )
          }

          if (msg.kind === 'translation-result') {
            const rec = msg.data.step2_versions[msg.data.recommended_version as keyof typeof msg.data.step2_versions] ?? ''
            const isImageMode = msg.data.mode === 'image'
            const verLabel = isImageMode
              ? '한국어 뜻'
              : msg.data.recommended_version === 'casual' ? '구어체' : msg.data.recommended_version === 'polite' ? '정중체' : '격식체'
            return (
              <div key={msg.id} className="flex items-end gap-2">
                <DarumaAvatar size={36} expression="done" className="flex-shrink-0" />
                <div
                  className="flex-1 rounded-2xl rounded-bl-sm overflow-hidden"
                  style={{ backgroundColor: 'var(--bubble-ai)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-center gap-1 px-3 pt-3 pb-1 flex-wrap">
                    {(isImageMode
                      ? ['구조', '번역', '문법', '문화', '어원']
                      : ['구조', '번역', '문법', '문화', '어원']
                    ).map((label, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                      >
                        ✓ {label}
                      </span>
                    ))}
                  </div>
                  {isImageMode && (
                    <div className="px-3 pb-1">
                      <p className="text-[10px] text-[var(--text-tertiary)]">원본 일본어</p>
                      <p className="font-jp text-caption font-medium text-[var(--text-secondary)]">{msg.data.input_kr}</p>
                    </div>
                  )}
                  <div className="px-3 pb-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[var(--text-tertiary)]">{verLabel}{isImageMode ? '' : ' (추천)'}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(rec)
                          const el = document.getElementById(`copy-${msg.id}`)
                          if (el) { el.textContent = '✓'; setTimeout(() => { if (el) el.textContent = '복사' }, 1500) }
                        }}
                        id={`copy-${msg.id}`}
                        className="text-[10px] px-2 py-0.5 rounded-full active:opacity-60"
                        style={{ color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}
                      >
                        복사
                      </button>
                    </div>
                    <p className={`${isImageMode ? 'text-body-md' : 'font-jp text-body-md'} font-medium text-[var(--text-primary)]`}>{rec}</p>
                    {msg.data.step2_readings?.[msg.data.recommended_version as keyof typeof msg.data.step2_versions] && (
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">
                        {msg.data.step2_readings[msg.data.recommended_version as keyof typeof msg.data.step2_versions]}
                      </p>
                    )}
                    {msg.data.step2_pronunciations?.[msg.data.recommended_version as keyof typeof msg.data.step2_versions] && (
                      <p className="text-[10px] mt-0.5 font-medium leading-relaxed" style={{ color: 'var(--color-accent)' }}>
                        {msg.data.step2_pronunciations[msg.data.recommended_version as keyof typeof msg.data.step2_versions]}
                      </p>
                    )}
                  </div>
                  {!user && (
                    <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--color-hairline)', backgroundColor: '#f8f4ff' }}>
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>로그인하면 카드에 저장됩니다</span>
                      <button
                        onClick={() => router.push('/login')}
                        className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white active:opacity-70"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        로그인 →
                      </button>
                    </div>
                  )}
                  <div className="flex border-t" style={{ borderColor: 'var(--color-hairline)' }}>
                    <button
                      onClick={() => setResultModal(msg.data)}
                      className="flex-1 py-2 text-center text-caption font-medium active:opacity-60"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      문법·문화 더 보기
                    </button>
                    {msg.data.card_id && (
                      <>
                        <div className="w-px self-stretch" style={{ backgroundColor: 'var(--color-hairline)' }} />
                        <button
                          onClick={() => router.push('/deck')}
                          className="flex-1 py-2 text-center text-caption font-medium active:opacity-60"
                          style={{ color: 'var(--color-success)' }}
                        >
                          내 카드
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          if (msg.kind === 'image-upload') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="rounded-2xl rounded-tr-sm overflow-hidden"
                  style={{ maxWidth: 200, border: '1px solid var(--color-hairline)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={msg.dataUrl} alt="업로드된 이미지" className="block w-full h-auto" style={{ maxHeight: 200, objectFit: 'cover' }} />
                </div>
              </div>
            )
          }

          if (msg.kind === 'loading') {
            const loadingExpression = currentStep === 0 ? 'cultural' : currentStep >= 1 && currentStep <= 4 ? 'thinking' : 'thinking'
            return (
              <div key={msg.id} className="flex items-end gap-2">
                <DarumaAvatar size={36} expression={loadingExpression} className="flex-shrink-0" />
                <div
                  className="px-4 py-2.5 rounded-2xl rounded-bl-sm"
                  style={{ backgroundColor: 'var(--bubble-ai)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  <StepIndicator currentStep={currentStep} mode={msg.mode ?? 'text'} />
                  <p className="text-caption text-[var(--text-tertiary)] mt-1">
                    {msg.mode === 'image' ? '이미지를 분석하고 있어요' : '번역 결과를 준비하고 있어요'}
                  </p>
                </div>
              </div>
            )
          }

          if (msg.id === 'greeting') {
            return (
              <p key={msg.id} className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {msg.text}
              </p>
            )
          }

          return (
            <div key={msg.id}>
              <ChatBubble role={msg.role}>
                <span className="whitespace-pre-wrap">{msg.text}</span>
              </ChatBubble>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-[84px] inset-x-0">
        <InputBar onSubmit={handleSubmit} onImageSelect={handleImageSubmit} disabled={isLoading} />
      </div>

      {resultModal && (
        <TranslationResult data={resultModal} onClose={() => setResultModal(null)} />
      )}
    </div>
  )
}
