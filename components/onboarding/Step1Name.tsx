interface Step1NameProps {
  value: string
  onChange: (value: string) => void
}

export default function Step1Name({ value, onChange }: Step1NameProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1 text-[var(--color-primary)]">안녕하세요!</h1>
        <p className="text-body text-[var(--text-secondary)] mt-2">먼저 이름을 알려주세요.</p>
      </div>
      <input
        type="text"
        placeholder="이름을 입력하세요"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border-2 border-[var(--color-hairline)] rounded-lg focus:border-[var(--color-accent)] focus:outline-none text-body"
      />
    </div>
  )
}
