'use client'

interface StepIndicatorProps {
  currentStep: number // 0~5, -1 = 완료
  totalSteps?: number
  mode?: 'text' | 'image'
}

const STEP_LABELS = ['문화 교정', '구조 대응', '번역 3버전', '문법', '문화 맥락', '니모닉']
const IMAGE_STEP_LABELS = ['이미지 분석', '구조 분석', '한국어 번역', '문법', '문화', '어원']
const STEP_COLORS = [
  'var(--step-0)',
  'var(--step-1)',
  'var(--step-2)',
  'var(--step-3)',
  'var(--step-4)',
  'var(--step-5)',
]

export default function StepIndicator({
  currentStep,
  totalSteps = 6,
  mode = 'text',
}: StepIndicatorProps) {
  const labels = mode === 'image' ? IMAGE_STEP_LABELS : STEP_LABELS
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {labels.slice(0, totalSteps).map((label, i) => {
        const isDone = i < currentStep || currentStep === -1
        const isActive = i === currentStep

        return (
          <div key={i} className="flex items-center gap-1">
            <span
              className={`text-caption flex items-center gap-0.5 transition-opacity ${
                isDone ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-30'
              }`}
              style={{ color: isDone ? 'var(--color-success)' : STEP_COLORS[i] }}
            >
              {isDone ? '✓' : isActive ? (
                <span className="inline-flex gap-0.5">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                </span>
              ) : null}
              {` ${label}`}
            </span>
            {i < totalSteps - 1 && (
              <span className="text-[var(--text-tertiary)] text-caption">›</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
