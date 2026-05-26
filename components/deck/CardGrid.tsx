'use client'

import MasteryBadge from '@/components/ui/MasteryBadge'
import { Card, getMasteryStage, SentencePayload, EpisodePayload } from '@/types'

interface CardGridProps {
  cards: Card[]
  onCardClick: (card: Card) => void
}

export default function CardGrid({ cards, onCardClick }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">📭</span>
        <p className="text-body text-[var(--text-tertiary)]">해당 카드가 없어요</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} onClick={() => onCardClick(card)} />
      ))}
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
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--color-mnemonic-bg)', color: 'var(--color-mnemonic)' }}>생활</span>
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
  const isImageCard = payload.mode === 'image'
  const mainJp = isImageCard
    ? payload.korean_input
    : (payload.step2_versions?.[payload.recommended_version] ?? payload.step2_versions?.casual ?? '')
  const subText = isImageCard
    ? (payload.step2_versions?.casual ?? '')
    : payload.korean_input

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-3 flex flex-col gap-2 active:opacity-70 transition-opacity"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
    >
      {isImageCard && (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium self-start" style={{ backgroundColor: 'var(--color-cultural-bg)', color: 'var(--color-cultural)' }}>📷 이미지</span>
      )}
      <p className="text-body-md font-jp line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
        {mainJp || '—'}
      </p>
      <p className="text-caption text-[var(--text-secondary)] line-clamp-1">{subText}</p>
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-caption text-[var(--text-tertiary)]">{dateStr}</span>
        <MasteryBadge stage={stage} />
      </div>
    </button>
  )
}
