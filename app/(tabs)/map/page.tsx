'use client'

import { useState, useEffect } from 'react'
import { MAP_LOCATIONS, MONTHLY_VISITS, MapLocation } from '@/lib/mapLocations'
import JpReading from '@/components/ui/JpReading'

function StatusBadge({ status }: { status: 'done' | 'in-progress' | 'not-started' }) {
  if (status === 'done') return <span className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>완료</span>
  if (status === 'in-progress') return <span className="text-[11px] font-medium" style={{ color: '#27ae60' }}>진행중</span>
  return <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>미시작</span>
}

function LocationPopup({ loc, onLearn, onClose }: {
  loc: MapLocation
  onLearn: () => void
  onClose: () => void
}) {
  // 팝업이 화면 오른쪽에 가까우면 왼쪽으로 열기
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

function ExpressionsSheet({ loc, onClose }: { loc: MapLocation; onClose: () => void }) {
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
        className="rounded-t-3xl max-h-[75vh] overflow-y-auto pb-[34px]"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-hairline)' }} />
        </div>

        {/* 헤더 */}
        <div className="px-5 pb-3 border-b" style={{ borderColor: 'var(--color-hairline)' }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{loc.emoji}</span>
            <div>
              <p className="font-jp text-body-md font-bold">{loc.name_jp}</p>
              <p className="text-caption text-[var(--text-tertiary)]">{loc.description_kr}</p>
            </div>
          </div>
        </div>

        {/* 표현 목록 */}
        <div className="px-5 pt-4 flex flex-col gap-3">
          <p className="text-caption font-medium" style={{ color: 'var(--color-accent)' }}>
            핵심 표현 {loc.expressions.length}개
          </p>
          {loc.expressions.map((expr, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <JpReading
                  japanese={expr.japanese}
                  reading={expr.reading}
                  pronunciation={expr.pronunciation}
                  size="base"
                />
                <span
                  className="text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                >
                  {i + 1}
                </span>
              </div>
              <p className="text-caption font-medium text-[var(--text-secondary)] mt-2">{expr.korean}</p>
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

  const selectedLoc = MAP_LOCATIONS.find((l) => l.id === selected)

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
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
      </header>

      {/* 스크롤 본문 */}
      <div className="flex-1 overflow-y-auto pb-[80px]" style={{ paddingTop: '56px' }}>
        {/* 지도 영역 */}
        <div
          className="relative w-full"
          style={{ height: '320px' }}
          onClick={() => setSelected(null)}
        >
          {/* 지도 배경 */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #d4e8c2 0%, #c8ddb4 30%, #e8d5b0 60%, #d4c8a8 100%)',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 320" preserveAspectRatio="none">
              <path d="M0 160 Q100 150 195 160 Q290 170 390 160" stroke="#b8a882" strokeWidth="14" fill="none" opacity="0.6"/>
              <path d="M195 0 Q185 80 195 160 Q205 240 195 320" stroke="#b8a882" strokeWidth="10" fill="none" opacity="0.5"/>
              <path d="M0 80 Q80 75 140 90" stroke="#b8a882" strokeWidth="7" fill="none" opacity="0.4"/>
              <path d="M250 230 Q320 220 390 230" stroke="#b8a882" strokeWidth="7" fill="none" opacity="0.4"/>
              <path d="M60 320 Q130 280 180 260 Q230 240 280 250 Q330 260 390 240" stroke="#a8c8e8" strokeWidth="18" fill="none" opacity="0.5"/>
            </svg>
            <div className="absolute rounded-full opacity-40" style={{ width: 80, height: 60, top: '38%', left: '28%', backgroundColor: '#88c060' }} />
          </div>

          {/* 위치 마커들 */}
          {MAP_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              className="absolute flex flex-col items-center gap-0.5 transition-transform active:scale-110"
              style={{ top: `${loc.top}%`, left: `${loc.left}%`, transform: 'translate(-50%, -50%)', zIndex: selected === loc.id ? 30 : 10 }}
              onClick={(e) => { e.stopPropagation(); setSelected(selected === loc.id ? null : loc.id) }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-white"
                style={{
                  backgroundColor: loc.color,
                  boxShadow: selected === loc.id ? `0 0 0 3px ${loc.color}44, 0 4px 12px rgba(0,0,0,0.2)` : '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {loc.emoji}
              </div>
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm font-jp"
                style={{ backgroundColor: loc.color, color: '#fff' }}
              >
                {loc.name_jp}
              </span>
            </button>
          ))}

          {/* 선택된 팝업 */}
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M9 18l6-6-6-6" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )
            })}
          </div>
        </div>

        {/* 전체 장소 목록 */}
        <div className="px-4 pt-2">
          <p className="text-body font-bold text-[var(--text-primary)] mb-3">전체 장소</p>
          <div className="grid grid-cols-2 gap-2">
            {MAP_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSheet(loc)}
                className="rounded-xl px-3 py-3 text-left active:opacity-70"
                style={{ backgroundColor: 'var(--color-surface)', border: `1px solid var(--color-hairline)` }}
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

      {/* 표현 배우기 바텀시트 */}
      {sheet && <ExpressionsSheet loc={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
