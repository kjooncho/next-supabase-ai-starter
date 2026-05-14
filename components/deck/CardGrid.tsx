'use client'

import { useState } from 'react'
import MasteryBadge from '@/components/ui/MasteryBadge'
import { Card, getMasteryStage, MasteryStage, SentencePayload, EpisodePayload } from '@/types'

type FilterStage = 'all' | MasteryStage

const FILTERS: { label: string; value: FilterStage }[] = [
  { label: '전체', value: 'all' },
  { label: '학습중', value: 'learning' },
  { label: '숙달완료', value: 'mastered' },
  { label: '써봤어요', value: 'real-use' },
  { label: '완전정복', value: 'conquered' },
]

interface CardGridProps {
  cards: Card[]
  onCardClick: (card: Card) => void
}

export default function CardGrid({ cards, onCardClick }: CardGridProps) {
  const [filter, setFilter] = useState<FilterStage>('all')

  const filtered = cards.filter((card) => {
    if (filter === 'all') return true
    return getMasteryStage(card.learning_status, card.has_real_use) === filter
  })

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className="flex-shrink-0 text-caption px-3 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: filter === value ? 'var(--color-primary)' : 'var(--color-tag-bg)',
              color: filter === value ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 카드 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">📭</span>
          <p className="text-body text-[var(--text-tertiary)]">
            {filter === 'all' ? '아직 저장된 카드가 없어요' : `${FILTERS.find(f => f.value === filter)?.label} 카드가 없어요`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((card) => (
            <CardItem key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </div>
      )}
    </div>
  )
}

function CardItem({ card, onClick }: { card: Card; onClick: () => void }) {
  const stage = getMasteryStage(card.learning_status, card.has_real_use)
  const dateStr = new Date(card.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

  if (card.card_type === 'episode') {
    const p = card.payload as EpisodePayload
    const expr = p.dialogue[0]
    return (
      <button
        onClick={onClick}
        className="text-left rounded-2xl p-3 flex flex-col gap-2 active:opacity-70"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
      >
        <div className="flex items-center gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: '#f0e9f4', color: 'var(--color-mnemonic)' }}>생활</span>
          <span className="text-[10px] text-[var(--text-tertiary)] truncate">{p.title_kr}</span>
        </div>
        <div>
          <p className="font-jp text-body-md font-medium line-clamp-1">{expr?.japanese ?? '—'}</p>
          {expr?.reading && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{expr.reading}</p>
          )}
          {expr?.pronunciation && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-accent)' }}>
              {expr.pronunciation}
            </p>
          )}
        </div>
        <p className="text-caption text-[var(--text-secondary)] line-clamp-1">{expr?.korean}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-caption text-[var(--text-tertiary)]">{dateStr}</span>
          <MasteryBadge stage={stage} />
        </div>
      </button>
    )
  }

  const payload = card.payload as SentencePayload
  const mainJp = payload.step2_versions?.[payload.recommended_version] ?? payload.step2_versions?.casual ?? ''

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-3 flex flex-col gap-2 active:opacity-70 transition-opacity"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
    >
      <p className="text-caption text-[var(--text-secondary)] line-clamp-1">{payload.korean_input}</p>
      <p className="text-body-md font-jp line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
        {mainJp || '—'}
      </p>
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-caption text-[var(--text-tertiary)]">{dateStr}</span>
        <MasteryBadge stage={stage} />
      </div>
    </button>
  )
}
