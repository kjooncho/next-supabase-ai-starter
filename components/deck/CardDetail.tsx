'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import MasteryBadge from '@/components/ui/MasteryBadge'
import TeacherModal from '@/components/deck/TeacherModal'
import RealUseForm from '@/components/deck/RealUseForm'
import { Card, SentencePayload, getMasteryStage } from '@/types'
import { createBrowserSupabase } from '@/lib/supabase'

interface CardDetailProps {
  card: Card
  onClose: () => void
  onUpdate: (card: Card) => void
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function CardDetail({ card, onClose, onUpdate }: CardDetailProps) {
  const payload = card.payload as SentencePayload
  const stage = getMasteryStage(card.learning_status, card.has_real_use)
  const [showTeacher, setShowTeacher] = useState(false)
  const [showRealUse, setShowRealUse] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleMastered = async () => {
    const supabase = createBrowserSupabase()
    const newStatus = card.learning_status === 'mastered' ? 'learning' : 'mastered'
    await supabase
      .from('cards')
      .update({ learning_status: newStatus })
      .eq('id', card.id)
    onUpdate({ ...card, learning_status: newStatus })
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl overflow-y-auto max-h-[85vh] pb-[34px]"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-hairline)' }} />
        </div>

        <div className="px-5 py-3 flex flex-col gap-5">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-caption text-[var(--text-tertiary)]">원문</p>
              <p className="text-body-md font-medium mt-0.5">{payload.korean_input}</p>
            </div>
            <MasteryBadge stage={stage} size="md" />
          </div>

          {/* STEP 1: 구조 대응표 */}
          {payload.step1_structure?.length > 0 && (
            <section>
              <p className="text-caption text-[var(--color-accent)] font-medium mb-2">구조 대응</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-hairline)' }}>
                {payload.step1_structure.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center px-4 py-2"
                    style={{
                      backgroundColor: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                      borderBottom: i < payload.step1_structure.length - 1 ? '1px solid var(--color-hairline)' : undefined,
                    }}
                  >
                    <span className="flex-1 text-caption text-[var(--text-secondary)]">{item.korean}</span>
                    <span className="text-caption text-[var(--text-tertiary)] mx-2">→</span>
                    <span className="flex-1 text-caption font-jp text-right">{item.japanese}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* STEP 2: 번역 3버전 */}
          {payload.step2_versions && (
            <section>
              <p className="text-caption text-[var(--color-accent)] font-medium mb-2">번역</p>
              <div className="flex flex-col gap-2">
                {Object.entries(payload.step2_versions).map(([key, val]) => {
                  const isRec = key === payload.recommended_version
                  return (
                    <div
                      key={key}
                      className="rounded-xl px-4 py-2.5"
                      style={{
                        backgroundColor: isRec ? 'var(--color-primary)' : 'var(--color-surface)',
                        border: '1px solid var(--color-hairline)',
                      }}
                    >
                      <p
                        className="text-caption mb-0.5"
                        style={{ color: isRec ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)' }}
                      >
                        {key === 'casual' ? '구어체' : key === 'polite' ? '정중체' : '격식체'}
                        {isRec && ' (추천)'}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="font-jp text-body-md flex-1"
                          style={{ color: isRec ? '#fff' : 'var(--text-primary)' }}
                        >
                          {val}
                        </p>
                        <button
                          onClick={() => speak(val)}
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center active:opacity-60"
                          style={{ backgroundColor: isRec ? 'rgba(255,255,255,0.15)' : 'var(--color-tag-bg)' }}
                          aria-label="발음 듣기"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M11 5L6 9H2v6h4l5 4V5z" fill={isRec ? '#fff' : 'var(--text-secondary)'} />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke={isRec ? '#fff' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* STEP 3: 문법 */}
          {payload.step3_grammar?.length > 0 && (
            <section>
              <p className="text-caption text-[var(--color-accent)] font-medium mb-2">문법</p>
              {payload.step3_grammar.map((g, i) => (
                <div key={i} className="mb-3">
                  <p className="text-body font-medium">{g.point_name}</p>
                  <p className="text-caption text-[var(--text-secondary)] mt-0.5">{g.explanation}</p>
                  {g.examples?.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {g.examples.map((ex, j) => (
                        <p key={j} className="text-caption font-jp text-[var(--text-tertiary)]">
                          · {ex}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* STEP 4: 문화 맥락 */}
          {payload.step4_culture && (
            <section
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: '#fef6ec' }}
            >
              <p className="text-caption font-medium mb-1" style={{ color: 'var(--color-cultural)' }}>
                💡 문화 맥락
              </p>
              <p className="text-caption text-[var(--text-secondary)] leading-relaxed">
                {payload.step4_culture}
              </p>
            </section>
          )}

          {/* STEP 5: 니모닉 */}
          {payload.step5_etymology && (
            <section
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: '#f0e9f4' }}
            >
              <p className="text-caption font-medium mb-1" style={{ color: 'var(--color-mnemonic)' }}>
                💡 니모닉
              </p>
              <p className="font-jp text-body-md font-medium">{payload.step5_etymology.kanji}</p>
              <p className="text-caption text-[var(--text-secondary)] mt-1 leading-relaxed">
                {payload.step5_etymology.story}
              </p>
              {payload.step5_etymology.mnemonic && (
                <p className="text-caption mt-1" style={{ color: 'var(--color-mnemonic)' }}>
                  {payload.step5_etymology.mnemonic}
                </p>
              )}
            </section>
          )}

          {/* 선생님께 물어보기 */}
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowTeacher(true)}
          >
            👩‍🏫 하루 선생님께 물어보기
          </Button>

          {/* 마스터리 액션 버튼 */}
          <div className="flex gap-2">
            <Button
              variant={card.learning_status === 'mastered' ? 'secondary' : 'primary'}
              fullWidth
              onClick={handleMastered}
            >
              {card.learning_status === 'mastered' ? '✓ 숙달완료' : '숙달완료 표시'}
            </Button>
            <Button
              variant="realUse"
              fullWidth
              onClick={() => setShowRealUse(true)}
            >
              {card.has_real_use ? '✓ 써봤어요' : '써봤어요'}
            </Button>
          </div>
        </div>
      </div>

      {showTeacher && (
        <TeacherModal card={card} onClose={() => setShowTeacher(false)} />
      )}
      {showRealUse && (
        <RealUseForm
          card={card}
          onClose={() => setShowRealUse(false)}
          onSave={(updated) => { onUpdate(updated); setShowRealUse(false) }}
        />
      )}
    </div>
  )
}
