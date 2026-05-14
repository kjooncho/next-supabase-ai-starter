'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getEpisodeById, getEpisodesBySeriesId, SERIES_LIST } from '@/lib/episodes'
import { createBrowserSupabase } from '@/lib/supabase'
import JpReading from '@/components/ui/JpReading'

function Section({ title, children, defaultOpen = false }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid var(--color-hairline)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-body font-medium text-left active:opacity-70"
      >
        {title}
        <span className="text-[var(--text-tertiary)]">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

export default function EpisodePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const episode = getEpisodeById(id)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!episode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-body text-[var(--text-tertiary)]">에피소드를 찾을 수 없어요</p>
      </div>
    )
  }

  const seriesEpisodes = getEpisodesBySeriesId(episode.series_id)
  const currentIdx = seriesEpisodes.findIndex((e) => e.id === id)
  const nextEpisode = seriesEpisodes[currentIdx + 1]

  const handleSaveCards = async () => {
    setSaving(true)
    const supabase = createBrowserSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const cards = episode.expressions.map((expr) => ({
      user_id: user.id,
      card_type: 'episode',
      learning_status: 'learning',
      has_real_use: false,
      payload: {
        episode_id: episode.id,
        title_kr: episode.series_name_kr,
        title_jp: episode.series_name_jp,
        dialogue: [
          { speaker: 'grandma', japanese: expr.japanese, reading: expr.reading, pronunciation: expr.pronunciation, korean: expr.korean },
        ],
      },
    }))

    await supabase.from('cards').insert(cards)
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-10 flex items-center px-4 h-[56px]"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <button onClick={() => router.back()} className="text-white mr-3 active:opacity-60">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-white text-body font-medium leading-none">{episode.series_name_jp}</p>
          <p className="text-white/60 text-[11px] mt-0.5">
            {episode.number}/{SERIES_LIST.find((s) => s.id === episode.series_id)?.total ?? seriesEpisodes.length} · #{episode.tag}
          </p>
        </div>
      </div>

      {/* 스크롤 본문 */}
      <div className="flex-1 overflow-y-auto px-5 pb-[100px]" style={{ paddingTop: '72px' }}>
        {/* 오늘의 장면 */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
        >
          <p className="text-caption font-medium mb-2" style={{ color: 'var(--color-accent)' }}>
            오늘의 장면
          </p>
          <p className="text-body text-[var(--text-secondary)] leading-relaxed">{episode.scene_kr}</p>
          <p className="font-jp text-caption text-[var(--text-tertiary)] mt-1 leading-relaxed">{episode.scene_jp}</p>
        </div>

        {/* 캐릭터 + 대화 */}
        <div className="mt-4 flex items-start gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: '#e8e0d4' }}
          >
            {episode.character_emoji}
          </div>
          <div className="flex-1">
            <p className="text-caption text-[var(--text-tertiary)] mb-1">{episode.character_name_kr} / {episode.character_name_jp}</p>
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ backgroundColor: 'var(--bubble-ai)', border: '1px solid var(--color-hairline)' }}
            >
              <p className="font-jp text-body leading-relaxed">{episode.dialogue_jp}</p>
              <p className="text-caption text-[var(--text-secondary)] mt-1 leading-relaxed">{episode.dialogue_kr}</p>
            </div>
          </div>
        </div>

        {/* 이게 뭐야? */}
        <div className="mt-5">
          <div
            className="rounded-2xl px-4 py-4 flex flex-col gap-3"
            style={{ backgroundColor: '#fef6ec', border: '1px solid #f5d4a3' }}
          >
            <div>
              <p className="text-caption font-medium mb-2" style={{ color: 'var(--color-cultural)' }}>
                이게 뭐야?
              </p>
              <JpReading
                japanese={episode.vocab_word}
                reading={episode.vocab_reading}
                pronunciation={undefined}
                size="md"
              />
              <p className="text-caption text-[var(--text-secondary)] mt-1">{episode.vocab_meaning}</p>
            </div>

            <div>
              <p className="text-[10px] font-medium text-[var(--color-cultural)] mb-1">[예시]</p>
              <p className="text-caption text-[var(--text-secondary)] leading-relaxed">{episode.vocab_example_jp}</p>
            </div>

            <div>
              <p className="text-[10px] font-medium text-[var(--color-cultural)] mb-1">[한국과 비교]</p>
              <p className="text-caption text-[var(--text-secondary)] leading-relaxed">{episode.vocab_korea_compare}</p>
            </div>
          </div>
        </div>

        {/* 접히는 섹션들 */}
        <div className="mt-4">
          <Section title="이때 쓰는 말" defaultOpen>
            <div className="flex flex-col gap-2">
              {episode.expressions.map((expr, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}
                >
                  <JpReading
                    japanese={expr.japanese}
                    reading={expr.reading}
                    pronunciation={expr.pronunciation}
                    size="base"
                  />
                  <p className="text-caption text-[var(--text-secondary)] mt-1.5 font-medium">{expr.korean}</p>
                  {expr.example && (
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1 font-jp">· {expr.example}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="더 깊이 읽기">
            <p className="text-caption text-[var(--text-secondary)] leading-relaxed">{episode.deeper_reading}</p>
          </Section>

          <Section title="오늘의 표현 3가지">
            <div className="flex flex-col gap-3">
              {episode.expressions.map((expr, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-jp text-caption font-medium">{expr.japanese}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{expr.reading}</span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-accent)' }}>{expr.pronunciation}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">— {expr.korean}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* 하단 고정 액션 */}
      <div
        className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 py-3 flex gap-2"
        style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-hairline)' }}
      >
        <button
          onClick={handleSaveCards}
          disabled={saved || saving}
          className="flex-1 py-3 rounded-xl text-body font-medium active:opacity-70 disabled:opacity-50"
          style={{
            backgroundColor: saved ? '#e8f5e9' : 'var(--color-surface)',
            border: '1px solid var(--color-hairline)',
            color: saved ? '#2e7d32' : 'var(--text-secondary)',
          }}
        >
          {saving ? '저장 중…' : saved ? '✓ 카드 저장됨' : `카드 저장 (${episode.expressions.length}장)`}
        </button>
        {nextEpisode ? (
          <button
            onClick={() => router.push(`/life/${nextEpisode.id}`)}
            className="flex-1 py-3 rounded-xl text-body font-medium text-white active:opacity-70"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            다음 에피소드 →
          </button>
        ) : (
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl text-body font-medium active:opacity-70"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', color: 'var(--text-secondary)' }}
          >
            목록으로
          </button>
        )}
      </div>
    </div>
  )
}
