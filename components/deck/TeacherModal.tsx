'use client'

import { useEffect, useState } from 'react'
import { Card, SentencePayload } from '@/types'

interface TeacherModalProps {
  card: Card
  onClose: () => void
}

export default function TeacherModal({ card, onClose }: TeacherModalProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const payload = card.payload as SentencePayload

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        const res = await fetch('/api/teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            korean_input: payload.korean_input,
            step2_versions: payload.step2_versions,
            step3_grammar: payload.step3_grammar,
            step4_culture: payload.step4_culture,
            recommended_version: payload.recommended_version,
          }),
        })

        if (!res.ok || !res.body) {
          setText('설명을 불러오지 못했어요. 다시 시도해 주세요.')
          setLoading(false)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setText((prev) => prev + decoder.decode(value, { stream: true }))
        }
        setLoading(false)
      } catch {
        setText('설명을 불러오지 못했어요. 다시 시도해 주세요.')
        setLoading(false)
      }
    }

    fetchExplanation()
  }, [payload.korean_input, payload.step2_versions, payload.step3_grammar, payload.step4_culture, payload.recommended_version])

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl overflow-y-auto max-h-[80vh] pb-[34px]"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-hairline)' }} />
        </div>

        <div className="px-5 py-3 flex flex-col gap-4">
          {/* Haru 헤더 */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: '#e8e0d4' }}
            >
              👩‍🏫
            </div>
            <div>
              <p className="text-body font-medium">하루 선생님</p>
              <p className="text-caption text-[var(--text-tertiary)] line-clamp-1">
                &ldquo;{payload.korean_input}&rdquo;
              </p>
            </div>
          </div>

          {/* 설명 영역 */}
          <div
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
          >
            {loading ? (
              <div className="flex items-center gap-1 py-1">
                <span className="animate-bounce text-[var(--color-accent)] text-lg" style={{ animationDelay: '0ms' }}>·</span>
                <span className="animate-bounce text-[var(--color-accent)] text-lg" style={{ animationDelay: '150ms' }}>·</span>
                <span className="animate-bounce text-[var(--color-accent)] text-lg" style={{ animationDelay: '300ms' }}>·</span>
              </div>
            ) : (
              <p className="text-body leading-relaxed whitespace-pre-wrap text-[var(--text-primary)]">
                {text}
              </p>
            )}
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-body font-medium text-[var(--text-secondary)] active:opacity-70"
            style={{ backgroundColor: 'var(--color-tag-bg)' }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
