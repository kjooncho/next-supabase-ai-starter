import { OnboardingData, LEVELS, SITUATIONS } from '@/lib/onboarding'

interface Step5CompleteProps {
  data: OnboardingData
}

export default function Step5Complete({ data }: Step5CompleteProps) {
  const levelLabel = LEVELS.find((l) => l.id === data.level)?.label || data.level
  const situationLabels = SITUATIONS.filter((s) => data.lifeSituations.includes(s.id))
    .map((s) => s.label)
    .join(', ')

  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-h1 text-[var(--color-primary)] mb-2">준비 완료!</h2>
        <p className="text-body text-[var(--text-secondary)]">아래가 맞나요?</p>
      </div>

      <div className="space-y-3 bg-[var(--color-surface)]/50 p-6 rounded-lg">
        <div>
          <p className="text-caption text-[var(--text-secondary)]">이름</p>
          <p className="text-body-md font-semibold text-[var(--color-primary)] mt-1">{data.displayName}</p>
        </div>
        <div>
          <p className="text-caption text-[var(--text-secondary)]">레벨</p>
          <p className="text-body-md font-semibold text-[var(--color-primary)] mt-1">{levelLabel}</p>
        </div>
        <div>
          <p className="text-caption text-[var(--text-secondary)]">상황</p>
          <p className="text-body-md font-semibold text-[var(--color-primary)] mt-1">{situationLabels}</p>
        </div>
      </div>

      <p className="text-caption text-[var(--text-secondary)]">언제든 설정에서 변경할 수 있어요.</p>
    </div>
  )
}
