'use client'

import { useState, useEffect } from 'react'
import { Volume2, Volume1, ChevronRight } from 'lucide-react'
import { MAP_LOCATIONS, MONTHLY_VISITS, MapLocation } from '@/lib/mapLocations'
import JpReading from '@/components/ui/JpReading'

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

function StatusBadge({ status }: { status: 'done' | 'in-progress' | 'not-started' }) {
  if (status === 'done') return <span className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>완료</span>
  if (status === 'in-progress') return <span className="text-[11px] font-medium" style={{ color: '#27ae60' }}>진행중</span>
  return <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>미시작</span>
}

function SpeakButton({ text, color }: { text: string; color: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(text) }}
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 active:opacity-60"
      style={{ backgroundColor: color + '22' }}
    >
      <Volume2 size={14} color={color} />
    </button>
  )
}

function DailyCard({ loc, onOpen }: { loc: MapLocation; onOpen: () => void }) {
  const expr = loc.expressions[0]
  const dateStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  return (
    <div
      className="mx-4 rounded-2xl overflow-hidden"
      style={{ backgroundColor: loc.color + '14', border: `1.5px solid ${loc.color}40` }}
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: loc.color }}>
          오늘의 장소
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">{dateStr}</span>
      </div>
      <div className="px-4 pb-2 flex items-center gap-2">
        <span className="text-2xl">{loc.emoji}</span>
        <div>
          <p className="font-jp text-body font-bold leading-none">{loc.name_jp}</p>
          <p className="text-[11px] text-[var(--text-tertiary)]">{loc.name_kr}</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div
          className="rounded-xl px-3 py-2.5 flex items-start gap-2"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <div className="flex-1">
            <p className="font-jp text-body font-medium">{expr.japanese}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{expr.reading}</p>
            <p className="text-[10px] font-medium mt-0.5 leading-relaxed" style={{ color: loc.color }}>{expr.pronunciation}</p>
            <p className="text-caption text-[var(--text-secondary)] mt-1">{expr.korean}</p>
          </div>
          <SpeakButton text={expr.japanese} color={loc.color} />
        </div>
        <button
          onClick={onOpen}
          className="w-full mt-2 py-2 rounded-xl text-[12px] font-medium text-white active:opacity-70"
          style={{ backgroundColor: loc.color }}
        >
          전체 표현 보기 ({loc.expressions.length}개) →
        </button>
      </div>
    </div>
  )
}

function LocationPopup({ loc, onLearn, onClose }: {
  loc: MapLocation
  onLearn: () => void
  onClose: () => void
}) {
  const rightAligned = loc.left > 60
  return (
    <div
      className="absolute z-20 rounded-2xl shadow-xl w-[210px]"
      style={{
        top: `${loc.top}%`,
        left: rightAligned ? 'auto' : `${Math.min(loc.left + 5, 52)}%`,
        right: rightAligned ? `${100 - loc.left + 5}%` : 'auto',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-hairline)',
        transform: 'translateY(-110%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{loc.emoji}</span>
          <div>
            <p className="font-jp text-body font-bold leading-none">{loc.name_jp}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{loc.name_kr}</p>
          </div>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-snug">{loc.description_kr}</p>
        <div className="flex gap-3 mt-2 text-[11px] text-[var(--text-secondary)]">
          <span>표현 <strong>{loc.expressions.length}개</strong></span>
          <span>카드 <strong>{loc.card_count}장</strong></span>
        </div>
      </div>
      <div className="px-2 pb-2 flex gap-1.5">
        <button
          className="flex-1 py-2 rounded-lg text-[11px] font-medium text-white active:opacity-70"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onClick={onLearn}
        >
          표현 배우기
        </button>
        {loc.episode_id && (
          <button
            className="flex-1 py-2 rounded-lg text-[11px] font-medium active:opacity-70"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--text-primary)' }}
            onClick={onClose}
          >
            에피소드 →
          </button>
        )}
      </div>
    </div>
  )
}

