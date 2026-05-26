'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, ChevronLeft } from 'lucide-react'
import { TEACHER_QUESTIONS, TeacherQuestion } from '@/lib/teacherQuestions'
import { createBrowserSupabase } from '@/lib/supabase'
import { Card, SentencePayload } from '@/types'

function makeCardQuestion(card: Card): TeacherQuestion | null {
  if (card.card_type !== 'sentence') return null
  const p = card.payload as SentencePayload
  const versions = p.step2_versions
  if (!versions) return null
  const rec = p.recommended_version
  const others = (['casual', 'polite', 'formal'] as const).filter((k) => k !== rec && versions[k])
  if (others.length === 0) return null
  const other = others[0]
  const label = { casual: '구어체', polite: '정중체', formal: '격식체' }
  return {
    id: `card-${card.id}`,
    topic: p.korean_input,
    tags: ['#내카드', `#${label[rec]}`],
    expression_a: versions[rec],
    expression_b: versions[other],
    haru_question_jp: `「${versions[rec]}」と「${versions[other]}」、どんな違いがありますか？先生、教えてください！😊`,
    hint: `${label[rec]}는 ${rec === 'casual' ? '친한 사이에서' : rec === 'polite' ? '일반적인 정중한 상황에서' : '공식적인 자리에서'} 씁니다.`,
  }
}

interface Message {
  from: 'haru' | 'user'
  text: string
}

interface QuestionSessionProps {
  q: TeacherQuestion
  qIndex: number
  total: number
  masteryProgress: number
  onUnderstood: () => void
  onNext: () => void
}

