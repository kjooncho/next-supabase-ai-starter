import { getMasteryStage, LearningStatus, MasteryStage } from '@/types'

interface MasteryBadgeProps {
  stage?: MasteryStage
  learning_status?: LearningStatus
  has_real_use?: boolean
  size?: 'sm' | 'md'
}

const stageConfig: Record<MasteryStage, { label: string; color: string }> = {
  learning:   { label: '학습중',   color: 'var(--mastery-learning)' },
  mastered:   { label: '숙달완료', color: 'var(--mastery-mastered)' },
  'real-use': { label: '써봤어요', color: 'var(--mastery-real-use)' },
  conquered:  { label: '완전정복', color: 'var(--mastery-conquered)' },
}

export default function MasteryBadge({
  stage,
  learning_status,
  has_real_use,
  size = 'sm',
}: MasteryBadgeProps) {
  const resolvedStage: MasteryStage =
    stage ?? getMasteryStage(learning_status ?? 'learning', has_real_use ?? false)

  const { label, color } = stageConfig[resolvedStage]
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-[12px] px-2.5 py-1'

  return (
    <span
      className={`inline-block rounded-full font-medium text-white ${sizeClass}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}
