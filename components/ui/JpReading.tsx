interface JpReadingProps {
  japanese: string
  reading?: string
  pronunciation?: string
  size?: 'sm' | 'base' | 'md' | 'lg'
  className?: string
}

export default function JpReading({ japanese, reading, pronunciation, size = 'base', className = '' }: JpReadingProps) {
  const jpSizeClass =
    size === 'sm' ? 'text-[13px]' :
    size === 'md' ? 'text-[17px]' :
    size === 'lg' ? 'text-[24px]' :
    'text-[15px]'

  return (
    <div className={className}>
      <p className={`font-jp font-medium leading-snug ${jpSizeClass}`}>{japanese}</p>
      {reading && (
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-none">{reading}</p>
      )}
      {pronunciation && (
        <p className="text-[10px] mt-0.5 leading-none" style={{ color: 'var(--color-accent)' }}>
          {pronunciation}
        </p>
      )}
    </div>
  )
}
