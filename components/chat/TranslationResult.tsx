'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Volume2 } from 'lucide-react'
import TeacherModal from '@/components/deck/TeacherModal'
import DarumaAvatar from '@/components/ui/DarumaAvatar'
import { Card, CorrectionItem, SentencePayload } from '@/types'

export interface TranslationResultData {
  input_kr: string
  mode?: 'text' | 'image'
  step0_cultural: { needs_correction: boolean; correction_items: CorrectionItem[] }
  step1_structure: { korean: string; japanese: string; reading?: string; pronunciation?: string }[]
  step2_versions: { casual: string; polite: string; formal: string }
  step2_readings?: { casual?: string; polite?: string; formal?: string }
  step2_pronunciations?: { casual?: string; polite?: string; formal?: string }
  step3_grammar: { point_name: string; explanation: string; examples?: string[] }[]
  step4_culture: string
  step5_etymology: { kanji: string; reading: string; story: string; mnemonic?: string } | null
  recommended_version: string
  card_id: string | null
}

interface TranslationResultProps {
  data: TranslationResultData
  onClose: () => void
}

const VERSION_LABEL: Record<string, string> = {
  casual: '구어체',
  polite: '정중체',
  formal: '격식체',
}

const STEP_LABELS = ['구조', '번역', '문법', '문화', '어원']

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function TranslationResult({ data, onClose }: TranslationResultProps) {
  const [showTeacher, setShowTeacher] = useState(false)
  const router = useRouter()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isImageMode = data.mode === 'image'
  const rec = data.recommended_version as keyof typeof data.step2_versions
  const hasCorrectionItems = data.step0_cultural.needs_correction && data.step0_cultural.correction_items.length > 0

  // Synthesize a minimal Card for TeacherModal
  const cardForTeacher: Card = {
    id: data.card_id ?? '__preview__',
    user_id: '',
    card_type: 'sentence',
    learning_status: 'learning',
    has_real_use: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payload: {
      korean_input: data.input_kr,
      step0_cultural: data.step0_cultural,
      step1_structure: data.step1_structure,
      step2_versions: data.step2_versions,
      step3_grammar: data.step3_grammar,
      step4_culture: data.step4_culture,
      step5_etymology: data.step5_etymology,
      recommended_version: data.recommended_version as 'casual' | 'polite' | 'formal',
      has_mnemonic: !!data.step5_etymology,
    } as SentencePayload,
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* 헤더 */}
      <div
        className="flex items-center px-4 h-[56px] flex-shrink-0"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <button onClick={onClose} className="mr-3 text-white active:opacity-60">
          <ChevronLeft size={24} color="#fff" />
        </button>
        <span className="text-white text-h2 font-bold">毎日</span>
        <span className="text-white/70 text-body ml-2">My Niche</span>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto pb-[48px]">
        {/* 완료 배너 */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <DarumaAvatar size={32} expression="explain" className="flex-shrink-0" />
            <p className="text-body font-medium text-[var(--text-primary)]">AI-Nichi가 번역 완료했어요!</p>
          </div>

          {/* 스텝 완료 뱃지 */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
              >
                ✓ STEP{i + 1} {label}
              </span>
            ))}
          </div>
        </div>

        <div className="px-5 flex flex-col gap-5">
          {/* 원문 */}
          <div className="text-caption text-[var(--text-tertiary)]">
            {data.mode === 'image' ? '추출된 일본어: ' : '원문: '}
            <span className={`${data.mode === 'image' ? 'font-jp font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
              &ldquo;{data.input_kr}&rdquo;
            </span>
          </div>

          {/* STEP 0: 문화 표현 교정 */}
          {hasCorrectionItems && (
            <section>
              <StepHeader step={0} label="문화 표현 교정" color="var(--color-cultural)" />
              <div
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-cultural-bg)', border: '1px solid var(--color-cultural-border)' }}
              >
                {data.step0_cultural.correction_items.map((item, i) => (
                  <div key={i} className={i > 0 ? 'mt-3 pt-3 border-t border-[var(--color-cultural-border)]' : ''}>
                    <p className="text-body font-medium">&ldquo;{item.detected}&rdquo;</p>
                    <p className="text-caption text-[var(--text-secondary)] mt-0.5">{item.issue}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* STEP 1: 문장 구조 */}
          {data.step1_structure?.length > 0 && (
            <section>
              <StepHeader step={1} label={isImageMode ? '구조 분석' : '문장 구조'} color="var(--color-accent)" />
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-hairline)' }}>
                {data.step1_structure.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center px-4 py-2.5"
                    style={{
                      backgroundColor: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                      borderBottom: i < data.step1_structure.length - 1 ? '1px solid var(--color-hairline)' : undefined,
                    }}
                  >
                    {isImageMode ? (
                      <>
                        <div className="flex-1">
                          <p className="text-body font-jp">{item.japanese}</p>
                          {item.reading && (
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{item.reading}</p>
                          )}
                          {item.pronunciation && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-accent)' }}>{item.pronunciation}</p>
                          )}
                        </div>
                        <span className="text-caption text-[var(--text-tertiary)] mx-3">→</span>
                        <span className="flex-1 text-caption text-[var(--text-secondary)] text-right">{item.korean}</span>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-caption text-[var(--text-secondary)]">{item.korean}</span>
                        <span className="text-caption text-[var(--text-tertiary)] mx-3">→</span>
                        <div className="flex-1 text-right">
                          <p className="text-body font-jp">{item.japanese}</p>
                          {item.reading && (
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{item.reading}</p>
                          )}
                          {item.pronunciation && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-accent)' }}>{item.pronunciation}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* STEP 2: 번역 버전 / 이미지 모드 한국어 번역 */}
          {data.step2_versions && (
            <section>
              <StepHeader step={2} label={isImageMode ? '한국어 번역' : '번역 버전'} color="var(--color-accent)" />
              <div className="flex flex-col gap-2">
                {(isImageMode ? ['casual'] as const : ['casual', 'polite', 'formal'] as const).map((key) => {
                  const val = data.step2_versions[key]
                  if (!val) return null
                  const isRec = key === rec
                  const reading = data.step2_readings?.[key]
                  const pronunciation = data.step2_pronunciations?.[key]
                  return (
                    <div
                      key={key}
                      className="rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: isRec ? 'var(--color-primary)' : 'var(--color-surface)',
                        border: '1px solid var(--color-hairline)',
                      }}
                    >
                      {!isImageMode && (
                        <p
                          className="text-caption mb-1"
                          style={{ color: isRec ? 'rgba(255,255,255,0.65)' : 'var(--text-tertiary)' }}
                        >
                          {VERSION_LABEL[key]}{isRec ? ' (추천)' : ''}
                        </p>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={`${isImageMode ? '' : 'font-jp'} text-body-md`}
                            style={{ color: isRec ? '#fff' : 'var(--text-primary)' }}
                          >
                            {val}
                          </p>
                          {reading && (
                            <p className="text-[11px] mt-1 leading-relaxed font-jp" style={{ color: isRec ? 'rgba(255,255,255,0.55)' : 'var(--text-tertiary)' }}>
                              {reading}
                            </p>
                          )}
                          {pronunciation && (
                            <p className="text-[11px] mt-0.5 leading-relaxed font-medium" style={{ color: isRec ? 'rgba(255,255,255,0.75)' : 'var(--color-accent)' }}>
                              {pronunciation}
                            </p>
                          )}
                        </div>
                        {!isImageMode && (
                          <button
                            onClick={() => speak(val)}
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center active:opacity-60 mt-0.5"
                            style={{ backgroundColor: isRec ? 'rgba(255,255,255,0.18)' : 'var(--color-tag-bg)' }}
                          >
                            <Volume2 size={14} color={isRec ? '#fff' : 'var(--text-secondary)'} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* STEP 3: 문법 포인트 */}
          {data.step3_grammar?.length > 0 && (
            <section>
              <StepHeader step={3} label="문법 포인트" color="var(--color-accent)" />
              <div className="flex flex-col gap-3">
                {data.step3_grammar.map((g, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
                  >
                    <p className="text-body font-medium">{g.point_name}</p>
                    <p className="text-caption text-[var(--text-secondary)] mt-1 leading-relaxed">{g.explanation}</p>
                    {g.examples?.length ? (
                      <div className="mt-2 flex flex-col gap-0.5">
                        {g.examples.map((ex, j) => (
                          <p key={j} className="text-caption font-jp text-[var(--text-tertiary)]">· {ex}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* STEP 4: 문화 맥락 */}
          {data.step4_culture && (
            <section>
              <StepHeader step={4} label="문화 맥락" color="var(--color-cultural)" />
              <div
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-cultural-bg)', border: '1px solid var(--color-cultural-border)' }}
              >
                <p className="text-caption text-[var(--text-secondary)] leading-relaxed">{data.step4_culture}</p>
              </div>
            </section>
          )}

          {/* STEP 5: 어원 이야기 */}
          {data.step5_etymology && (
            <section>
              <StepHeader step={5} label="어원 이야기" color="var(--color-mnemonic)" />
              <div
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-mnemonic-bg)', border: '1px solid var(--color-mnemonic-border)' }}
              >
                <div className="flex items-start gap-3">
                  <p className="font-jp text-[32px] font-bold leading-none" style={{ color: 'var(--color-mnemonic)' }}>
                    {data.step5_etymology.kanji}
                  </p>
                  <div className="flex-1">
                    <p className="text-caption text-[var(--color-mnemonic)] font-medium">{data.step5_etymology.reading}</p>
                    <p className="text-caption text-[var(--text-secondary)] mt-1 leading-relaxed">{data.step5_etymology.story}</p>
                    {data.step5_etymology.mnemonic && (
                      <p className="text-caption mt-2 font-medium" style={{ color: 'var(--color-mnemonic)' }}>
                        💡 {data.step5_etymology.mnemonic}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 하루 선생님 */}
          <button
            onClick={() => setShowTeacher(true)}
            className="w-full rounded-2xl py-3 text-body font-medium flex items-center justify-center gap-2 active:opacity-70"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
          >
            👩‍🏫 하루 선생님께 물어보기
          </button>

          {/* 카드 저장 상태 */}
          {data.card_id ? (
            <button
              onClick={() => { onClose(); router.push('/deck') }}
              className="rounded-2xl px-4 py-3 flex items-center justify-between w-full active:opacity-70"
              style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}
            >
              <p className="text-caption font-medium" style={{ color: 'var(--color-success-text)' }}>
                💾 My Deck에 저장됐어요
              </p>
              <span className="text-caption font-medium" style={{ color: 'var(--color-success-text)' }}>내 덱 보기 →</span>
            </button>
          ) : (
            <div
              className="rounded-2xl px-4 py-3"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
            >
              <p className="text-caption text-[var(--text-tertiary)]">로그인하면 카드로 저장됩니다</p>
            </div>
          )}
        </div>
      </div>

      {showTeacher && (
        <TeacherModal card={cardForTeacher} onClose={() => setShowTeacher(false)} />
      )}
    </div>
  )
}

function StepHeader({ step, label, color }: { step: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span
        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: color, color: '#fff' }}
      >
        STEP {step}
      </span>
      <p className="text-caption font-medium text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}
