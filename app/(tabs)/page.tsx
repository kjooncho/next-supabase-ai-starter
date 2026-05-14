'use client'

import { useReducer, useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatBubble from '@/components/chat/ChatBubble'
import InputBar from '@/components/chat/InputBar'
import StepIndicator from '@/components/chat/StepIndicator'
import TranslationResult, { TranslationResultData } from '@/components/chat/TranslationResult'
import { createBrowserSupabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { ChatRole, CorrectionItem, SentencePayload, TranslationVersion } from '@/types'

interface TranslationVersions {
  casual: string
  polite: string
  formal: string
}

type Message =
  | { id: string; kind: 'bubble'; role: ChatRole; text: string }
  | { id: string; kind: 'correction'; items: CorrectionItem[] }
  | { id: string; kind: 'loading' }
  | { id: string; kind: 'translation-result'; data: TranslationResultData }

type State = {
  messages: Message[]
  isLoading: boolean
  currentStep: number
  pendingCorrection: { needs_correction: boolean; correction_items: CorrectionItem[] } | null
}

type Action =
  | { type: 'SUBMIT'; text: string }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_CORRECTION'; data: { needs_correction: boolean; correction_items: CorrectionItem[] } }
  | { type: 'DONE'; data: TranslationResultData }
  | { type: 'ERROR'; message: string }
  | { type: 'RESTORE'; messages: Message[] }

const LOADING_ID = '__loading__'

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SUBMIT':
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), kind: 'bubble', role: 'user', text: action.text },
          { id: LOADING_ID, kind: 'loading' },
        ],
        isLoading: true,
        currentStep: 0,
        pendingCorrection: null,
      }

    case 'SET_STEP':
      return { ...state, currentStep: action.step }

    case 'SET_CORRECTION': {
      const next = { ...state, pendingCorrection: action.data }
      if (!action.data.needs_correction || action.data.correction_items.length === 0) return next
      const withoutLoading = state.messages.filter((m) => m.id !== LOADING_ID)
      return {
        ...next,
        messages: [
          ...withoutLoading,
          { id: crypto.randomUUID(), kind: 'correction', items: action.data.correction_items },
          { id: LOADING_ID, kind: 'loading' },
        ],
      }
    }

    case 'DONE':
      return {
        ...state,
        isLoading: false,
        currentStep: -1,
        pendingCorrection: null,
        messages: [
          ...state.messages.filter((m) => m.id !== LOADING_ID),
          { id: crypto.randomUUID(), kind: 'translation-result', data: action.data },
        ],
      }

    case 'ERROR':
      return {
        ...state,
        isLoading: false,
        currentStep: -1,
        messages: [
          ...state.messages.filter((m) => m.id !== LOADING_ID),
          { id: crypto.randomUUID(), kind: 'bubble', role: 'ai-nichi', text: `오류: ${action.message}` },
        ],
      }

    case 'RESTORE':
      return { ...state, messages: action.messages }

    default:
      return state
  }
}

const GREETING: Message = {
  id: 'greeting',
  kind: 'bubble',
  role: 'ai-nichi',
  text: '안녕하세요! 일본어로 하고 싶은 말을 한국어로 적어보세요.\n문화적으로 자연스러운 표현으로 도와드릴게요 😊',
}