function ExpressionsSheet({ loc, onClose, isCompleted, onToggleComplete }: {
  loc: MapLocation
  onClose: () => void
  isCompleted: boolean
  onToggleComplete: () => void
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const toggle = (i: number) => setRevealed(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl max-h-[82vh] overflow-y-auto pb-[34px]"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-hairline)' }} />
        </div>

        <div className="px-5 pb-3 border-b" style={{ borderColor: 'var(--color-hairline)' }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{loc.emoji}</span>
            <div className="flex-1">
              <p className="font-jp text-body-md font-bold">{loc.name_jp}</p>
              <p className="text-caption text-[var(--text-tertiary)]">{loc.description_kr}</p>
            </div>
            <SpeakButton text={loc.name_jp} color={loc.color} />
          </div>
        </div>

        <div className="px-5 pt-3 pb-1">
          <p className="text-[11px] text-[var(--text-tertiary)]">
            💡 한국어를 보고 일본어를 떠올린 뒤 탭해서 확인하세요
          </p>
        </div>

        <div className="px-5 pt-2 flex flex-col gap-3 pb-2">
          <div className="flex items-center justify-between">
            <p className="text-caption font-medium" style={{ color: loc.color }}>
              핵심 표현 {loc.expressions.length}개
            </p>
            <button
              onClick={onToggleComplete}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium active:opacity-70"
              style={{
                backgroundColor: isCompleted ? '#e8f5e9' : 'var(--color-surface)',
                border: `1px solid ${isCompleted ? '#c8e6c9' : 'var(--color-hairline)'}`,
                color: isCompleted ? '#2e7d32' : 'var(--text-secondary)',
              }}
            >
              {isCompleted ? '✓ 학습완료' : '학습 완료 표시'}
            </button>
          </div>
          {loc.expressions.map((expr, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-hairline)' }}
            >
              <button
                className="w-full px-4 py-3 text-left active:opacity-80"
                style={{ backgroundColor: 'var(--color-surface)' }}
                onClick={() => toggle(i)}
              >
                <p className="text-caption font-medium text-[var(--text-primary)]">{expr.korean}</p>
                {revealed.has(i) ? (
                  <div className="mt-2">
                    <JpReading
                      japanese={expr.japanese}
                      reading={expr.reading}
                      pronunciation={expr.pronunciation}
                      size="base"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">탭해서 일본어 확인 →</p>
                )}
              </button>
              <div
                className="px-3 py-1.5 flex items-center justify-between"
                style={{ backgroundColor: loc.color + '0e', borderTop: `1px solid ${loc.color}28` }}
              >
                <span
                  className="text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{ backgroundColor: loc.color, color: '#fff' }}
                >
                  {i + 1}
                </span>
                <button
                  onClick={() => speak(expr.japanese)}
                  className="flex items-center gap-1 py-1 px-2.5 rounded-full active:opacity-60"
                  style={{ backgroundColor: loc.color + '22' }}
                >
                  <Volume1 size={11} color={loc.color} />
                  <span className="text-[10px] font-medium" style={{ color: loc.color }}>듣기</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MapPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [sheet, setSheet] = useState<MapLocation | null>(null)
  const [activeTag, setActiveTag] = useState('전체')
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem('completed_locations')
      if (raw) setCompletedIds(new Set(JSON.parse(raw)))
    } catch {}
  }, [])

  const markComplete = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      try { localStorage.setItem('completed_locations', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const selectedLoc = MAP_LOCATIONS.find((l) => l.id === selected)
  const dailyLoc = MAP_LOCATIONS[new Date().getDate() % MAP_LOCATIONS.length]
  const allTags = ['전체', ...Array.from(new Set(MAP_LOCATIONS.map((l) => l.tag)))]
  const filteredLocations = activeTag === '전체'
    ? MAP_LOCATIONS
    : MAP_LOCATIONS.filter((l) => l.tag === activeTag)

  return (
    <div className="flex flex-col h-full">
      <header
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[56px] flex items-center justify-between px-4 z-10"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-white text-xl">🗺️</span>
          <div>
            <p className="text-white text-body font-bold leading-none">우리 동네 학습 지도</p>
            <p className="text-white/60 text-[11px] mt-0.5">탭하면 표현이 나와요</p>
          </div>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: completedIds.size === MAP_LOCATIONS.length ? '#f39c12' : 'rgba(255,255,255,0.15)',
            color: '#fff',
          }}
        >
          {completedIds.size === MAP_LOCATIONS.length ? '🏆 전체 완료!' : `${completedIds.size}/${MAP_LOCATIONS.length} 완료`}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto pb-[80px]" style={{ paddingTop: '56px' }}>
        {/* 진행률 바 */}
        <div className="h-1 w-full" style={{ backgroundColor: 'var(--color-hairline)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(completedIds.size / MAP_LOCATIONS.length) * 100}%`,
              backgroundColor: completedIds.size === MAP_LOCATIONS.length ? '#f39c12' : 'var(--color-accent)',
            }}
          />
        </div>
        {/* 오늘의 장소 */}
        <div className="pt-4 pb-3">
          <DailyCard loc={dailyLoc} onOpen={() => setSheet(dailyLoc)} />
        </div>

        {/* 지도 영역 */}
        <div
          className="relative w-full"
          style={{ height: '340px' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #d4e8c2 0%, #c8ddb4 30%, #e8d5b0 60%, #d4c8a8 100%)',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 340" preserveAspectRatio="none">
              {/* 주요 도로 */}
              <path d="M0 170 Q100 160 195 170 Q290 180 390 170" stroke="#c8b882" strokeWidth="16" fill="none" opacity="0.7"/>
              <path d="M195 0 Q185 85 195 170 Q205 255 195 340" stroke="#c8b882" strokeWidth="12" fill="none" opacity="0.6"/>
              {/* 보조 도로 */}
              <path d="M0 80 Q90 75 155 90" stroke="#c8b882" strokeWidth="8" fill="none" opacity="0.5"/>
              <path d="M240 80 Q300 72 390 78" stroke="#c8b882" strokeWidth="8" fill="none" opacity="0.5"/>
              <path d="M0 250 Q70 240 140 255 Q200 265 260 250" stroke="#c8b882" strokeWidth="8" fill="none" opacity="0.5"/>
              <path d="M260 250 Q320 240 390 248" stroke="#c8b882" strokeWidth="8" fill="none" opacity="0.5"/>
              {/* 중앙선 */}
              <path d="M0 170 Q100 160 195 170 Q290 180 390 170" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="18 12"/>
              <path d="M195 0 Q185 85 195 170 Q205 255 195 340" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="18 12"/>
              {/* 철도 */}
              <path d="M60 170 Q130 165 195 170 Q260 175 340 165" stroke="#1565c0" strokeWidth="4" fill="none" opacity="0.3" strokeDasharray="10 4"/>
              {/* 강 */}
              <path d="M30 310 Q120 290 180 275 Q240 260 310 270 Q360 278 390 265" stroke="#a8c8e8" strokeWidth="22" fill="none" opacity="0.5"/>
              {/* 공항 활주로 표시 */}
              <rect x="70" y="292" width="60" height="16" rx="3" fill="#b0b8c8" opacity="0.4"/>
              <line x1="100" y1="292" x2="100" y2="308" stroke="#fff" strokeWidth="1.5" opacity="0.7" strokeDasharray="4 4"/>
              {/* 블록들 */}
              <rect x="30" y="28" width="55" height="38" rx="5" fill="#c8d8b0" opacity="0.45"/>
              <rect x="245" y="24" width="65" height="42" rx="5" fill="#c8d8b0" opacity="0.45"/>
              <rect x="95" y="188" width="50" height="36" rx="5" fill="#d8c8a8" opacity="0.45"/>
              <rect x="275" y="185" width="55" height="36" rx="5" fill="#d8c8a8" opacity="0.45"/>
              <rect x="30" y="210" width="45" height="34" rx="5" fill="#d8ccc0" opacity="0.4"/>
              <rect x="310" y="75" width="55" height="32" rx="5" fill="#c8d8b0" opacity="0.4"/>
            </svg>
          </div>

          {MAP_LOCATIONS.map((loc) => {
            const isActive = selected === loc.id
            const isDone = completedIds.has(loc.id)
            return (
              <button
                key={loc.id}
                className="absolute flex flex-col items-center gap-0.5 transition-transform active:scale-110"
                style={{
                  top: `${loc.top}%`,
                  left: `${loc.left}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isActive ? 30 : 10,
                }}
                onClick={(e) => { e.stopPropagation(); setSelected(isActive ? null : loc.id) }}
              >
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-white"
                    style={{
                      backgroundColor: isDone ? '#2e7d32' : loc.color,
                      boxShadow: isActive
                        ? `0 0 0 4px ${loc.color}55, 0 4px 14px rgba(0,0,0,0.25)`
                        : '0 2px 8px rgba(0,0,0,0.18)',
                      opacity: isDone ? 0.85 : 1,
                    }}
                  >
                    {isDone ? '✓' : loc.emoji}
                  </div>
                </div>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm font-jp"
                  style={{ backgroundColor: isDone ? '#2e7d32' : loc.color, color: '#fff' }}
                >
                  {loc.name_jp}
                </span>
              </button>
            )
          })}

          {selectedLoc && (
            <LocationPopup
              loc={selectedLoc}
              onLearn={() => { setSheet(selectedLoc); setSelected(null) }}
              onClose={() => setSelected(null)}
            />
          )}
        </div>

        {/* 이번 달 방문한 장소 */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-body font-bold text-[var(--text-primary)] mb-3">이번 달 방문한 장소</p>
          <div className="flex flex-col gap-3">
            {MONTHLY_VISITS.map((visit) => {
              const loc = MAP_LOCATIONS.find((l) => l.id === visit.location_id)
              if (!loc) return null
              return (
                <button
                  key={visit.location_id}
                  className="flex items-center gap-3 active:opacity-70 text-left"
                  onClick={() => setSheet(loc)}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: `${loc.color}22` }}>
                    {loc.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-jp text-caption font-medium">{loc.name_jp}</span>
                      <StatusBadge status={visit.status} />
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-hairline)' }}>
                      {visit.progress > 0 && (
                        <div className="h-full rounded-full" style={{ width: `${visit.progress}%`, backgroundColor: visit.status === 'done' ? 'var(--color-accent)' : '#27ae60' }} />
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-tertiary)" className="flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </div>

        {/* 태그 필터 + 전체 장소 */}
        <div className="pt-3">
          <div className="px-4 mb-2">
            <p className="text-body font-bold text-[var(--text-primary)]">전체 장소</p>
          </div>
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium active:opacity-70"
                style={{
                  backgroundColor: activeTag === tag ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: activeTag === tag ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${activeTag === tag ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSheet(loc)}
                className="rounded-xl px-3 py-3 text-left active:opacity-70"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{loc.emoji}</span>
                  <span className="font-jp text-caption font-medium">{loc.name_jp}</span>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)]">{loc.name_kr}</p>
                <p className="text-[10px] mt-1.5" style={{ color: loc.color }}>표현 {loc.expressions.length}개 · 카드 {loc.card_count}장</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {sheet && (
        <ExpressionsSheet
          loc={sheet}
          onClose={() => setSheet(null)}
          isCompleted={completedIds.has(sheet.id)}
          onToggleComplete={() => markComplete(sheet.id)}
        />
      )}
    </div>
  )
}
