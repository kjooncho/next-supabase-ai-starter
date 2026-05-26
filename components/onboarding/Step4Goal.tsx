import { GOALS } from '@/lib/onboarding'

interface Step4GoalProps {
  value: string
  onChange: (value: string) => void
}

export default function Step4Goal({ value, onChange }: Step4GoalProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-h2 text-[var(--color-primary)]">어떤 목표가 있으신가요?</h2>
        <p className="text-body text-[var(--text-secondary)] mt-2">하나를 선택해주세요.</p>
      </div>
      <div className="space-y-2">
        {GOALS.map((goal) => (
          <button
            key={goal}
            onClick={() => onChange(goal)}
            className={`w-full p-4 text-left border-2 rounded-lg transition-colors text-body ${
              value === goal
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--text-primary)]'
                : 'border-[var(--color-hairline)] hover:border-[var(--color-accent)]/50 text-[var(--text-primary)]'
            }`}
          >
            {goal}
          </button>
        ))}
      </div>
    </div>
  )
}
