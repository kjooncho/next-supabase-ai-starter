'use client'

import { useEffect, useState, useCallback } from 'react'
import { KANJI_LIST, KANJI_CATEGORIES, CATEGORY_COLORS, KanjiEntry, KanjiCategory } from '@/lib/kanji'

const STORAGE_KEY = 'learned_kanji'

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

function loadLearnedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveLearnedIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {}
}

// ── TodayKanjiCard ───────────────────────────────────────────────────────────

function TodayKanjiCard({
  learnedIds,
  onOpen,
  onPractice,
}: {
  learnedIds: Set<string>
  onOpen: (k: KanjiEntry) => void
  onPractice: (idx: number) => void
}) {
  const dayIndex = Math.floor(Date.now() / 86400000)
  const k = KANJI_LIST[dayIndex % KANJI_LIST.length]
  const isLearned = learnedIds.has(k.id)
  const color = CATEGORY_COLORS[k.category]
  const idx = KANJI_LIST.indexOf(k)

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ backgroundColor: color, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            오늘의 한자
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            {k.category}
          </span>
          {isLearned && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              ✓ 학습완료
            </span>
          )}
        </div>
        <button
          onClick={() => speak(k.reading_kun || k.reading_on)}
          className="w-7 h-7 rounded-full flex items-center justify-center active:opacity-60"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#fff" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <button className="w-full text-left px-4 pb-3 active:opacity-80" onClick={() => onOpen(k)}>
        <div className="flex items-end gap-3">
          <p className="font-jp text-[64px] font-bold text-white leading-none">{k.kanji}</p>
          <div className="pb-1">
            <p className="text-white/80 text-[13px]">{k.reading_kun && `${k.reading_kun} · `}{k.reading_on}</p>
            <p className="text-white text-[16px] font-medium">{k.meaning_kr}</p>
          </div>
        </div>
        <p className="text-[12px] text-white/70 mt-1 leading-relaxed line-clamp-2">{k.visual_hint}</p>
      </button>

      <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
        <button
          onClick={() => onPractice(idx)}
          className="flex-1 py-2.5 text-center text-[12px] font-medium text-white/90 active:opacity-60"
        >
          플래시카드 연습 →
        </button>
      </div>
    </div>
  )
}

// ── KanjiGrid ────────────────────────────────────────────────────────────────

function KanjiGrid({
  entries,
  learnedIds,
  onOpen,
}: {
  entries: KanjiEntry[]
  learnedIds: Set<string>
  onOpen: (k: KanjiEntry) => void
}) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-[var(--text-tertiary)] text-caption">해당 카테고리에 한자가 없어요</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {entries.map((k) => {
        const isLearned = learnedIds.has(k.id)
        const color = CATEGORY_COLORS[k.category]
        return (
          <button
            key={k.id}
            onClick={() => onOpen(k)}
            className="rounded-2xl p-3 text-left active:opacity-70 relative"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: `1.5px solid ${isLearned ? color : 'var(--color-hairline)'}`,
            }}
          >
            {isLearned && (
              <div
                className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <span className="text-[9px] text-white font-bold">✓</span>
              </div>
            )}
            <p
              className="font-jp text-[32px] font-bold leading-none mb-1"
              style={{ color: isLearned ? color : 'var(--text-primary)' }}
            >
              {k.kanji}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">{k.meaning_kr}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 font-jp">{k.reading_kun || k.reading_on}</p>
            <span
              className="text-[9px] font-bold px-1 py-0.5 rounded mt-1 inline-block"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {k.jlpt}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── KanjiDetailSheet ─────────────────────────────────────────────────────────

