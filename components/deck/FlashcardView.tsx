'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { Card, SentencePayload, EpisodePayload, getMasteryStage } from '@/types'
import { createBrowserSupabase } from '@/lib/supabase'
import RealUseForm from './RealUseForm'

interface FlashcardViewProps {
  cards: Card[]
  initialIndex?: number
  onClose: () => void
  onUpdate: (updated: Card) => void
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function FlashcardView({ cards, initialIndex = 0, onClose, onUpdate }: FlashcardViewProps) {
  const [index, setIndex] = useState(initialIndex)
  const [showRealUse, setShowRealUse] = useState(false)
  const [saving, setSaving] = useState(false)

  const card = cards[index]
  const stage = getMasteryStage(card.learning_status, card.has_real_use)

  const go = (dir: -1 | 1) => {
    const next = index + dir
    if (next >= 0 && next < cards.length) setIndex(next)
  }

  const handleMastered = async () => {
    setSaving(true)
    const supabase = createBrowserSupabase()
    const newStatus = card.learning_status === 'mastered' ? 'learning' : 'mastered'
    await supabase.from('cards').update({ learning_status: newStatus }).eq('id', card.id)
    const updated = { ...card, learning_status: newStatus as 'learning' | 'mastered' }
    onUpdate(updated)
    setSaving(false)
    if (index < cards.length - 1) setIndex(index + 1)
  }

  const isEpisode = card.card_type === 'episode'

  // Episode card content
  let mainJp = ''
  let reading = ''
  let pronunciation = ''
  let korean = ''
  let contextLabel = ''

  if (isEpisode) {
    const p = card.payload as EpisodePayload
    const d = p.dialogue[0] as { japanese: string; reading?: string; pronunciation?: string; korean: string }
    mainJp = d?.japanese ?? ''
    reading = d?.reading ?? ''
    pronunciation = d?.pronunciation ?? ''
    korean = d?.korean ?? ''
    contextLabel = p.title_kr
  } else {
    const payload = card.payload as SentencePayload
    mainJp = payload.step2_versions?.[payload.recommended_version] ?? ''
    reading = payload.step5_etymology?.reading ?? ''
    contextLabel = payload.korean_input
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 h-[56px] flex-shrink-0"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <button onClick={onClose} className="text-white active:opacity-60">
          <ChevronLeft size={24} color="#fff" />
        </button>
        <span className="text-white text-body font-medium">{index + 1} / {cards.length}</span>
        <div className="w-6" />
      </div>

      {/* 진행 바 */}
      <div className="h-1 flex-shrink-0" style={{ backgroundColor: 'var(--color-hairline)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${((index + 1) / cards.length) * 100}%`, backgroundColor: 'var(--color-accent)' }}
        />
      </div>

      {/* 카드 본문 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
        {/* 컨텍스트 레이블 */}
        <p className="text-caption text-[var(--text-tertiary)] text-center">{contextLabel}</p>

        {/* 메인 카드 */}
        <div
          className="rounded-3xl px-6 py-8 flex flex-col items-center gap-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
        >
          {isEpisode && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#f0e9f4', color: 'var(--color-mnemonic)' }}>
              생활 표현
            </span>
          )}
          {!isEpisode && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
              {(card.payload as SentencePayload).recommended_version === 'casual' ? '구어체' : (card.payload as SentencePayload).recommended_version === 'polite' ? '정중체' : '격식체'}
            </span>
          )}

          {/* 메인 번역 */}
          <div className="flex items-center gap-3">
            <p className="font-jp text-[32px] font-bold text-center text-[var(--text-primary)]">{mainJp}</p>
            <button
              onClick={() => speak(mainJp)}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:opacity-60"
              style={{ backgroundColor: 'var(--color-tag-bg)' }}
            >
              <Volume2 size={16} color="var(--text-secondary)" />
            </button>
          </div>

          {/* 요미가나 + 한국어 발음 */}
          {reading && (
            <p className="text-caption text-[var(--text-tertiary)] text-center">({reading})</p>
          )}
          {pronunciation && (
            <p className="text-caption text-center" style={{ color: 'var(--color-accent)' }}>{pronunciation}</p>
          )}

          {/* episode 카드: 한국어 뜻 */}
          {isEpisode && korean && (
            <p className="text-body text-[var(--text-secondary)] text-center mt-1">{korean}</p>
          )}
        </div>

        {/* sentence 카드: 구조 대응 */}
        {!isEpisode && (() => {
          const p = card.payload as SentencePayload
          return (
            <>
              {p.step1_structure?.length > 0 && (
                <div>
                  <p className="text-caption text-[var(--color-accent)] font-medium mb-1.5">구조</p>
                  <div className="flex flex-wrap gap-2">
                    {p.step1_structure.map((item, i) => (
                      <div key={i} className="rounded-lg px-3 py-1.5 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}>
                        <p className="text-[10px] text-[var(--text-tertiary)]">{item.korean}</p>
                        <p className="font-jp text-caption font-medium">{item.japanese}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {p.step3_grammar?.[0] && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}>
                  <p className="text-caption font-medium">{p.step3_grammar[0].point_name}</p>
                  <p className="text-caption text-[var(--text-secondary)] mt-0.5 leading-relaxed">{p.step3_grammar[0].explanation}</p>
                  {p.step3_grammar[0].examples?.[0] && (
                    <p className="text-caption font-jp text-[var(--text-tertiary)] mt-1">· {p.step3_grammar[0].examples[0]}</p>
                  )}
                </div>
              )}
            </>
          )
        })()}

        {/* 마스터리 단계 */}
        <div className="flex items-center justify-center gap-2">
          {['learning', 'mastered', 'real-use', 'conquered'].map((s) => (
            <div key={s} className="w-2 h-2 rounded-full" style={{ backgroundColor: stage === s ? 'var(--color-accent)' : 'var(--color-hairline)' }} />
          ))}
          <p className="text-[10px] text-[var(--text-tertiary)] ml-1">
            {stage === 'learning' ? '학습중' : stage === 'mastered' ? '숙달완료' : stage === 'real-use' ? '써봤어요' : '완전정복'}
          </p>
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="px-5 pb-[34px] flex flex-col gap-2 flex-shrink-0" style={{ borderTop: '1px solid var(--color-hairline)' }}>
        <div className="flex items-center justify-between py-2">
          <button onClick={() => go(-1)} disabled={index === 0} className="flex items-center gap-1 text-caption text-[var(--text-secondary)] disabled:opacity-30 active:opacity-60">
            <ChevronLeft size={16} />
            이전
          </button>
          {!isEpisode && (
            <button
              onClick={() => setShowRealUse(true)}
              className="text-caption font-medium px-4 py-1.5 rounded-full active:opacity-70"
              style={{ backgroundColor: 'var(--color-tag-bg)', color: 'var(--text-secondary)' }}
            >
              써봤어요 ✍️
            </button>
          )}
          {isEpisode && <div className="w-[80px]" />}
          <button onClick={() => go(1)} disabled={index === cards.length - 1} className="flex items-center gap-1 text-caption text-[var(--text-secondary)] disabled:opacity-30 active:opacity-60">
            다음
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => go(1)}
            disabled={index === cards.length - 1}
            className="flex-1 py-3 rounded-xl text-body font-medium active:opacity-70 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--text-secondary)' }}
          >
            복습했어요
          </button>
          <button
            onClick={handleMastered}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-body font-medium text-white active:opacity-70 disabled:opacity-40"
            style={{ backgroundColor: card.learning_status === 'mastered' ? 'var(--mastery-mastered)' : 'var(--color-primary)' }}
          >
            {card.learning_status === 'mastered' ? '✓ 숙달완료' : '완벽히 알아요'}
          </button>
        </div>
      </div>

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
