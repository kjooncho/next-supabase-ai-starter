'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SERIES_LIST, getEpisodesBySeriesId } from '@/lib/episodes'

export default function LifePage() {
  const router = useRouter()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem('read_episodes')
      if (raw) setReadIds(new Set(JSON.parse(raw)))
    } catch {}
  }, [])

  return (
    <div className="flex flex-col h-full">
      <header
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[56px] flex items-center px-4 z-10"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <span className="text-white text-h2 font-bold">생활 일본어</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-caption text-[var(--text-tertiary)] mb-4">
          실제 상황에서 배우는 진짜 일본어
        </p>

        <div className="flex flex-col gap-4">
          {SERIES_LIST.map((series) => {
            const episodes = getEpisodesBySeriesId(series.id)
            const readCount = episodes.filter((ep) => readIds.has(ep.id)).length
            const progressPct = episodes.length > 0 ? Math.round((readCount / episodes.length) * 100) : 0
            return (
              <div
                key={series.id}
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-surface)' }}
              >
                {/* 시리즈 헤더 */}
                <div
                  className="px-4 py-4"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{series.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium text-body">{series.name_jp}</p>
                      <p className="text-white/70 text-caption">{series.name_kr}</p>
                    </div>
                    {readCount > 0 && (
                      <span className="text-[11px] font-bold text-white/90">{readCount}/{episodes.length}</span>
                    )}
                  </div>
                  <p className="text-white/80 text-caption mt-2 leading-relaxed">{series.description}</p>
                  {/* 진행률 바 */}
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#f39c12' : 'rgba(255,255,255,0.8)' }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                    >
                      {series.available}/{series.total} 공개
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                    >
                      #{series.tag}
                    </span>
                    {progressPct === 100 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium animate-pulse" style={{ backgroundColor: '#f39c12', color: '#fff' }}>
                        🏆 완주!
                      </span>
                    )}
                  </div>
                </div>

                {/* 에피소드 목록 */}
                <div className="divide-y" style={{ borderColor: 'var(--color-hairline)' }}>
                  {episodes.map((ep) => {
                    const isRead = readIds.has(ep.id)
                    return (
                    <button
                      key={ep.id}
                      onClick={() => router.push(`/life/${ep.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-70"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                        style={{ backgroundColor: isRead ? 'var(--color-accent)' : 'var(--color-hairline)', color: isRead ? '#fff' : 'var(--text-tertiary)' }}
                      >
                        {isRead ? '✓' : ep.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-caption font-medium text-[var(--text-primary)] truncate">{ep.scene_kr}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">#{ep.tag} · 표현 {ep.expressions.length}개</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                        <path d="M9 18l6-6-6-6" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    )
                  })}

                  {/* 완주 후 채팅 유도 */}
                  {progressPct === 100 && (
                    <div className="px-4 py-3" style={{ backgroundColor: '#fef6ec', borderTop: '1px solid #fde8c8' }}>
                      <p className="text-caption font-medium mb-2" style={{ color: '#e67e22' }}>
                        🎉 이 에피소드 표현을 써봤나요?
                      </p>
                      <button
                        onClick={() => router.push('/')}
                        className="w-full py-2 rounded-xl text-caption font-medium text-white active:opacity-80"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      >
                        채팅 탭에서 연습하기 →
                      </button>
                    </div>
                  )}
                  {/* 잠긴 에피소드 */}
                  {Array.from({ length: series.total - series.available }).map((_, i) => (
                    <div
                      key={`locked-${i}`}
                      className="flex items-center gap-3 px-4 py-3 opacity-40"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-hairline)', color: 'var(--text-tertiary)' }}
                      >
                        {series.available + i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-caption text-[var(--text-tertiary)]">곧 추가됩니다</p>
                      </div>
                      <span className="text-[11px] text-[var(--text-tertiary)]">🔒</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