function KanjiDetailSheet({
  entry,
  isLearned,
  onClose,
  onToggle,
  onPractice,
}: {
  entry: KanjiEntry
  isLearned: boolean
  onClose: () => void
  onToggle: () => void
  onPractice: () => void
}) {
  const color = CATEGORY_COLORS[entry.category]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl overflow-y-auto max-h-[88vh] pb-[34px]"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-hairline)' }} />
        </div>

        <div className="px-5 py-3 flex flex-col gap-5">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <span className="font-jp text-[42px] font-bold leading-none" style={{ color }}>{entry.kanji}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: color }}
                  >
                    {entry.category}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{entry.jlpt}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{entry.stroke_count}획</span>
                </div>
                <p className="text-h2 font-bold">{entry.meaning_kr}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.reading_kun && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--text-tertiary)]">훈독</span>
                      <span className="font-jp text-caption">{entry.reading_kun}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">({entry.pronunciation_kun})</span>
                    </div>
                  )}
                  {entry.reading_on && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--text-tertiary)]">음독</span>
                      <span className="font-jp text-caption">{entry.reading_on}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">({entry.pronunciation_on})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => speak(entry.reading_kun || entry.reading_on)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-60"
              style={{ backgroundColor: `${color}18` }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill={color} />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* 유래 */}
          <section className="rounded-xl px-4 py-3" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}30` }}>
            <p className="text-caption font-medium mb-1.5" style={{ color }}>📜 한자 유래</p>
            <p className="text-caption text-[var(--text-secondary)] leading-relaxed">{entry.origin_story}</p>
          </section>

          {/* 비주얼 힌트 */}
          <section className="rounded-xl px-4 py-3" style={{ backgroundColor: '#fef6ec', border: '1px solid #fde8c8' }}>
            <p className="text-caption font-medium mb-1.5" style={{ color: '#e67e22' }}>👁 시각적 힌트</p>
            <p className="text-caption text-[var(--text-secondary)] leading-relaxed">{entry.visual_hint}</p>
          </section>

          {/* 니모닉 */}
          <section className="rounded-xl px-4 py-3" style={{ backgroundColor: '#f0e9f4', border: '1px solid #d8bfe8' }}>
            <p className="text-caption font-medium mb-1.5" style={{ color: '#8e44ad' }}>💡 암기 팁</p>
            <p className="text-caption text-[var(--text-secondary)] leading-relaxed">{entry.mnemonic}</p>
          </section>

          {/* 관련 단어 */}
          <section>
            <p className="text-caption font-medium mb-2" style={{ color: 'var(--color-accent)' }}>관련 단어</p>
            <div className="flex flex-col gap-2">
              {entry.related_words.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
                >
                  <div>
                    <p className="font-jp text-body-md font-medium">{w.word}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{w.reading} ({w.pronunciation})</p>
                    <p className="text-caption text-[var(--text-secondary)] mt-0.5">{w.meaning}</p>
                  </div>
                  <button
                    onClick={() => speak(w.reading)}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60 ml-2 flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-tag-bg)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" fill="var(--text-secondary)" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 액션 버튼 */}
          <button
            onClick={onPractice}
            className="w-full py-3 rounded-xl text-[13px] font-medium text-white active:opacity-70"
            style={{ backgroundColor: color }}
          >
            플래시카드로 연습하기 →
          </button>

          <button
            onClick={onToggle}
            className="w-full py-3 rounded-xl text-[13px] font-medium active:opacity-70"
            style={{
              backgroundColor: isLearned ? 'var(--color-surface)' : `${color}15`,
              color: isLearned ? 'var(--text-secondary)' : color,
              border: `1px solid ${isLearned ? 'var(--color-hairline)' : color}`,
            }}
          >
            {isLearned ? '✓ 학습완료 — 취소하기' : '학습완료 표시하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KanjiPracticeView ────────────────────────────────────────────────────────

function KanjiPracticeView({
  entries,
  initialIndex,
  learnedIds,
  onClose,
  onToggleLearned,
}: {
  entries: KanjiEntry[]
  initialIndex: number
  learnedIds: Set<string>
  onClose: () => void
  onToggleLearned: (id: string) => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  const [flipped, setFlipped] = useState(false)
  const k = entries[idx]
  const isLearned = learnedIds.has(k.id)
  const color = CATEGORY_COLORS[k.category]

  const goNext = useCallback(() => {
    setIdx((i) => (i + 1) % entries.length)
    setFlipped(false)
  }, [entries.length])

  const goPrev = useCallback(() => {
    setIdx((i) => (i - 1 + entries.length) % entries.length)
    setFlipped(false)
  }, [entries.length])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 h-[56px]"
        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-hairline)' }}
      >
        <button onClick={onClose} className="text-caption text-[var(--text-secondary)] active:opacity-60">
          ← 닫기
        </button>
        <span className="text-caption text-[var(--text-tertiary)]">{idx + 1} / {entries.length}</span>
        <button
          onClick={() => speak(k.reading_kun || k.reading_on)}
          className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
          style={{ backgroundColor: 'var(--color-tag-bg)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="var(--text-secondary)" />
          </svg>
        </button>
      </div>

      {/* 카드 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <button
          onClick={() => setFlipped((f) => !f)}
          className="w-full max-w-[320px] rounded-3xl flex flex-col items-center justify-center active:opacity-80"
          style={{
            height: 320,
            backgroundColor: flipped ? 'var(--color-surface)' : `${color}15`,
            border: `2px solid ${flipped ? 'var(--color-hairline)' : color}`,
          }}
        >
          {!flipped ? (
            <>
              <p className="font-jp text-[100px] font-bold leading-none" style={{ color }}>{k.kanji}</p>
              <p className="text-caption text-[var(--text-tertiary)] mt-3">탭해서 뒤집기</p>
            </>
          ) : (
            <div className="px-6 text-center">
              <p className="text-h1 font-bold mb-2">{k.meaning_kr}</p>
              <div className="flex justify-center gap-3 mb-3">
                {k.reading_kun && <p className="font-jp text-body-md text-[var(--text-secondary)]">{k.reading_kun} ({k.pronunciation_kun})</p>}
                {k.reading_on && <p className="font-jp text-body-md text-[var(--text-secondary)]">{k.reading_on} ({k.pronunciation_on})</p>}
              </div>
              <p className="text-caption text-[var(--text-tertiary)] leading-relaxed">{k.mnemonic}</p>
            </div>
          )}
        </button>
      </div>

      {/* 버튼 */}
      <div className="px-6 pb-[34px] flex flex-col gap-2">
        {flipped && (
          <div className="flex gap-2 mb-1">
            <button
              onClick={() => { onToggleLearned(k.id); goNext() }}
              className="flex-1 py-3 rounded-xl text-[13px] font-medium text-white active:opacity-70"
              style={{ backgroundColor: color }}
            >
              알았어요 ✓
            </button>
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-xl text-[13px] font-medium active:opacity-70"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--text-secondary)', border: '1px solid var(--color-hairline)' }}
            >
              다시 볼게요
            </button>
          </div>
        )}
        <div className="flex justify-between">
          <button onClick={goPrev} className="text-caption text-[var(--color-accent)] active:opacity-60 px-2">← 이전</button>
          <span
            className="text-[11px] px-3 py-1 rounded-full"
            style={{ backgroundColor: isLearned ? `${color}20` : 'var(--color-tag-bg)', color: isLearned ? color : 'var(--text-tertiary)' }}
          >
            {isLearned ? '✓ 학습완료' : '미완료'}
          </span>
          <button onClick={goNext} className="text-caption text-[var(--color-accent)] active:opacity-60 px-2">다음 →</button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function KanjiPage() {
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<KanjiCategory | 'all'>('all')
  const [selected, setSelected] = useState<KanjiEntry | null>(null)
  const [practiceIndex, setPracticeIndex] = useState<number | null>(null)

  useEffect(() => {
    setLearnedIds(loadLearnedIds())
  }, [])

  const toggleLearned = useCallback((id: string) => {
    setLearnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      saveLearnedIds(next)
      return next
    })
  }, [])

  const displayEntries = activeCategory === 'all'
    ? KANJI_LIST
    : KANJI_LIST.filter((k) => k.category === activeCategory)

  const learnedCount = learnedIds.size

  return (
    <div className="flex flex-col h-full">
      <header
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[56px] flex items-center justify-between px-4 z-10"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <span className="text-white text-h2 font-bold font-jp">漢字</span>
        <div className="flex items-center gap-2">
          <span
            className="text-caption px-3 py-1 rounded-full font-medium"
            style={{
              backgroundColor: learnedCount === KANJI_LIST.length ? '#f39c12' : 'rgba(255,255,255,0.15)',
              color: '#fff',
            }}
          >
            {learnedCount === KANJI_LIST.length ? '🏆 전체 완료!' : `${learnedCount} / ${KANJI_LIST.length} 학습`}
          </span>
          {KANJI_LIST.length > 0 && (
            <button
              onClick={() => setPracticeIndex(0)}
              className="text-caption px-3 py-1 rounded-full font-medium active:opacity-70"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              연습 →
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 진행률 바 */}
        <div className="fixed top-[56px] left-1/2 -translate-x-1/2 w-full max-w-[390px] h-1 z-10" style={{ backgroundColor: 'var(--color-hairline)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(learnedCount / KANJI_LIST.length) * 100}%`,
              backgroundColor: learnedCount === KANJI_LIST.length ? '#f39c12' : 'var(--color-accent)',
            }}
          />
        </div>
        <TodayKanjiCard
          learnedIds={learnedIds}
          onOpen={setSelected}
          onPractice={(idx) => setPracticeIndex(idx)}
        />

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {([{ key: 'all', label: '전체', color: 'var(--color-primary)' }, ...KANJI_CATEGORIES.map((c) => ({ key: c, label: c, color: CATEGORY_COLORS[c] }))] as const).map(({ key, label, color }) => {
            const isActive = activeCategory === key
            const count = key === 'all' ? KANJI_LIST.length : KANJI_LIST.filter((k) => k.category === key).length
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key as KanjiCategory | 'all')}
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
        </div>

        <KanjiGrid
          entries={displayEntries}
          learnedIds={learnedIds}
          onOpen={setSelected}
        />
      </div>

      {selected && (
        <KanjiDetailSheet
          entry={selected}
          isLearned={learnedIds.has(selected.id)}
          onClose={() => setSelected(null)}
          onToggle={() => toggleLearned(selected.id)}
          onPractice={() => {
            const idx = KANJI_LIST.indexOf(selected)
            setPracticeIndex(idx)
            setSelected(null)
          }}
        />
      )}

      {practiceIndex !== null && (
        <KanjiPracticeView
          entries={displayEntries.length > 0 ? displayEntries : KANJI_LIST}
          initialIndex={Math.min(practiceIndex, (displayEntries.length > 0 ? displayEntries : KANJI_LIST).length - 1)}
          learnedIds={learnedIds}
          onClose={() => setPracticeIndex(null)}
          onToggleLearned={toggleLearned}
        />
      )}
    </div>
  )
}
