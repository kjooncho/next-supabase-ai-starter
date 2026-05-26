import { SITUATIONS } from '@/lib/onboarding'

interface Step3SituationsProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function Step3Situations({ value, onChange }: Step3SituationsProps) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else if (value.length < 2) {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-h2 text-[var(--color-primary)]">어디에서 쓸 일이 많아요?</h2>
        <p className="text-body text-[var(--text-secondary)] mt-2">최대 2개까지 선택 가능합니다.</p>
      </div>
      <div className="space-y-2">
        {SITUATIONS.map((situation) => (
          <button
            key={situation.id}
            onClick={() => toggle(situation.id)}
            className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
              value.includes(situation.id)
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                : 'border-[var(--color-hairline)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                  value.includes(situation.id)
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                    : 'border-[var(--text-secondary)]'
                }`}
              >
                {value.includes(situation.id) && <span className="text-white text-sm font-bold">✓</span>}
              </div>
              <span className="text-body text-[var(--text-primary)]">{situation.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
