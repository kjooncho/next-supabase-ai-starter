import { LEVELS, type OnboardingData } from '@/lib/onboarding'

interface Step2LevelProps {
  value: OnboardingData['level']
  onChange: (value: OnboardingData['level']) => void
}

export default function Step2Level({ value, onChange }: Step2LevelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-h2 text-[var(--color-primary)]">일본어 수준은?</h2>
        <p className="text-body text-[var(--text-secondary)] mt-2">현재 수준을 선택해주세요.</p>
      </div>
      <div className="space-y-2">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onChange(level.id as OnboardingData['level'])}
            className={`w-full p-4 text-left border-2 rounded-lg transition-colors text-body ${
              value === level.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--text-primary)]'
                : 'border-[var(--color-hairline)] hover:border-[var(--color-accent)]/50 text-[var(--text-primary)]'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  )
}
