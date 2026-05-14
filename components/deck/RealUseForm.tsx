'use client'

import { useState } from 'react'
import { Card, SentencePayload, RealUseRecord } from '@/types'
import { createBrowserSupabase } from '@/lib/supabase'

interface RealUseFormProps {
  card: Card
  onClose: () => void
  onSave: (updated: Card) => void
}

const CONTEXT_OPTIONS: RealUseRecord['context'][] = ['직장', '육아', '일상', '소설', '관광']

export default function RealUseForm({ card, onClose, onSave }: RealUseFormProps) {
  const payload = card.payload as SentencePayload
  const mainJp = payload.step2_versions?.[payload.recommended_version] ?? ''

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '년 ').replace('.', '월 ').replace('.', '일')

  const [context, setContext] = useState<RealUseRecord['context']>('일상')
  const [memo, setMemo] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const records = payload.real_use_records ?? []
  const totalRecords = records.length + 1

  const handleSave = async () => {
    if (!memo.trim()) return
    setSaving(true)

    const newRecord: RealUseRecord = {
      date: new Date().toISOString().slice(0, 10),
      context,
      memo: memo.trim(),
      notes: notes.trim() || undefined,
    }

    const updatedPayload: SentencePayload = {
      ...payload,
      real_use_records: [...records, newRecord],
    }

    const supabase = createBrowserSupabase()
    const { error } = await supabase
      .from('cards')
      .update({
        has_real_use: true,
        payload: updatedPayload,
      })
      .eq('id', card.id)

    if (!error) {
      onSave({ ...card, has_real_use: true, payload: updatedPayload })
    }
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl pb-[34px] max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-hairline)' }} />
        </div>

        <div className="px-5 flex flex-col gap-4">
          {/* 헤더 */}
          <div>
            <p className="text-caption text-[var(--text-tertiary)]">실전 사용 기록</p>
            <p className="font-jp text-body-md font-medium mt-0.5">{mainJp}</p>
            <p className="text-caption text-[var(--text-secondary)]">어디서, 어떻게 사용했나요?</p>
          </div>

          {/* 날짜 */}
          <div className="flex items-center gap-2">
            <span className="text-caption text-[var(--text-tertiary)]">날짜</span>
            <span className="text-caption text-[var(--text-secondary)]">{today}</span>
          </div>

          {/* 상황 */}
          <div>
            <p className="text-caption text-[var(--text-tertiary)] mb-2">상황</p>
            <div className="flex gap-2 flex-wrap">
              {CONTEXT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setContext(opt)}
                  className="px-3 py-1.5 rounded-full text-caption font-medium transition-colors"
                  style={{
                    backgroundColor: context === opt ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: context === opt ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${context === opt ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 어떻게요? */}
          <div>
            <p className="text-caption text-[var(--text-tertiary)] mb-1">어떻게요?</p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="어떤 상황에서 써봤나요? 상대방 반응은 어땠나요?"
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-caption resize-none outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 제점 (선택) */}
          <div>
            <p className="text-caption text-[var(--text-tertiary)] mb-1">제점 <span className="text-[10px]">(선택)</span></p>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="아쉬웠던 점이나 다음에 더 잘하고 싶은 것"
              className="w-full rounded-xl px-3 py-2.5 text-caption outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 진행도 */}
          <div className="flex items-center justify-between">
            <p className="text-caption text-[var(--text-tertiary)]">사용 기록</p>
            <p className="text-caption font-medium" style={{ color: 'var(--color-accent)' }}>
              {totalRecords}회
            </p>
          </div>

          {/* 저장 */}
          <button
            onClick={handleSave}
            disabled={!memo.trim() || saving}
            className="w-full py-3.5 rounded-2xl text-body font-medium flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
          >
            ✓ 확인 완료!
          </button>
        </div>
      </div>
    </div>
  )
}
