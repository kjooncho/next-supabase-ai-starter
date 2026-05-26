'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Volume2, Search } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase'
import { Card, SentencePayload, getMasteryStage } from '@/types'
import CardGrid from '@/components/deck/CardGrid'
import CardDetail from '@/components/deck/CardDetail'
import FlashcardView from '@/components/deck/FlashcardView'

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

function TodayCard({ cards, onOpen, onStudy }: { cards: Card[]; onOpen: (c: Card) => void; onStudy: (idx: number) => void }) {
  const dayIndex = Math.floor(Date.now() / 86400000)
  const card = cards[dayIndex % cards.length]
  if (!card || card.card_type !== 'sentence') return null

  const p = card.payload as SentencePayload
  const rec = p.recommended_version
  const jp = p.step2_versions[rec]
  const pronunciation = p.step2_pronunciations?.[rec]
  const cardIndex = cards.indexOf(card)
  const stage = getMasteryStage(card.learning_status, card.has_real_use)

  const STAGE_LABEL: Record<string, string> = {
    learning: '학습중', mastered: '숙달완료', 'real-use': '써봤어요', conquered: '완전정복',
  }
  const STAGE_COLOR: Record<string, string> = {
    learning: 'var(--mastery-learning)', mastered: 'var(--mastery-mastered)',
    'real-use': 'var(--mastery-real-use)', conquered: 'var(--mastery-conquered)',
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            오늘의 카드
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[stage], color: '#fff' }}>
            {STAGE_LABEL[stage]}
          </span>
        </div>
        <button
          onClick={() => speak(jp)}
          className="w-7 h-7 rounded-full flex items-center justify-center active:opacity-60"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          <Volume2 size={13} color="#fff" />
        </button>
      </div>

      <button className="w-full text-left px-4 pb-3 active:opacity-80" onClick={() => onOpen(card)}>
        <p className="text-[11px] text-white/50 mb-0.5">{p.korean_input}</p>
        <p className="font-jp text-[22px] font-medium text-white leading-tight">{jp}</p>
        {pronunciation && (
          <p className="text-[11px] text-white/70 mt-0.5">{pronunciation}</p>
        )}
      </button>

      <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
        <button
          onClick={() => onStudy(cardIndex)}
          className="flex-1 py-2.5 text-center text-[12px] font-medium text-white/90 active:opacity-60"
        >
          플래시카드로 학습 →
        </button>
      </div>
    </div>
  )
}

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'learning' | 'mastered' | 'real-use' | 'conquered'>('all')
  const [searchQuery, setSearchQuery] = useState('')
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

  const handleDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
    setSelected(null)
  }

  const getCardLabel = (card: Card) => {
    if (card.card_type === 'sentence') return (card.payload as SentencePayload).korean_input ?? ''
    if (card.card_type === 'episode') return (card.payload as { title_kr?: string }).title_kr ?? ''
    return ''
  }

  const filteredByStage = activeFilter === 'all' ? cards : cards.filter((c) => getMasteryStage(c.learning_status, c.has_real_use) === activeFilter)
  const displayCards = searchQuery.trim()
    ? filteredByStage.filter((c) => getCardLabel(c).toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredByStage

  return (
    <div className="flex flex-col h-full">
      <header
        className="fixed top-0 inset-x-0 h-[56px] flex items-center justify-between px-4 z-10"
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
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
            <span className="text-5xl">💬</span>
            <div>
              <p className="text-h2 font-bold" style={{ color: 'var(--text-primary)' }}>아직 저장된 카드가 없어요</p>
              <p className="text-body mt-2" style={{ color: 'var(--text-secondary)' }}>
                채팅 탭에서 일본어 표현을 번역하고<br />카드에 저장해보세요
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
        ) : (
          <>
            <TodayCard cards={cards} onOpen={setSelected} onStudy={setFlashcardIndex} />
            {/* 검색창 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} color="var(--text-tertiary)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="카드 검색…"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-caption outline-none"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--text-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm active:opacity-60">✕</button>
              )}
            </div>
            <DeckStats cards={cards} />
            {/* 마스터리 필터 */}
            <div className="-mx-4 overflow-x-auto no-scrollbar mb-4">
              <div className="flex gap-2 px-4 pb-0.5">
                {([
                  { key: 'all', label: '전체', color: 'var(--color-primary)' },
                  { key: 'learning', label: '학습중', color: 'var(--mastery-learning)' },
                  { key: 'mastered', label: '숙달완료', color: 'var(--mastery-mastered)' },
                  { key: 'real-use', label: '써봤어요', color: 'var(--mastery-real-use)' },
                  { key: 'conquered', label: '완전정복', color: 'var(--mastery-conquered)' },
                ] as const).map(({ key, label, color }) => {
                  const count = key === 'all' ? cards.length : cards.filter((c) => getMasteryStage(c.learning_status, c.has_real_use) === key).length
                  const isActive = activeFilter === key
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium active:opacity-70"
                      style={{
                        backgroundColor: isActive ? color : 'var(--color-surface)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${isActive ? color : 'var(--color-hairline)'}`,
                      }}
                    >
                      {label}
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  )
                })}
                <div className="w-4 flex-shrink-0" />
              </div>
            </div>
            {displayCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  {searchQuery ? `"${searchQuery}" 검색 결과가 없어요` : '해당 카드가 없어요'}
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-caption underline active:opacity-60" style={{ color: 'var(--color-accent)' }}>
                    검색 초기화
                  </button>
                )}
              </div>
            ) : (
              <CardGrid
                cards={displayCards}
                onCardClick={setSelected}
              />
            )}
          </>
        )}
      </div>

      {selected && (
        <CardDetail
          card={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
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
