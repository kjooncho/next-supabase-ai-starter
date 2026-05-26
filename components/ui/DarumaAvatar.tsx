export type DarumaExpression = 'default' | 'thinking' | 'cultural' | 'explain' | 'done'

interface Props {
  expression?: DarumaExpression
  size?: number
  className?: string
}

function DefaultFace() {
  return (
    <>
      <circle cx="32" cy="37" r="4" fill="#1a1f3d" />
      <circle cx="48" cy="37" r="4" fill="#1a1f3d" />
      <line
        x1="34" y1="47" x2="46" y2="47"
        stroke="#1a1f3d" strokeWidth="2.5" strokeLinecap="round"
      />
    </>
  )
}

export default function DarumaAvatar({
  expression = 'default',
  size = 36,
  className,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`AI-Nichi 달마`}
      className={className}
    >
      <ellipse
        cx="40" cy="42"
        rx="30" ry="35"
        fill="var(--color-accent)"
        stroke="#1a1f3d"
        strokeWidth="3"
      />
      {expression === 'default' && <DefaultFace />}
    </svg>
  )
}
