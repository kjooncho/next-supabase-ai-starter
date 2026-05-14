'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase'
import { Card, getMasteryStage } from '@/types'
import CardGrid from '@/components/deck/CardGrid'
import CardDetail from '@/components/deck/CardDetail'
import FlashcardView from '@/components/deck/FlashcardView'

const STAGE_CONFIG = [
  { key: 'learning',   label: '학습중',   color: 'var(--mastery-learning)' },
  { key: 'mastered',   label: '숙달완료', color: 'var(--mastery-mastered)' },
  { key: 'real-use',   label: '써봤어요', color: 'var(--mastery-real-use)' },
  { key: 'conquered',  label: '완전정복', color: 'var(--mastery-conquered)' },
] as const

function DeckStats({ cards }: { cards: Card[] }) {
  const counts = { learning: 0, mastered: 0, 'real-use': 0, conquered: 0 }
  cards.forEach((c) => { counts[getMasteryStage(c.learning_status, c.has_real_use)]++ })

  return (
    <div className="mb-4">
      <p className="text-caption text-[var(--text-tertiary)] mb-2">전체 {cards.length}개</p>
      <div className="grid grid-cols-4 gap-2">
        {STAGE_CONFIG.map(({ key, label, color }) => (
          <div
            key={key}
            className="rounded-xl py-2.5 text-center"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
          >
            <p className="text-h2 font-bold" style={{ color }}>{counts[key]}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DeckPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<Card | null>(null)
  const [flashcardIndex, setFlashcardIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserSupabase()

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }

      const { data: rows, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setFetchError(true)
      } else {
        setCards(rows ?? [])
      }
      setLoading(false)
    })
  }, [router])

  const handleUpdate = (updated: Card) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelected(updated)
  }

  return (
    <div className="flex flex-col h-full">
      <header
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[56px] flex items-center justify-between px-4 z-10"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <span className="text-white text-h2 font-bold">내 카드</span>
        <div className="flex items-center gap-2">
          <Link
            href="/teacher"
            className="text-caption px-3 py-1 rounded-full font-medium active:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            🎓 선생님 모드
          </Link>
          {cards.length > 0 && (
            <button
              onClick={() => setFlashcardIndex(0)}
              className="text-caption px-3 py-1 rounded-full font-medium active:opacity-70"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              학습 시작 →
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-body text-[var(--text-tertiary)]">불러오는 중…</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-body text-[var(--color-error)]">카드를 불러오지 못했어요</p>
            <button
              onClick={() => { setFetchError(false); setLoading(true) }}
              className="text-caption text-[var(--color-accent)] underline"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {cards.length > 0 && <DeckStats cards={cards} />}
            <CardGrid cards={cards} onCardClick={setSelected} />
          </>
        )}
      </div>

      {selected && (
        <CardDetail
          card={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

      {flashcardIndex !== null && (
        <FlashcardView
          cards={cards}
          initialIndex={flashcardIndex}
          onClose={() => setFlashcardIndex(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