function QuestionSession({ q, qIndex, total, masteryProgress, onUnderstood, onNext }: QuestionSessionProps) {
  const [messages, setMessages] = useState<Message[]>([{ from: 'haru', text: q.haru_question_jp }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hintsLeft, setHintsLeft] = useState(2)
  const [understood, setUnderstood] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const answer = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { from: 'user', text: answer }])
    setLoading(true)

    const res = await fetch('/api/teacher-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: q.topic,
        expression_a: q.expression_a,
        expression_b: q.expression_b,
        haru_question: q.haru_question_jp,
        user_answer: answer,
        mode: 'evaluate',
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessages((prev) => [...prev, { from: 'haru', text: `오류: ${data.error ?? '잠시 후 다시 시도해주세요'}` }])
      setLoading(false)
      return
    }
    setMessages((prev) => [...prev, { from: 'haru', text: data.haru_response }])
    setLoading(false)

    if (data.understood) {
      setUnderstood(true)
      onUnderstood()
    }
  }

  const handleHint = async () => {
    if (hintsLeft <= 0 || loading) return
    setHintsLeft((h) => h - 1)
    setLoading(true)
    const res = await fetch('/api/teacher-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression_a: q.expression_a, expression_b: q.expression_b, mode: 'hint' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setHintsLeft((h) => h + 1) // 실패 시 힌트 횟수 복구
      setMessages((prev) => [...prev, { from: 'haru', text: `오류: ${data.error ?? '잠시 후 다시 시도해주세요'}` }])
      setLoading(false)
      return
    }
    setMessages((prev) => [...prev, { from: 'haru', text: `💡 힌트: ${data.hint}` }])
    setLoading(false)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[152px]">
      {/* 오늘의 주제 카드 */}
      <div className="rounded-2xl px-4 py-4 mb-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}>
        <p className="text-[11px] text-[var(--text-tertiary)] mb-1">오늘 주제:</p>
        <p className="font-jp text-body-md font-bold text-[var(--text-primary)]">{q.topic}</p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {q.tags.map((tag) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-tag-bg)', color: 'var(--text-tertiary)' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 하루 + 대화 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2" style={{ backgroundColor: 'var(--color-mnemonic-bg)', borderColor: 'var(--color-mnemonic)' }}>
            🧑‍🎓
          </div>
          <span className="text-[9px] text-[var(--text-tertiary)] font-medium">하루(Haru)</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-2xl px-4 py-3 ${msg.from === 'user' ? 'rounded-tr-sm ml-8' : 'rounded-tl-sm'}`}
              style={{
                backgroundColor: msg.from === 'user' ? 'var(--color-primary)' : 'var(--bubble-ai)',
                border: msg.from === 'user' ? 'none' : '1px solid var(--color-hairline)',
              }}
            >
              <p className={`text-caption leading-relaxed ${msg.from === 'haru' ? 'font-jp' : ''}`} style={{ color: msg.from === 'user' ? '#fff' : 'var(--text-secondary)' }}>
                {msg.text}
              </p>
            </div>
          ))}
          {loading && (
            <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ backgroundColor: 'var(--bubble-ai)', border: '1px solid var(--color-hairline)' }}>
              <p className="text-caption text-[var(--text-tertiary)]">하루가 생각 중…</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {understood && (
        <div className="rounded-xl px-4 py-3 mb-3 flex items-center gap-2" style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
          <span className="text-lg">✅</span>
          <p className="text-caption font-medium" style={{ color: 'var(--color-success-text)' }}>하루가 이해했어요! 다음 질문으로 넘어가세요</p>
        </div>
      )}

      {!understood && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">💡</span>
          <span className="text-caption text-[var(--text-tertiary)]">힌트:</span>
          <div className="flex gap-1">
            {[0, 1].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i < hintsLeft ? 'var(--color-accent)' : 'var(--color-hairline)' }} />
            ))}
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)]">({hintsLeft}회 남음)</span>
          <button onClick={handleHint} disabled={hintsLeft <= 0 || loading} className="ml-auto text-caption font-medium active:opacity-70 disabled:opacity-40" style={{ color: 'var(--color-accent)' }}>
            힌트 보기
          </button>
        </div>
      )}

      {/* 숙달 진행률 */}
      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span>⭐</span>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">이 카드 숙달까지:</span>
          </div>
          <span className="text-[11px] font-bold" style={{ color: 'var(--color-accent)' }}>{masteryProgress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-hairline)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${masteryProgress}%`, backgroundColor: 'var(--color-accent)' }} />
        </div>
        {masteryProgress >= 80 && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-accent)' }}>한 번 더 설명하면 ★ 숙달완료</p>
        )}
      </div>

      {/* 하단 입력 */}
      <div className="fixed bottom-[84px] inset-x-0 px-4 py-3" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-hairline)' }}>
        {understood ? (
          <button onClick={onNext} className="w-full py-3 rounded-xl text-body font-medium text-white active:opacity-70" style={{ backgroundColor: 'var(--color-primary)' }}>
            {qIndex + 1 >= total ? '수업 완료 🎉' : '다음 질문 →'}
          </button>
        ) : (
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="일본어 또는 한국어로 설명해주세요"
              className="flex-1 px-3 py-2.5 rounded-xl text-caption resize-none outline-none"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--text-primary)', maxHeight: 80 }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:opacity-70 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Send size={18} color="#fff" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeacherPage() {
  const router = useRouter()
  const [qIndex, setQIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [masteryProgress, setMasteryProgress] = useState(60)
  const [questions, setQuestions] = useState<TeacherQuestion[]>(TEACHER_QUESTIONS)
  const [loadingCards, setLoadingCards] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoadingCards(false); return }
      const { data: rows } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('learning_status', 'learning')
        .order('created_at', { ascending: false })
        .limit(20)
      if (rows && rows.length > 0) {
        const cardQs = (rows as Card[]).map(makeCardQuestion).filter(Boolean) as TeacherQuestion[]
        if (cardQs.length >= 3) {
          setQuestions(cardQs.slice(0, 8))
        }
      }
      setLoadingCards(false)
    })
  }, [])

  const total = questions.length
  const q = questions[qIndex]

  if (loadingCards) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-body text-[var(--text-tertiary)]">카드 불러오는 중…</p>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <span className="text-5xl">🎓</span>
        <div>
          <p className="text-h2 font-bold" style={{ color: 'var(--text-primary)' }}>복습할 카드가 없어요</p>
          <p className="text-body mt-2" style={{ color: 'var(--text-secondary)' }}>
            채팅 탭에서 표현을 저장하면<br />선생님이 퀴즈를 내드려요
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-xl text-body font-medium text-white active:opacity-80"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          채팅 탭으로 이동
        </button>
      </div>
    )
  }

  const handleUnderstood = async () => {
    const next = Math.min(masteryProgress + 20, 100)
    setMasteryProgress(next)
    if (next >= 100 && q.id.startsWith('card-')) {
      const cardId = q.id.replace('card-', '')
      const supabase = createBrowserSupabase()
      await supabase.from('cards').update({ learning_status: 'mastered' }).eq('id', cardId)
    }
  }

  const handleNext = () => {
    if (qIndex + 1 >= total) {
      setDone(true)
    } else {
      setQIndex((i) => i + 1)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6">
        <span className="text-6xl">🎉</span>
        <div>
          <p className="text-h2 font-bold text-[var(--text-primary)]">오늘 수업 완료!</p>
          <p className="text-body text-[var(--text-secondary)] mt-2">{total}개 표현을 모두 설명했어요</p>
        </div>
        <div className="rounded-2xl px-5 py-4 w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}>
          <p className="text-caption text-[var(--text-tertiary)] mb-2">오늘 숙달 진행률</p>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-hairline)' }}>
            <div className="h-full rounded-full" style={{ width: `${masteryProgress}%`, backgroundColor: 'var(--color-accent)' }} />
          </div>
          <p className="text-body-md font-bold mt-2" style={{ color: 'var(--color-accent)' }}>{masteryProgress}%</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button onClick={() => router.back()} className="w-full py-3 rounded-xl text-body font-medium text-white active:opacity-80" style={{ backgroundColor: 'var(--color-primary)' }}>
            내 카드로 돌아가기
          </button>
          <button
            onClick={() => { setDone(false); setQIndex(0); setMasteryProgress(60) }}
            className="w-full py-3 rounded-xl text-body font-medium active:opacity-70"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--text-secondary)' }}
          >
            다시 풀기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="fixed top-0 inset-x-0 z-10" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="flex items-center px-4 h-[56px] gap-3">
          <button onClick={() => router.back()} className="text-white active:opacity-60">
            <ChevronLeft size={24} color="#fff" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-white text-xl">🎓</span>
              <div>
                <span className="text-white text-body font-bold">선생님 모드</span>
                {questions[0]?.id.startsWith('card-') && (
                  <p className="text-white/60 text-[10px] mt-0.5">내 카드 기반</p>
                )}
              </div>
            </div>
            <span className="text-white/70 text-caption">{qIndex + 1}/{total} 질문</span>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full transition-all duration-500" style={{ width: `${((qIndex) / total) * 100}%`, backgroundColor: '#f39c12' }} />
        </div>
      </div>

      <QuestionSession
        key={qIndex}
        q={q}
        qIndex={qIndex}
        total={total}
        masteryProgress={masteryProgress}
        onUnderstood={handleUnderstood}
        onNext={handleNext}
      />
    </div>
  )
}
