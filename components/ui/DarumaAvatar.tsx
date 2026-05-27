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
      <line x1="34" y1="47" x2="46" y2="47" stroke="#1a1f3d" strokeWidth="2.5" strokeLinecap="round" />
    </>
  )
}

function ThinkingFace() {
  return (
    <>
      {/* squinted eyes */}
      <ellipse cx="32" cy="37" rx="4" ry="2.5" fill="#1a1f3d" />
      <ellipse cx="48" cy="37" rx="4" ry="2.5" fill="#1a1f3d" />
      {/* raised right eyebrow */}
      <path d="M44 32 Q48 29 52 32" stroke="#1a1f3d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* uncertain mouth - slight inverse curve */}
      <path d="M35 49 Q40 46 45 49" stroke="#1a1f3d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </>
  )
}

function CulturalFace() {
  return (
    <>
      {/* wide surprised eyes */}
      <circle cx="32" cy="36" r="5.5" fill="#1a1f3d" />
      <circle cx="48" cy="36" r="5.5" fill="#1a1f3d" />
      {/* eye highlights */}
      <circle cx="30" cy="34" r="1.8" fill="white" />
      <circle cx="46" cy="34" r="1.8" fill="white" />
      {/* O mouth - surprised */}
      <ellipse cx="40" cy="49" rx="4.5" ry="3.5" fill="#1a1f3d" />
    </>
  )
}

function ExplainFace() {
  return (
    <>
      {/* normal eyes */}
      <circle cx="32" cy="37" r="4" fill="#1a1f3d" />
      <circle cx="48" cy="37" r="4" fill="#1a1f3d" />
      {/* open talking mouth - filled half-oval */}
      <path d="M34 44 L46 44 Q46 53 40 53 Q34 53 34 44 Z" fill="#1a1f3d" />
    </>
  )
}

function DoneFace() {
  return (
    <>
      {/* smile eyes - upward arcs */}
      <path d="M27 39 Q32 34 37 39" stroke="#1a1f3d" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M43 39 Q48 34 53 39" stroke="#1a1f3d" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* big smile */}
      <path d="M30 46 Q40 57 50 46" stroke="#1a1f3d" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  )
}

const FACE_MAP = {
  default: DefaultFace,
  thinking: ThinkingFace,
  cultural: CulturalFace,
  explain: ExplainFace,
  done: DoneFace,
}

export default function DarumaAvatar({ expression = 'default', size = 36, className }: Props) {
  const Face = FACE_MAP[expression]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AI-Nichi 달마"
      className={className}
    >
      <ellipse cx="40" cy="42" rx="30" ry="35" fill="var(--color-accent)" stroke="#1a1f3d" strokeWidth="3" />
      <Face />
    </svg>
  )
}