export default function ChatPage() {
  const [state, dispatch] = useReducer(reducer, {
    messages: [GREETING],
    isLoading: false,
    currentStep: -1,
    pendingCorrection: null,
  })
  const [user, setUser] = useState<User | null>(null)
  const [resultModal, setResultModal] = useState<TranslationResultData | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Restore chat history from sessionStorage on mount (client-only, runs after hydration)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('chat_messages')
      if (saved) {
        const messages = JSON.parse(saved) as Message[]
        if (messages.length > 0) dispatch({ type: 'RESTORE', messages })
      }
    } catch {}
  }, [])

  // Persist non-loading messages to sessionStorage whenever messages change
  useEffect(() => {
    if (state.isLoading) return
    try {
      const toSave = state.messages.filter((m) => m.kind !== 'loading')
      sessionStorage.setItem('chat_messages', JSON.stringify(toSave))
    } catch {}
  }, [state.messages, state.isLoading])

  useEffect(() => {
    const supabase = createBrowserSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.currentStep])

  const handleSignOut = async () => {
    await createBrowserSupabase().auth.signOut()
    router.refresh()
  }

  const handleSubmit = async (text: string) => {
    dispatch({ type: 'SUBMIT', text })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_kr: text }),
      })

      if (!res.ok || !res.body) {
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          dispatch({ type: 'ERROR', message: data.error ?? '오늘 번역 한도(50회)에 도달했어요. 내일 다시 만나요! 😊' })
        } else {
          dispatch({ type: 'ERROR', message: `잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요. (${res.status})` })
        }
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
          if (json.type === 'start' || json.type === 'complete') dispatch({ type: 'SET_STEP', step: json.step })
          if (json.type === 'result' && json.data) dispatch({ type: 'SET_CORRECTION', data: json.data })
          if (json.type === 'done') {
            dispatch({
              type: 'DONE',
              data: {
                input_kr: json.input_kr ?? '',
                step0_cultural: json.step0_cultural ?? { needs_correction: false, correction_items: [] },
                step1_structure: json.step1_structure ?? [],
                step2_versions: json.step2_versions ?? { casual: '', polite: '', formal: '' },
                step3_grammar: json.step3_grammar ?? [],
                step4_culture: json.step4_culture ?? '',
                step5_etymology: json.step5_etymology ?? null,
                recommended_version: json.recommended_version ?? 'casual',
                card_id: json.card_id ?? null,
              },
            })
          }
          if (json.type === 'error') dispatch({ type: 'ERROR', message: json.message })
        }
      }
    } catch {
      dispatch({ type: 'ERROR', message: '네트워크 연결을 확인하고 다시 시도해 주세요.' })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <header
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[56px] flex items-center justify-between px-4 z-10"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <span className="text-white text-h2 font-bold">毎日</span>
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
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {state.messages.map((msg) => {
          if (msg.kind === 'correction') {
            return (
              <div
                key={msg.id}
                className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: '#fef6ec', border: '1px solid #f5d4a3' }}
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
            const verLabel = msg.data.recommended_version === 'casual' ? '구어체' : msg.data.recommended_version === 'polite' ? '정중체' : '격식체'
            return (
              <div key={msg.id} className="flex items-end gap-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  🎎
                </div>
                <div
                  className="flex-1 rounded-2xl rounded-bl-sm overflow-hidden"
                  style={{ backgroundColor: 'var(--bubble-ai)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  {/* 스텝 뱃지 */}
                  <div className="flex items-center gap-1 px-3 pt-3 pb-1 flex-wrap">
                    {['구조', '번역', '문법', '문화', '어원'].map((label, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                      >
                        ✓ {label}
                      </span>
                    ))}
                  </div>
                  {/* 추천 번역 */}
                  <div className="px-3 pb-1">
                    <p className="text-[10px] text-[var(--text-tertiary)]">{verLabel} (추천)</p>
                    <p className="font-jp text-body-md font-medium text-[var(--text-primary)]">{rec}</p>
                  </div>
                  {/* 전체 보기 버튼 */}
                  <button
                    onClick={() => setResultModal(msg.data)}
                    className="w-full py-2 text-center text-caption font-medium active:opacity-60"
                    style={{
                      borderTop: '1px solid var(--color-hairline)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    번역 전체 보기 →
                  </button>
                </div>
              </div>
            )
          }

          if (msg.kind === 'loading') {
            return (
              <div key={msg.id} className="flex items-end gap-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  🎎
                </div>
                <div
                  className="px-4 py-2.5 rounded-2xl rounded-bl-sm"
                  style={{ backgroundColor: 'var(--bubble-ai)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  <StepIndicator currentStep={state.currentStep} />
                  <p className="text-caption text-[var(--text-tertiary)] mt-1">
                    번역 결과를 준비하고 있어요
                  </p>
                </div>
              </div>
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

      {/* 입력창 */}
      <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-full max-w-[390px]">
        <InputBar onSubmit={handleSubmit} disabled={state.isLoading} />
      </div>

      {/* 번역 결과 풀스크린 */}
      {resultModal && (
        <TranslationResult data={resultModal} onClose={() => setResultModal(null)} />
      )}
    </div>
  )
}
